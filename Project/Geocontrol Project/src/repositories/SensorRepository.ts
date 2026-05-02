import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { SensorDAO } from "@models/dao/SensorDAO";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { MeasurementsDAO } from "@models/dao/MeasurementsDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
export class SensorRepository {
  private repo: Repository<SensorDAO>;
  private gatewayRepo = new GatewayRepository();

  constructor() {
    this.repo = AppDataSource.getRepository(SensorDAO);
  }

  async getAllSensors(
    networkCode: string,
    gatewayMac: string
  ): Promise<SensorDAO[]> {
    await this.gatewayRepo.getGateway(networkCode, gatewayMac);
    return this.repo.find({ where: { gatewayId: gatewayMac } });
  }

  async getSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string
  ): Promise<SensorDAO> {
    await this.gatewayRepo.getGateway(networkCode, gatewayMac);
    const all = await this.repo.find({ where: { gatewayId: gatewayMac } });
    return findOrThrowNotFound(
      all,
      (s) => s.macAddress === sensorMac,
      `Sensor with MAC '${sensorMac}' not found`
    );
  }

  async createSensor(
    networkCode: string,
    gatewayMac: string,
    sensor: SensorDAO
  ): Promise<SensorDAO> {
    await this.gatewayRepo.getGateway(networkCode, gatewayMac);
    const existing = await this.repo.find({ where: { gatewayId: gatewayMac } });
    throwConflictIfFound(
      existing,
      (s) => s.macAddress === sensor.macAddress,
      `Sensor with MAC '${sensor.macAddress}' already exists`
    );
    sensor.gatewayId = gatewayMac;
    return this.repo.save(sensor);
  }

  async updateSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string,
    updated: Partial<SensorDAO>
  ): Promise<SensorDAO> {
    const sensor = await this.getSensor(networkCode, gatewayMac, sensorMac);
    const oldMac = sensor.macAddress;
    if (updated.macAddress && updated.macAddress !== oldMac) {
      const allSensors = await this.repo.find({ where: { gatewayId: gatewayMac } });
      const others = allSensors.filter((s) => s.macAddress !== oldMac);
      throwConflictIfFound(
        others,
        (s) => s.macAddress === updated.macAddress,
        `Sensor with MAC '${updated.macAddress}' already exists`
      );
      const newMac = updated.macAddress;
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        // Load the full sensor entity graph
        const loadedSensor = await queryRunner.manager.findOne(SensorDAO, {
          where: { macAddress: oldMac, gatewayId: gatewayMac },
          relations: {
            measurementsGroup: {
              measurements: true
            }
          }
        });
        if (!loadedSensor) throw new Error("Sensor not found for update");
        // Update sensor MAC and other fields
        loadedSensor.macAddress = newMac;
        if (updated.name !== undefined) loadedSensor.name = updated.name;
        if (updated.description !== undefined) loadedSensor.description = updated.description;
        if (updated.variable !== undefined) loadedSensor.variable = updated.variable;
        if (updated.unit !== undefined) loadedSensor.unit = updated.unit;
        // Update measurementsGroup (FK: sensorMacAddress)
        if (loadedSensor.measurementsGroup) {
          for (const mg of loadedSensor.measurementsGroup) {
            mg.sensorMacAddress = newMac;
            mg.sensor = loadedSensor;
            // Update measurements (FK: measurements)
            if (mg.measurements) {
              for (const measurement of mg.measurements) {
                measurement.measurements = mg;
              }
            }
          }
        }
        // Save in order: sensor -> measurementsGroup -> measurements
        await queryRunner.manager.save(loadedSensor);
        if (loadedSensor.measurementsGroup) {
          for (const mg of loadedSensor.measurementsGroup) {
            await queryRunner.manager.save(mg);
            if (mg.measurements) {
              for (const measurement of mg.measurements) {
                await queryRunner.manager.save(measurement);
              }
            }
          }
        }
        // Remove old sensor row if PK changed
        if (oldMac !== newMac) {
          await queryRunner.manager.delete(SensorDAO, { macAddress: oldMac, gatewayId: gatewayMac });
        }
        await queryRunner.commitTransaction();
        return await this.repo.findOneOrFail({ where: { macAddress: newMac, gatewayId: gatewayMac } });
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }
    Object.assign(sensor, updated);
    return this.repo.save(sensor);
  }

  async deleteSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string
  ): Promise<void> {
    const sensor = await this.getSensor(networkCode, gatewayMac, sensorMac);
    await this.repo.remove(sensor);
  }
}
