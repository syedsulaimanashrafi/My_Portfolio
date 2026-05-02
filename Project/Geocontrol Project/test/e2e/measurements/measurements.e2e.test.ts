import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Measurements E2E", () => {
  let token: string;
  const gatewayMac = "AA:BB:CC:DD:EE:FF";
  const sensorMac = "11:22:33:44:55:66";
  const prefix = '/api/v1';

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);

    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "NET_TEST",
        name: "Test Network",
        description: "Network for measurement store test"
      });

    await request(app)
      .post("/api/v1/networks/NET_TEST/gateways")
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: gatewayMac,
        name: "Gateway 1",
        description: "Test Gateway"
      });

    await request(app)
      .post(`/api/v1/networks/NET_TEST/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: sensorMac,
        name: "Sensor 1",
        description: "Test Sensor",
        variable: "test_variable",
        unit: "test_unit"
      });
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  const measurementTimestamp = new Date().toISOString();

  it("should store a measurement for a sensor", async () => {
    const response = await request(app)
      .post(`${prefix}/networks/NET_TEST/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send([
        {
          createdAt: measurementTimestamp,
          value: 42.5
        }
      ]);

    expect(response.status).toBe(201);
    expect(Array.isArray(response.body)).toBe(false);
    expect(response.body).toHaveProperty("message", "Measurement created");
  });

  it("should retrieve measurements for a specific network", async () => {
    const startDate = new Date().toISOString();
    const endDate = new Date().toISOString();

    const res = await request(app)
      .get(`${prefix}/networks/NET_TEST/measurements`)
      .query({ startDate, endDate })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should retrieve statistics for a specific sensor (global route)", async () => {
    const startDate = new Date(new Date(measurementTimestamp).getTime() - 1000).toISOString();
    const endDate = new Date(new Date(measurementTimestamp).getTime() + 1000).toISOString();  

    const res = await request(app)
      .get(`${prefix}/networks/NET_TEST/stats`)
      .query({ startDate, endDate })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const first = res.body[0];
    expect(first).toHaveProperty("sensorMacAddress", sensorMac);
    expect(first).toHaveProperty("stats");
    expect(first.stats).toHaveProperty("mean");
    expect(first.stats).toHaveProperty("variance");
  });

  it("should return outliers [GET /networks/:networkCode/outliers]", async () => {
    await request(app)
      .post(`${prefix}/networks/NET_TEST/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send([
        { createdAt: "2025-05-01T08:00:00Z", value: 0 },
        { createdAt: "2025-05-01T08:01:00Z", value: 0 },
        { createdAt: "2025-05-01T08:02:00Z", value: 0 },
        { createdAt: "2025-05-01T08:03:00Z", value: 0 },
        { createdAt: "2025-05-01T08:04:00Z", value: 0 },
        { createdAt: "2025-05-01T08:05:00Z", value: 100 }
      ])
      .expect(201);

    const res = await request(app)
      .get(`${prefix}/networks/NET_TEST/outliers`)
      .set("Authorization", `Bearer ${token}`)
      .query({
        startDate: "2025-05-01T08:00:00Z",
        endDate: "2025-05-01T08:06:00Z"
      });

    expect(Array.isArray(res.body)).toBe(true);
    const out = res.body.find((r: any) => r.sensorMacAddress === sensorMac);
    expect(out).toBeDefined();
    expect(Array.isArray(out.measurements)).toBe(true);
    expect(out.measurements).toContainEqual(
      expect.objectContaining({ value: 100 })
    );
    expect(out).toHaveProperty("stats.mean");
    expect(out).toHaveProperty("stats.variance");
  });

  it("should retrieve measurements for a specific sensor", async () => {
    const res = await request(app)
      .get(`${prefix}/networks/NET_TEST/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .query({
        startDate: measurementTimestamp,
        endDate: measurementTimestamp
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("sensorMacAddress", sensorMac);
    expect(Array.isArray(res.body.measurements)).toBe(true);
    expect(res.body.measurements[0]).toHaveProperty("value", 42.5);
  });

it("should retrieve statistics for a specific sensor [GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/stats]", async () => {
  const startDate = new Date(new Date(measurementTimestamp).getTime() - 1000).toISOString();
  const endDate = new Date(new Date(measurementTimestamp).getTime() + 1000).toISOString();  

  const res = await request(app)
    .get(`${prefix}/networks/NET_TEST/gateways/${gatewayMac}/sensors/${sensorMac}/stats`)
    .set("Authorization", `Bearer ${token}`)
    .query({ startDate, endDate });

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("mean", 42.5);
  expect(res.body).toHaveProperty("variance", 0);
  expect(res.body).toHaveProperty("upperThreshold", 42.5);
  expect(res.body).toHaveProperty("lowerThreshold", 42.5);
  expect(res.body).toHaveProperty("startDate");
  expect(res.body).toHaveProperty("endDate");
});
  it("should return outliers for a specific sensor", async () => {
    await request(app)
      .post(`${prefix}/networks/NET_TEST/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send([
        { createdAt: "2025-05-01T08:00:00Z", value: 0 },
        { createdAt: "2025-05-01T08:01:00Z", value: 0 },
        { createdAt: "2025-05-01T08:02:00Z", value: 0 },
        { createdAt: "2025-05-01T08:03:00Z", value: 0 },
        { createdAt: "2025-05-01T08:04:00Z", value: 0 },
        { createdAt: "2025-05-01T08:05:00Z", value: 100 }
      ])
      .expect(201);

    const res = await request(app)
      .get(`${prefix}/networks/NET_TEST/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`)
      .set("Authorization", `Bearer ${token}`)
      .query({
        startDate: "2025-05-01T07:59:00Z",
        endDate: "2025-05-01T08:06:00Z"
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("sensorMacAddress", sensorMac);
    expect(Array.isArray(res.body.measurements)).toBe(true);
    expect(res.body.measurements).toContainEqual(
      expect.objectContaining({ value: 100 })
    );
    expect(res.body).toHaveProperty("stats.mean");
    expect(res.body).toHaveProperty("stats.variance");
  });
});
