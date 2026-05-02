import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Networks E2E", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should retrieve all networks", async () => {
    const res = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should create a new network", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({
        code: "NET_TEST",
        name: "Test Network",
        description: "This is a test network"
      });

    expect(res.status).toBe(201);
    expect(res.body.code).toBe("NET_TEST");
  });

  it("should retrieve a specific network", async () => {
    const res = await request(app)
      .get("/api/v1/networks/NET_TEST")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe("NET_TEST");
  });

  it("should update a network", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET_TEST")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({
        code: "NET_TEST_Update",
        name: "Updated Network Name",
        description: "Updated description"
      });

    expect(res.status).toBe(204);
  });

  it("should delete the updated network", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/NET_TEST_Update")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});