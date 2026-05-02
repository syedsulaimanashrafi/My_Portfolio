import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("GatewayRepository: SQLite in-memory", () => {
  const gatewayRepo = new GatewayRepository();
  const networkRepo = new NetworkRepository();

  it("should create and retrieve a gateway", async () => {
    await networkRepo.createNetwork("NET1", "Network 1", "Desc", []);
    const created = await gatewayRepo.createGateway("NET1", {
      macAddress: "GW1",
      name: "Gateway 1",
      description: "Desc"
    });

    expect(created).toMatchObject({
      macAddress: "GW1",
      name: "Gateway 1"
    });

    const retrieved = await gatewayRepo.getGateway("NET1", "GW1");
    expect(retrieved.macAddress).toBe("GW1");
  });

  it("should throw ConflictError when gateway already exists", async () => {
    await networkRepo.createNetwork("NET1", "Network 1", "Desc", []);
    await gatewayRepo.createGateway("NET1", {
      macAddress: "GW1",
      name: "Gateway 1",
      description: "Desc"
    });

    await expect(
      gatewayRepo.createGateway("NET1", {
        macAddress: "GW1",
        name: "Duplicate Gateway",
        description: "Dup"
      })
    ).rejects.toThrow(ConflictError);
  });

  it("should update gateway and preserve sensors", async () => {
    await networkRepo.createNetwork("NET1", "Network 1", "Desc", []);
    await gatewayRepo.createGateway("NET1", {
      macAddress: "GW1",
      name: "Gateway 1",
      description: "Desc"
    });

    const updated = await gatewayRepo.updateGateway("NET1", "GW1", {
      macAddress: "GW2",
      name: "Updated Gateway",
      description: "Updated"
    });

    expect(updated.macAddress).toBe("GW2");
    expect(updated.name).toBe("Updated Gateway");
  });

  it("should delete a gateway", async () => {
    await networkRepo.createNetwork("NET1", "Network 1", "Desc", []);
    await gatewayRepo.createGateway("NET1", {
      macAddress: "GW1",
      name: "Gateway 1",
      description: "Desc"
    });

    await gatewayRepo.deleteGateway("NET1", "GW1");
    await expect(
      gatewayRepo.getGateway("NET1", "GW1")
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError if network does not exist", async () => {
    await expect(
      gatewayRepo.getGateway("NET_UNKNOWN", "GW1")
    ).rejects.toThrow(Error);
  });
});
