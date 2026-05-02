import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as sensorController from "@controllers/SensorController";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";

jest.mock("@services/authService");
jest.mock("@controllers/SensorController");

describe("SensorRoutes integration", () => {
  const token = "Bearer faketoken";

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("GET  /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors", () => {
    it("200 → returns list of sensors", async () => {
      // allow any authenticated user
      (authService.processToken as jest.Mock).mockReturnValue({ type: UserType.Viewer });

      const fakeSensors = [
        {
          macAddress: "01:02:03:04:05:06",
          name: "Outdoor Temp",
          description: "Backyard",
          variable: "temperature",
          unit: "°C",
        },
      ];
      (sensorController.getAllSensors as jest.Mock).mockImplementation((req, res) => {
        return res.status(200).json(fakeSensors);
      });

      const res = await request(app)
        .get("/api/v1/networks/NET1/gateways/GW1/sensors")
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(fakeSensors);
    });

    it("401 → UnauthorizedError when no token", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("No auth token");
      });

      const res = await request(app)
        .get("/api/v1/networks/NET1/gateways/GW1/sensors");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/No auth token/);
    });
  });

  describe("GET  /:macAddress", () => {
    it("200 → returns single sensor", async () => {
      (authService.processToken as jest.Mock).mockReturnValue({ type: UserType.Viewer });
      const single = {
        macAddress: "AA:BB:CC:DD:EE:FF",
        name: "Indoor Humidity",
        description: "Office",
        variable: "humidity",
        unit: "%",
      };
      (sensorController.getSensor as jest.Mock).mockImplementation((req, res) => {
        return res.status(200).json(single);
      });

      const res = await request(app)
        .get("/api/v1/networks/NET2/gateways/GW2/sensors/AA:BB:CC:DD:EE:FF")
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(single);
    });
  });

  describe("POST /", () => {
    it("201 → creates a new sensor as Admin", async () => {
      (authService.processToken as jest.Mock).mockReturnValue({ type: UserType.Admin });

      const payload = {
        macAddress: "11:22:33:44:55:66",
        name: "Pressure Sensor",
        description: "Lab",
        variable: "pressure",
        unit: "Pa",
      };
      (sensorController.createSensor as jest.Mock).mockImplementation((req, res) => {
        // controller should have already validated via DTO
        expect(req.body).toEqual(payload);
        return res.status(201).json(payload);
      });

      const res = await request(app)
        .post("/api/v1/networks/NET3/gateways/GW3/sensors")
        .set("Authorization", token)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(payload);
    });

    it("403 → InsufficientRightsError for non-Admin", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: not allowed");
      });

      const res = await request(app)
        .post("/api/v1/networks/NET3/gateways/GW3/sensors")
        .set("Authorization", token)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Forbidden: not allowed/);
    });
  });

  describe("PATCH /:macAddress", () => {
    it("200 → updates sensor as Operator", async () => {
      (authService.processToken as jest.Mock).mockReturnValue({ type: UserType.Operator });

      const updateData = { name: "Renamed Sensor" };
      const updated = {
        macAddress: "11:22:33:44:55:66",
        name: "Renamed Sensor",
        description: "Lab",
        variable: "pressure",
        unit: "Pa",
      };
      (sensorController.updateSensor as jest.Mock).mockImplementation((req, res) => {
        expect(req.body).toEqual(updateData);
        return res.status(200).json(updated);
      });

      const res = await request(app)
        .patch("/api/v1/networks/NET4/gateways/GW4/sensors/11:22:33:44:55:66")
        .set("Authorization", token)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
    });
  });

  describe("DELETE /:macAddress", () => {
    it("204 → deletes sensor as Operator", async () => {
      (authService.processToken as jest.Mock).mockReturnValue({ type: UserType.Operator });
      (sensorController.deleteSensor as jest.Mock).mockImplementation((req, res) => {
        return res.sendStatus(204);
      });

      const res = await request(app)
        .delete("/api/v1/networks/NET5/gateways/GW5/sensors/11:22:33:44:55:66")
        .set("Authorization", token);

      expect(res.status).toBe(204);
    });
  });
});
