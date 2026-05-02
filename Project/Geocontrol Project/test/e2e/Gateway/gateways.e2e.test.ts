import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Gateways E2E", () => {
  let token: string;

  const networkCode = "NET_E2E";
  let macAddress = "AA:BB:CC:DD:EE:FF";  // made mutable to update later

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("creates a network for gateways", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: networkCode,
        name: "Gateway Test Network",
        description: "Network for Gateway E2E Tests",
      });

    expect(res.status).toBe(201);
    expect(res.body.code).toBe(networkCode);
  });

  it("creates a gateway", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress,
        name: "E2E Gateway",
        description: "Gateway for E2E testing",
      });

    expect(res.status).toBe(201);
    expect(res.body.macAddress).toBe(macAddress);
    expect(res.body.name).toBe("E2E Gateway");
  });

  it("retrieves all gateways in a network", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(gw => gw.macAddress === macAddress)).toBe(true);
  });

  it("retrieves a specific gateway", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${macAddress}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.macAddress).toBe(macAddress);
  });

  it("updates the gateway including macAddress", async () => {
    const newMacAddress = "FF:EE:DD:CC:BB:AA";

    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${macAddress}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: newMacAddress,
        name: "Updated E2E Gateway",
        description: "Updated description",
      });

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    // Update macAddress for subsequent tests
    macAddress = newMacAddress;
  });

  it("deletes the gateway", async () => {
    const res = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${macAddress}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it("deletes the network after gateway tests", async () => {
    const res = await request(app)
      .delete(`/api/v1/networks/${networkCode}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
