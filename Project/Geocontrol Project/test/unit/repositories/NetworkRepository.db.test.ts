import { NetworkRepository } from "@repositories/NetworkRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { Gateway } from "@models/dto/Gateway";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { createGatewayService } from "@services/gatewayService";
import { createSensorService } from "@services/SensorService";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("NetworkRepository: SQLite in-memory", () => {
  const repo = new NetworkRepository();

  it("create and retrieve network", async () => {
    const gateways: Gateway[] = [];
    const created = await repo.createNetwork("NET1", "Network 1", "Desc 1", gateways);

    expect(created).toMatchObject({
      code: "NET1",
      name: "Network 1",
      description: "Desc 1",
      gateways: []
    });

    const found = await repo.getNetworkByCode("NET1");
    expect(found.code).toBe("NET1");
    expect(found.gateways).toEqual([]);
  });

  it("create network: conflict", async () => {
    await repo.createNetwork("NET1", "Network 1", "Desc 1", []);
    await expect(
      repo.createNetwork("NET1", "Network Dup", "Desc Dup", [])
    ).rejects.toThrow(ConflictError);
  });

  it("get network by code: not found", async () => {
    await expect(repo.getNetworkByCode("UNKNOWN")).rejects.toThrow(NotFoundError);
  });

  it("should preserve gateways and sensors when updating network code", async () => {
    const oldCode = "NET1";
    const newCode = "NET2";
  

    await repo.createNetwork(oldCode, "Original Name", "Original Description", []);
  
    await createGatewayService(oldCode, {
      macAddress: "GW1",
      name: "Gateway 1",
      description: "Gateway Description"
    });
  
    await createSensorService(oldCode, "GW1", {
      macAddress: "S1",
      name: "Sensor 1",
      description: "Sensor Desc",
      variable: "temperature",
      unit: "C"
    });
  
    const original = await repo.getNetworkByCode(oldCode);
    const originalGateways = original.gateways;
    const originalSensors = original.gateways[0].sensors;
  
    await repo.updateNetwork(oldCode, {
      code: newCode,
      name: "Updated Name",
      description: "Updated Desc",
      gateways: [] // ignored
    });
  
    const updated = await repo.getNetworkByCode(newCode);
  
    expect(updated.code).toBe(newCode);
    expect(updated.name).toBe("Updated Name");
    expect(updated.description).toBe("Updated Desc");
    expect(updated.gateways).toHaveLength(originalGateways.length);
    expect(updated.gateways[0].sensors).toHaveLength(originalSensors.length);
  });

  it("delete network", async () => {
    await repo.createNetwork("NET1", "Network 1", "Desc 1", []);
    await repo.deleteNetwork("NET1");
    await expect(repo.getNetworkByCode("NET1")).rejects.toThrow(NotFoundError);
  });
});