// ✅ Fixed GatewayRepository.mock.test.ts to support createQueryRunner
import { GatewayRepository } from "@repositories/GatewayRepository";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    findOne: jest.fn(),
    save: jest.fn(),
  },
};

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      findOne: mockFindOne,
      find: mockFind,
      save: mockSave,
      remove: mockRemove,
      delete: jest.fn(), // ✅ add mock for .delete
    }),
    createQueryRunner: () => mockQueryRunner,
  },
}));

describe("GatewayRepository: mocked database", () => {
  const repo = new GatewayRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updateGateway: updates gateway successfully", async () => {
    const oldGateway = new GatewayDAO();
    oldGateway.macAddress = "GW1";
    oldGateway.name = "Old Gateway";
    oldGateway.description = "Old desc";

    const sensor = new SensorDAO();
    sensor.macAddress = "S1";
    sensor.name = "Sensor 1";
    sensor.description = "Desc";
    sensor.variable = "Temp";
    sensor.unit = "C";

    oldGateway.sensors = [sensor];

    const network = new NetworkDAO();
    network.code = "NET1";
    oldGateway.network = network;

    const updatedGateway = new GatewayDAO();
    updatedGateway.macAddress = "GW2";
    updatedGateway.name = "New Gateway";
    updatedGateway.description = "New desc";
    updatedGateway.sensors = [sensor];

    // First call: check for MAC conflict (none found)
    mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
    // Second call: get the old gateway
    mockQueryRunner.manager.findOne.mockResolvedValueOnce(oldGateway);
    mockQueryRunner.manager.save.mockResolvedValue(updatedGateway);

    mockFindOne.mockResolvedValue({ macAddress: "GW2", name: "New Gateway", description: "New desc" });

    const result = await repo.updateGateway("NET1", "GW1", {
      macAddress: "GW2",
      name: "New Gateway",
      description: "New desc",
    });

    expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(result.macAddress).toBe("GW2");
    expect(result.name).toBe("New Gateway");
  });

  it("updateGateway: throws error if network not found", async () => {
    const existingGateway = new GatewayDAO();
    existingGateway.macAddress = "GW1";
    existingGateway.network = null;

    mockQueryRunner.manager.findOne.mockResolvedValueOnce(null); // conflict check
    mockQueryRunner.manager.findOne.mockResolvedValueOnce(existingGateway); // gateway fetch

    await expect(
      repo.updateGateway("NET1", "GW1", {
        macAddress: "GW2",
        name: "New Name",
        description: "New Desc",
      })
    ).rejects.toThrow(NotFoundError);
  });

  it("updateGateway: throws conflict error if new macAddress exists", async () => {
    const conflictGateway = new GatewayDAO();
    conflictGateway.macAddress = "GW2";

    mockQueryRunner.manager.findOne.mockResolvedValueOnce(conflictGateway); // conflict found

    await expect(
      repo.updateGateway("NET1", "GW1", {
        macAddress: "GW2",
        name: "Name",
        description: "Desc",
      })
    ).rejects.toThrow(ConflictError);
  });
});
