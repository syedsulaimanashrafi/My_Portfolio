// ✅ Updated GatewayRepository.ts with correct conflict-first logic and fixes for tests
import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO"; 
import { MeasurementsDAO } from "@models/dao/MeasurementsDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

export class GatewayRepository {
  private repo: Repository<GatewayDAO> = AppDataSource.getRepository(GatewayDAO);
  private networkRepo: Repository<NetworkDAO> = AppDataSource.getRepository(NetworkDAO);

  async getAllGateways(networkCode: string): Promise<GatewayDAO[]> {
    const network = await this.networkRepo.findOne({
      where: { code: networkCode },
      relations: ["gateways", "gateways.sensors"]
    });
    if (!network) throw new NotFoundError(`Network with code '${networkCode}' not found`);
    return network.gateways;
  }

  async getGateway(networkCode: string, macAddress: string): Promise<GatewayDAO> {
    const network = await this.networkRepo.findOne({
      where: { code: networkCode },
      relations: ["gateways", "gateways.sensors"]
    });
    if (!network) throw new NotFoundError(`Network with code '${networkCode}' not found`);
    return findOrThrowNotFound(
      network.gateways,
      (gw) => gw.macAddress === macAddress,
      `Gateway with MAC address '${macAddress}' not found`
    );
  }

  async createGateway(networkCode: string, gatewayData: { macAddress: string; name: string; description: string }): Promise<GatewayDAO> {
    const network = await this.networkRepo.findOne({ where: { code: networkCode } });
    if (!network) throw new NotFoundError(`Network with code '${networkCode}' not found`);

    throwConflictIfFound(
      await this.repo.find({ where: { macAddress: gatewayData.macAddress } }),
      () => true,
      `Gateway with MAC address '${gatewayData.macAddress}' already exists`
    );

    const gateway = new GatewayDAO();
    gateway.macAddress = gatewayData.macAddress;
    gateway.name = gatewayData.name;
    gateway.description = gatewayData.description;
    gateway.network = network;
    return await this.repo.save(gateway);
  }

  async updateGateway(
    networkCode: string,
    oldMacAddress: string,
    updatedData: { macAddress?: string; name?: string; description?: string }
  ): Promise<GatewayDAO> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (updatedData.macAddress && updatedData.macAddress !== oldMacAddress) {
        const conflict = await queryRunner.manager.findOne(GatewayDAO, {
          where: { macAddress: updatedData.macAddress }
        });
        if (conflict) {
          throw new ConflictError(`Gateway with MAC address '${updatedData.macAddress}' already exists`);
        }
      }

      const existingGateway = await queryRunner.manager.findOne(GatewayDAO, {
        where: { macAddress: oldMacAddress },
        relations: {
          network: true,
          sensors: {
            measurementsGroup: {
              measurements: true
            }
          }
        }
      });

      if (!existingGateway || !existingGateway.network || existingGateway.network.code !== networkCode) {
        throw new NotFoundError(`Gateway with MAC address '${oldMacAddress}' not found in network '${networkCode}'`);
      }

      existingGateway.macAddress = updatedData.macAddress || existingGateway.macAddress;
      existingGateway.name = updatedData.name || existingGateway.name;
      existingGateway.description = updatedData.description || existingGateway.description;

      const savedGateway = await queryRunner.manager.save(existingGateway);

      if (updatedData.macAddress && existingGateway.sensors) {
        for (const sensor of existingGateway.sensors) {
          sensor.gateway = savedGateway;
          sensor.gatewayId = savedGateway.macAddress;
          await queryRunner.manager.save(sensor);

          if (sensor.measurementsGroup) {
            for (const mg of sensor.measurementsGroup) {
              mg.sensor = sensor;
              await queryRunner.manager.save(mg);
              if (mg.measurements) {
                for (const measurement of mg.measurements) {
                  measurement.measurements = mg;
                  await queryRunner.manager.save(measurement);
                }
              }
            }
          }
        }
      }

      await queryRunner.commitTransaction();

      if (updatedData.macAddress && updatedData.macAddress !== oldMacAddress) {
        await this.repo.delete({ macAddress: oldMacAddress });
      }

      return await this.repo.findOne({
        where: { macAddress: updatedData.macAddress || oldMacAddress },
        relations: ["network", "sensors", "sensors.measurementsGroup", "sensors.measurementsGroup.measurements"]
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteGateway(networkCode: string, macAddress: string): Promise<void> {
    const gateway = await this.getGateway(networkCode, macAddress);
    await this.repo.remove(gateway);
  }
}
