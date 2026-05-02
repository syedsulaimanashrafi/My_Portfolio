import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as networkController from "@controllers/networkController";
import { UserType } from "@models/UserType";
import { Network as NetworkDTO } from "@dto/Network";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";

jest.mock("@services/authService");
jest.mock("@controllers/networkController");

describe("NetworkRoutes integration", () => {
  const token = "Bearer faketoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/v1/networks - should return all networks", async () => {
    const mockNetworks: NetworkDTO[] = [
      { code: "NET1", name: "Network 1", description: "Desc 1", gateways: [] },
      { code: "NET2", name: "Network 2", description: "Desc 2", gateways: [] }
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getAllNetworks as jest.Mock).mockResolvedValue(mockNetworks);

    const response = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockNetworks);
    expect(authService.processToken).toHaveBeenCalled();
    expect(networkController.getAllNetworks).toHaveBeenCalled();
  });

  it("GET /api/v1/networks - 401 Unauthorized", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token");
    });

    const response = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("POST /api/v1/networks - should create network", async () => {
    const newNetwork = {
      code: "NET_NEW",
      name: "New Network",
      description: "Test network"
    };

    (authService.processToken as jest.Mock).mockResolvedValue({ type: UserType.Admin });
    (networkController.createNetwork as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send(newNetwork);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(newNetwork);
    expect(networkController.createNetwork).toHaveBeenCalled();
  });

  it("GET /api/v1/networks/:code - should return specific network", async () => {
    const network: NetworkDTO = {
      code: "NET_X",
      name: "Network X",
      description: "Description X",
      gateways: []
    };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getNetwork as jest.Mock).mockResolvedValue(network);

    const response = await request(app)
      .get("/api/v1/networks/NET_X")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(network);
    expect(networkController.getNetwork).toHaveBeenCalledWith("NET_X");
  });

  it("PATCH /api/v1/networks/:code - should update a network", async () => {
    const updatePayload = {
      code: "NET_X",
      name: "Updated Name",
      description: "Updated Desc"
    };

    (authService.processToken as jest.Mock).mockResolvedValue({ type: UserType.Operator });
    (networkController.updateNetwork as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .patch("/api/v1/networks/NET_X")
      .set("Authorization", token)
      .send(updatePayload);

    expect(response.status).toBe(204);
    expect(networkController.updateNetwork).toHaveBeenCalledWith("NET_X", expect.any(Object));
  });

  it("DELETE /api/v1/networks/:code - should delete a network", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue({ type: UserType.Admin });
    (networkController.deleteNetwork as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete("/api/v1/networks/NET_X")
      .set("Authorization", token);

    expect(response.status).toBe(204);
    expect(networkController.deleteNetwork).toHaveBeenCalledWith("NET_X");
  });

  it("POST /api/v1/networks - 403 Insufficient Rights", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send({ code: "A", name: "A", description: "A" });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });
  // 400 BadRequest on create - missing name
  it("POST /api/v1/networks - 400 if name missing", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue({ type: UserType.Admin });
    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send({ code: "CODE1", description: "Desc" });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/required property name/);
  });

  // 400 BadRequest on create - missing code
  it("POST /api/v1/networks - 400 if code missing", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue({ type: UserType.Operator });
    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send({ name: "Name1", description: "Desc" });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/required property code/);
  });

  // 400 BadRequest on create - missing description
  it("POST /api/v1/networks - 400 if description missing", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue({ type: UserType.Admin });
    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send({ code: "CODE2", name: "Name2" });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/required property description/);
  });

  // 400 BadRequest on update - missing body.name
  it("PATCH /api/v1/networks/:code - 400 if name missing", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue({ type: UserType.Operator });
    const response = await request(app)
      .patch("/api/v1/networks/NET1")
      .set("Authorization", token)
      .send({ code: "NET1", description: "Desc1" });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/required property name/);
  });

  // 404 Not Found on get specific network
  it("GET /api/v1/networks/:code - 404 when not found", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getNetwork as jest.Mock).mockImplementation(() => {
      throw new (require("@models/errors/NotFoundError").NotFoundError)("Network not found");
    });
    const response = await request(app)
      .get("/api/v1/networks/UNKNOWN")
      .set("Authorization", token);
    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/Network not found/);
  });

  // 404 Not Found on delete
  it("DELETE /api/v1/networks/:code - 404 when delete missing", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue({ type: UserType.Admin });
    (networkController.deleteNetwork as jest.Mock).mockImplementation(() => {
      throw new (require("@models/errors/NotFoundError").NotFoundError)("Cannot delete");
    });
    const response = await request(app)
      .delete("/api/v1/networks/UNKNOWN")
      .set("Authorization", token);
    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/Cannot delete/);
  });
});