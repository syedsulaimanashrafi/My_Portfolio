import { NetworkRepository } from "@repositories/NetworkRepository";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { Gateway } from "@models/dto/Gateway";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave,
      remove: mockRemove
    })
  }
}));

describe("NetworkRepository: mocked database", () => {
  const repo = new NetworkRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create network", async () => {
    mockFind.mockResolvedValue([]);

    const network = new NetworkDAO();
    network.code = "NET1";
    network.name = "Network One";
    network.description = "First test network";
    network.gateways = [];

    mockSave.mockResolvedValue(network);

    const result = await repo.createNetwork("NET1", "Network One", "First test network", []);

    expect(result).toBeInstanceOf(NetworkDAO);
    expect(result.code).toBe("NET1");
    expect(result.name).toBe("Network One");
    expect(result.description).toBe("First test network");
    expect(mockSave).toHaveBeenCalledWith({
      code: "NET1",
      name: "Network One",
      description: "First test network",
      gateways: []
    });
  });

  it("create network: conflict", async () => {
    const existing = new NetworkDAO();
    existing.code = "NET1";

    mockFind.mockResolvedValue([existing]);

    await expect(
      repo.createNetwork("NET1", "Duplicate", "Dup description", [])
    ).rejects.toThrow(ConflictError);
  });

  it("get network by code", async () => {
    const network = new NetworkDAO();
    network.code = "NET1";
    network.name = "Network One";
    network.description = "Test network";
    network.gateways = [];

    mockFind.mockResolvedValue([network]);

    const result = await repo.getNetworkByCode("NET1");

    expect(result).toBe(network);
    expect(result.name).toBe("Network One");
  });

  it("get network by code: not found", async () => {
    mockFind.mockResolvedValue([]);

    await expect(repo.getNetworkByCode("UNKNOWN")).rejects.toThrow(NotFoundError);
  });

  it("delete network", async () => {
    const network = new NetworkDAO();
    network.code = "NET1";

    mockFind.mockResolvedValue([network]);
    mockRemove.mockResolvedValue(undefined);

    await repo.deleteNetwork("NET1");

    expect(mockRemove).toHaveBeenCalledWith(network);
  });
});