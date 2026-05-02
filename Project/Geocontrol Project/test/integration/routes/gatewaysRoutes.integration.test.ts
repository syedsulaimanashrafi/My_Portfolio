import { Request, Response, NextFunction } from "express";
import * as gatewayController from "@controllers/gatewayController";
import * as gatewayService from "@services/gatewayService";

jest.mock("@services/gatewayService");

describe("Gateway Controller Integration Tests", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllGateways", () => {
    it("should return 200 with gateway list", async () => {
      const mockGateways = [{ macAddress: "MAC1" }, { macAddress: "MAC2" }];
      (gatewayService.getAllGatewaysService as jest.Mock).mockResolvedValue(mockGateways);

      req.params = { networkCode: "NET1" };

      await gatewayController.getAllGateways(req as Request, res as Response, next);

      expect(gatewayService.getAllGatewaysService).toHaveBeenCalledWith("NET1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockGateways);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next on error", async () => {
      const error = new Error("Service error");
      (gatewayService.getAllGatewaysService as jest.Mock).mockRejectedValue(error);

      req.params = { networkCode: "NET1" };

      await gatewayController.getAllGateways(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getGateway", () => {
    it("should return 200 with single gateway", async () => {
      const mockGateway = { macAddress: "MAC123" };
      (gatewayService.getGatewayService as jest.Mock).mockResolvedValue(mockGateway);

      req.params = { networkCode: "NET1", macAddress: "MAC123" };

      await gatewayController.getGateway(req as Request, res as Response, next);

      expect(gatewayService.getGatewayService).toHaveBeenCalledWith("NET1", "MAC123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockGateway);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next on error", async () => {
      const error = new Error("Service failure");
      (gatewayService.getGatewayService as jest.Mock).mockRejectedValue(error);

      req.params = { networkCode: "NET1", macAddress: "MAC123" };

      await gatewayController.getGateway(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("createGateway", () => {
    it("should return 201 with created gateway", async () => {
      const newGateway = { macAddress: "NEW_MAC", name: "Gateway" };
      (gatewayService.createGatewayService as jest.Mock).mockResolvedValue(newGateway);

      req.params = { networkCode: "NET1" };
      req.body = newGateway;

      await gatewayController.createGateway(req as Request, res as Response, next);

      expect(gatewayService.createGatewayService).toHaveBeenCalledWith("NET1", newGateway);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newGateway);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next on error", async () => {
      const error = new Error("Create failed");
      (gatewayService.createGatewayService as jest.Mock).mockRejectedValue(error);

      req.params = { networkCode: "NET1" };
      req.body = { macAddress: "NEW_MAC" };

      await gatewayController.createGateway(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("updateGateway", () => {
    it("should return 204 on successful update", async () => {
      (gatewayService.updateGatewayService as jest.Mock).mockResolvedValue(undefined);

      req.params = { networkCode: "NET1", macAddress: "MAC123" };
      req.body = { name: "Updated Name" };

      await gatewayController.updateGateway(req as Request, res as Response, next);

      expect(gatewayService.updateGatewayService).toHaveBeenCalledWith("NET1", "MAC123", { name: "Updated Name" });
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).not.toHaveBeenCalled(); // <-- Fix: json should NOT be called on 204
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next on error", async () => {
      const error = new Error("Update failed");
      (gatewayService.updateGatewayService as jest.Mock).mockRejectedValue(error);

      req.params = { networkCode: "NET1", macAddress: "MAC123" };
      req.body = { name: "Updated Name" };

      await gatewayController.updateGateway(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteGateway", () => {
    it("should return 204 on successful deletion", async () => {
      (gatewayService.deleteGatewayService as jest.Mock).mockResolvedValue(undefined);

      req.params = { networkCode: "NET1", macAddress: "MAC123" };

      await gatewayController.deleteGateway(req as Request, res as Response, next);

      expect(gatewayService.deleteGatewayService).toHaveBeenCalledWith("NET1", "MAC123");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).not.toHaveBeenCalled(); // <-- Fix: json should NOT be called on 204
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next on error", async () => {
      const error = new Error("Delete failed");
      (gatewayService.deleteGatewayService as jest.Mock).mockRejectedValue(error);

      req.params = { networkCode: "NET1", macAddress: "MAC123" };

      await gatewayController.deleteGateway(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
