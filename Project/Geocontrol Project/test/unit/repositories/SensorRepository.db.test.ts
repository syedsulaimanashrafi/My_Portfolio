import { SensorRepository } from "@repositories/SensorRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import {
  initializeTestDataSource,
  closeTestDataSource
} from "@test/setup/test-datasource";
import { SensorDAO } from "@models/dao/SensorDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

let netRepo: NetworkRepository;
let gwRepo: GatewayRepository;
let sensorRepo: SensorRepository;

beforeAll(async () => {
  await initializeTestDataSource();
  netRepo = new NetworkRepository();
  gwRepo  = new GatewayRepository();
  sensorRepo = new SensorRepository();
});

afterAll(async () => {
  await closeTestDataSource();
});

describe("SensorRepository (db)", () => {
  it("creates and retrieves a sensor", async () => {
    await netRepo.createNetwork("NET1", "Net One", "...", []);
    await gwRepo.createGateway("NET1", { macAddress:"GW1", name:"G1", description:"..." });

    const s = new SensorDAO();
    s.macAddress  = "S1";
    s.name        = "Sensor One";
    s.description = "...";
    s.variable    = "temperature";
    s.unit        = "°C";

    const created = await sensorRepo.createSensor("NET1","GW1", s);
    expect(created.macAddress).toBe("S1");

    const list = await sensorRepo.getAllSensors("NET1","GW1");
    expect(list).toHaveLength(1);

    const fetched = await sensorRepo.getSensor("NET1","GW1","S1");
    expect(fetched.macAddress).toBe("S1");
  });

  it("throws on duplicate create", async () => {
    const dup = new SensorDAO();
    dup.macAddress  = "S1";
    dup.name        = "Dup";
    dup.description = "...";
    dup.variable    = "temperature";
    dup.unit        = "°C";
    await expect(
      sensorRepo.createSensor("NET1","GW1", dup)
    ).rejects.toThrow(ConflictError);
  });

  it("throws NotFound on unknown sensor", async () => {
    await expect(
      sensorRepo.getSensor("NET1","GW1","UNKNOWN")
    ).rejects.toThrow(NotFoundError);
  });

  it("updates and deletes", async () => {
    const upd = await sensorRepo.updateSensor("NET1","GW1","S1",{ name:"X" });
    expect(upd.name).toBe("X");

    await sensorRepo.deleteSensor("NET1","GW1","S1");
    await expect(
      sensorRepo.getSensor("NET1","GW1","S1")
    ).rejects.toThrow(NotFoundError);
  });
});
