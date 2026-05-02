import { MeasurementsRepository } from "@repositories/MeasurementsRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
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
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(SensorDAO).clear();
});

describe("MeasurementsRepository: SQLite in-memory", () => {
  const measRepo = new MeasurementsRepository();
  const networkRepo = new NetworkRepository();
  
  const setupNetworkGatewaySensor = async () => {
   
    await networkRepo.createNetwork("NET1", "Network 1", "Description", []);

    await createGatewayService("NET1", {
      macAddress: "GW1",
      name: "Gateway 1",
      description: "Test Gateway"
    });

    await createSensorService("NET1", "GW1", {
      macAddress: "MAC1",
      name: "Sensor 1",
      description: "Test Sensor",
      variable: "temperature",
      unit: "C"
    });
  };

  it("storeMeasurements and retrieve via getMeasPerNetwork", async () => {
    await setupNetworkGatewaySensor();

    const measurements = [
      { createdAt: new Date("2024-01-01T10:00:00Z"), value: 20 },
      { createdAt: new Date("2024-01-01T11:00:00Z"), value: 30 }
    ];

    await measRepo.storeMeasurements("NET1", "GW1", "MAC1", measurements);

    const result = await measRepo.getMeasPerNetwork(
      "NET1",
      ["MAC1"],
      "2024-01-01T00:00:00Z",
      "2024-01-02T00:00:00Z"
    );

    expect(result).toHaveLength(1);
    expect(result[0].sensorMacAddress).toBe("MAC1");
    expect(result[0].measurements.length).toBe(2);
    expect(result[0].stats?.mean).toBe(25);
    expect(result[0].stats?.variance).toBe(25);
  });

  it("getStatisticsPerSensorInNetwork returns correct stats", async () => {
    await setupNetworkGatewaySensor();

    const measurements = [
      { createdAt: new Date("2024-01-01T10:00:00Z"), value: 10 },
      { createdAt: new Date("2024-01-01T12:00:00Z"), value: 30 }
    ];

    await measRepo.storeMeasurements("NET1", "GW1", "MAC1", measurements);

    const stats = await measRepo.getStatisticsPerSensorInNetwork(
      "NET1",
      ["MAC1"],
      "2024-01-01T00:00:00Z",
      "2024-01-02T00:00:00Z"
    );

    expect(stats).toHaveLength(1);
    expect(stats[0].sensorMac).toBe("MAC1");
    expect(stats[0].stats?.mean).toBe(20);
    expect(stats[0].stats?.variance).toBe(100);
    expect(stats[0].stats?.upperThreshold).toBeCloseTo(40); // mean + 2*stdDev (10)
    expect(stats[0].stats?.lowerThreshold).toBeCloseTo(0);  // mean - 2*stdDev (10)
  });

  it("getMeasPerNetwork: throws NotFoundError for unknown network", async () => {
    await expect(
      measRepo.getMeasPerNetwork("UNKNOWN", [], "2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z")
    ).rejects.toThrow(NotFoundError);
  });

  it("storeMeasurements: throws NotFoundError for missing sensor", async () => {
    await networkRepo.createNetwork("NET1", "Network 1", "Description", []);
    await createGatewayService("NET1", {
      macAddress: "GW1",
      name: "Gateway 1",
      description: "Test Gateway"
    });

    await expect(
      measRepo.storeMeasurements("NET1", "GW1", "UNKNOWN_MAC", [
        { createdAt: new Date(), value: 10 }
      ])
    ).rejects.toThrow(NotFoundError);
  });


 it("getMeasurementsForSingleSensor: returns measurements and computed stats", async () => {
  await setupNetworkGatewaySensor();
  await measRepo.storeMeasurements("NET1", "GW1", "MAC1", [
    { createdAt: new Date("2024-01-01T10:00:00Z"), value: 100 },
    { createdAt: new Date("2024-01-01T11:00:00Z"), value: 200 }
  ]);
  const result = await measRepo.getMeasurementsForSingleSensor(
    "NET1", "GW1", "MAC1",
    "2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z"
  );
  expect(result.sensorMacAddress).toBe("MAC1");
  expect(result.measurements).toHaveLength(2);
  expect(result.stats).not.toBeNull();
  expect(result.stats?.mean).toBe(150);
  expect(result.stats?.variance).toBe(2500);
});

it("getStatisticsForSingleSensor: returns only stats object", async () => {
  await setupNetworkGatewaySensor();
  await measRepo.storeMeasurements("NET1", "GW1", "MAC1", [
    { createdAt: new Date("2024-01-01T10:00:00Z"), value: 10 },
    { createdAt: new Date("2024-01-01T12:00:00Z"), value: 30 }
  ]);
  const stats = await measRepo.getStatisticsForSingleSensor(
    "NET1", "GW1", "MAC1",
    "2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z"
  );
  expect(stats.sensorMac).toBe("MAC1");
  expect(stats.stats?.mean).toBe(20);
  expect(stats.stats?.variance).toBe(100);
});

it("getOutliersForSingleSensor: returns empty array if no outliers", async () => {
  await setupNetworkGatewaySensor();
  await measRepo.storeMeasurements("NET1", "GW1", "MAC1", [
    { createdAt: new Date("2024-01-01T10:00:00Z"), value: 50 },
    { createdAt: new Date("2024-01-01T11:00:00Z"), value: 60 }
  ]);
  const out = await measRepo.getOutliersForSingleSensor(
    "NET1", "GW1", "MAC1",
    "2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z"
  );
  expect(out.sensorMacAddress).toBe("MAC1");
  expect(Array.isArray(out.measurements)).toBe(true);
  expect(out.measurements).toHaveLength(0);
  expect(out.stats).toBeDefined();
});
});