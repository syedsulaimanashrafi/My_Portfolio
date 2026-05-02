// test/unit/repositories/SensorRepository.mock.test.ts
import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@models/dao/SensorDAO";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

// stub TypeORM repo
const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave,
      remove: mockRemove,
    }),
  },
}));

// stub GatewayRepository
const getGatewayMock = jest.fn();
jest.mock("@repositories/GatewayRepository", () => ({
  GatewayRepository: jest.fn().mockImplementation(() => ({
    getGateway: getGatewayMock,
  })),
}));

describe("SensorRepository (mock)", () => {
  let repo: SensorRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new SensorRepository();
  });

  it("getAllSensors — returns list", async () => {
    const sensors = [ new SensorDAO(), new SensorDAO() ];
    mockFind.mockResolvedValue(sensors);

    await expect(repo.getAllSensors("NET1", "GW-MAC"))
      .resolves.toBe(sensors);
    expect(getGatewayMock).toHaveBeenCalledWith("NET1", "GW-MAC");
    expect(mockFind).toHaveBeenCalledWith({ where: { gatewayId: "GW-MAC" } });
  });

  it("getSensor — not found", async () => {
    mockFind.mockResolvedValue([]);
    await expect(repo.getSensor("NET1", "GW", "S1"))
      .rejects.toThrow(NotFoundError);
  });

  it("getSensor — found", async () => {
    const s = new SensorDAO(); s.macAddress = "S1";
    mockFind.mockResolvedValue([ s ]);
    await expect(repo.getSensor("NET1", "GW", "S1"))
      .resolves.toBe(s);
  });

  it("createSensor — conflict", async () => {
    const s = new SensorDAO(); s.macAddress = "S1";
    mockFind.mockResolvedValue([ s ]);
    await expect(repo.createSensor("NET1", "GW", s))
      .rejects.toThrow(ConflictError);
  });

  it("createSensor — success", async () => {
    mockFind.mockResolvedValue([]); 
    const s = new SensorDAO();
    s.macAddress = "S1"; s.gatewayId = "";
    mockSave.mockResolvedValue({ ...s, gatewayId: "GW" });

    await expect(repo.createSensor("NET1", "GW", s))
      .resolves.toMatchObject({ macAddress: "S1", gatewayId: "GW" });
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ gatewayId: "GW" })
    );
  });

  it("updateSensor — success", async () => {
    const s = new SensorDAO();
    s.macAddress = "S1"; s.gatewayId = "GW"; s.name = "old";
    mockFind.mockResolvedValue([ s ]);
    mockSave.mockResolvedValue({ ...s, name: "new" });

    await expect(
      repo.updateSensor("NET1", "GW", "S1", { name: "new" })
    ).resolves.toMatchObject({ name: "new" });
  });

  it("deleteSensor — calls remove", async () => {
    const s = new SensorDAO(); s.macAddress = "S1";
    mockFind.mockResolvedValue([ s ]);
    mockRemove.mockResolvedValue(undefined);

    await repo.deleteSensor("NET1", "GW", "S1");
    expect(mockRemove).toHaveBeenCalledWith(s);
  });
});
