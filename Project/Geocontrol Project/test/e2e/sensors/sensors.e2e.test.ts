import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Sensors E2E", () => {
  let token: string;
  const networkCode = "NET_TEST";  
  const gatewayMac = "AA:BB:CC:DD:EE:FF";
  let sensorMac: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);

    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: networkCode,
        name: "Test Network",
        description: "for sensor E2E",
      })
      .expect(201);

    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress:  gatewayMac,
        name:        "Test Gateway",
        description: "Gateway for sensor E2E tests",
      })
      .expect(201);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should retrieve an (initially empty) list of sensors", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it("should create a new sensor", async () => {
    const payload = {
      macAddress:  "71:B1:CE:01:C6:A9",
      name:        "TempSensor",
      description: "Measures temperature",
      variable:    "temperature",
      unit:        "°C",
    };

    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      macAddress: payload.macAddress,
      name:       payload.name,
      unit:       payload.unit,
    });

    sensorMac = res.body.macAddress;
  });

  it("should retrieve the created sensor", async () => {
    const res = await request(app)
      .get(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      macAddress:  sensorMac,
      name:        "TempSensor",
      variable:    "temperature",
    });
  });

 it("should update the sensor", async () => {
    const update = {
      macAddress:  sensorMac, // ✅ Required
      name:        "TempSensorV2",
      description: "Updated desc"
    };

    const res = await request(app)
      .put(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`
      )
      .set("Authorization", `Bearer ${token}`)
      .send(update);

    // ✅ Expecting 204 No Content as per controller
    expect(res.status).toBe(204);

    // ✅ Follow-up: verify it was actually updated via GET
    const check = await request(app)
      .get(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(check.status).toBe(200);
    expect(check.body).toMatchObject({
      macAddress:  sensorMac,
      name:        "TempSensorV2",
      description: "Updated desc"
    });
  });


  it("should delete the sensor", async () => {
    await request(app)
      .delete(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`
      )
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    await request(app)
      .get(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`
      )
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });
});
