import { NetworkDAO } from "@models/dao/NetworkDAO";
import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { Gateway } from "@models/dto/Gateway";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { Network as NetworkDTO } from "@dto/Network";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { SensorRepository } from "./SensorRepository";
import { GatewayRepository } from "./GatewayRepository";

export class NetworkRepository {
  private repo: Repository<NetworkDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(NetworkDAO);
  }

  getAllNetworks(): Promise<NetworkDAO[]> {
    return this.repo.find({
      relations: ["gateways", "gateways.sensors"],
    });
  }

  async getNetworkByCode(code: string): Promise<NetworkDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { code }, relations: ["gateways", "gateways.sensors"] }),
      () => true,
      `Network with code '${code}' not found`
    );
  }

  async createNetwork(
    code: string,
    name: string,
    description: string,
    gateways: Array<Gateway>
  ): Promise<NetworkDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { code } }),
      () => true,
      `Network with code '${code}' already exists`
    );

    return this.repo.save({
      code,
      name,
      description,
      gateways,
    });
  }

  async updateNetwork(oldCode: string, updatedNetwork: NetworkDTO): Promise<void> {
    if (!updatedNetwork.code || !updatedNetwork.name || !updatedNetwork.description) {
      throw new Error("All fields (code, name, and description) must be provided.");
    }

    if (updatedNetwork.code !== oldCode) {
      try {
        // see if a network with the *new* code already exists
        await this.getNetworkByCode(updatedNetwork.code);
        // if we get here, that code is in use → conflict
        throw new ConflictError(`Network with code '${updatedNetwork.code}' already exists`);
      } catch (err) {
        // If getNetworkByCode threw NotFoundError, that means “dto.code” is unused → safe to proceed.
        if (!(err instanceof NotFoundError)) {
          throw err; // propagate any other error
        }
      }
    }

    const existingNetwork = await this.getNetworkByCode(oldCode);

    const newNetwork = new NetworkDAO();
    newNetwork.code = updatedNetwork.code;
    newNetwork.name = updatedNetwork.name;
    newNetwork.description = updatedNetwork.description;
    newNetwork.gateways = [];

    for (const oldGateway of existingNetwork.gateways) {
      const newGateway = new GatewayDAO();
      newGateway.macAddress = oldGateway.macAddress;
      newGateway.name = oldGateway.name;
      newGateway.description = oldGateway.description;
      newGateway.network = newNetwork;

      newGateway.sensors = (oldGateway.sensors || []).map(oldSensor => {
        const newSensor = new SensorDAO();
        newSensor.macAddress = oldSensor.macAddress;
        newSensor.name = oldSensor.name;
        newSensor.description = oldSensor.description;
        newSensor.variable = oldSensor.variable;
        newSensor.unit = oldSensor.unit;
        newSensor.gateway = newGateway;
        // Removed: newSensor.networkCode = updatedNetwork.code; (does not exist in SensorDAO)
        return newSensor;
      });

      newNetwork.gateways.push(newGateway);
    }

    // Save new network with updated structure
    await this.repo.save(newNetwork);

    // Remove old network by oldCode
    await this.repo.delete(oldCode);
  }

  async deleteNetwork(code: string): Promise<void> {
    const network = await this.getNetworkByCode(code);
    if (!network) {
      throw new NotFoundError(`Network with code '${code}' not found`);
    }
    await this.repo.remove(network);
  }
}
