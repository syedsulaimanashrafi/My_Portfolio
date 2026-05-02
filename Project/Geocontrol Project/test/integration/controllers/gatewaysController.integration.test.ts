import { Request, Response, NextFunction } from "express";
import * as gatewayController from "@controllers/gatewayController";
import * as gatewayService from "@services/gatewayService";

jest.mock("@services/gatewayService");

describe("gatewayController", () => {
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
    it("should respond with gateways list", async () => {
      const fakeGateways = [{ code: "GW1" }, { code: "GW2" }];
      (gatewayService.getAllGatewaysService as jest.Mock).mockResolvedValue(fakeGateways);

      req.params = { networkCode: "NET1" };

      await gatewayController.getAllGateways(req as Request, res as Response, next);

      expect(gatewayService.getAllGatewaysService).toHaveBeenCalledWith("NET1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeGateways);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Service failed");
      (gatewayService.getAllGatewaysService as jest.Mock).mockRejectedValue(error);

      req.params = { networkCode: "NET1" };

      await gatewayController.getAllGateways(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getGateway", () => {
    it("should respond with a gateway object", async () => {
      const fakeGateway = { code: "GW1", macAddress: "00:11:22:33:44:55" };
      (gatewayService.getGatewayService as jest.Mock).mockResolvedValue(fakeGateway);

      req.params = { networkCode: "NET1", macAddress: "00:11:22:33:44:55" };

      await gatewayController.getGateway(req as Request, res as Response, next);

      expect(gatewayService.getGatewayService).toHaveBeenCalledWith("NET1", "00:11:22:33:44:55");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeGateway);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Service failed");
      (gatewayService.getGatewayService as jest.Mock).mockRejectedValue(error);

      req.params = { networkCode: "NET1", macAddress: "00:11:22:33:44:55" };

      await gatewayController.getGateway(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("createGateway", () => {
    it("should create gateway and respond with 201", async () => {
      const newGateway = {
        macAddress: "00:11:22:33:44:55", // ✅ include required macAddress
        name: "New Gateway"
      };
      (gatewayService.createGatewayService as jest.Mock).mockResolvedValue(newGateway);

      req.params = { networkCode: "NET1" };
      req.body = newGateway;

      await gatewayController.createGateway(req as Request, res as Response, next);

      expect(gatewayService.createGatewayService).toHaveBeenCalledWith("NET1", newGateway);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newGateway);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Create failed");
      (gatewayService.createGatewayService as jest.Mock).mockRejectedValue(error);

      req.params = { networkCode: "NET1" };
      req.body = {
        macAddress: "00:11:22:33:44:55",
        name: "New Gateway"
      };

      await gatewayController.createGateway(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("updateGateway", () => {
    it("should update gateway and respond with 204", async () => {
      const updatedGateway = { name: "Updated Name" };
      (gatewayService.updateGatewayService as jest.Mock).mockResolvedValue(updatedGateway);

      req.params = { networkCode: "NET1", macAddress: "00:11:22:33:44:55" };
      req.body = updatedGateway;

      await gatewayController.updateGateway(req as Request, res as Response, next);

      expect(gatewayService.updateGatewayService).toHaveBeenCalledWith("NET1", "00:11:22:33:44:55", updatedGateway);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Update failed");
      (gatewayService.updateGatewayService as jest.Mock).mockRejectedValue(error);

      req.params = { networkCode: "NET1", macAddress: "00:11:22:33:44:55" };
      req.body = { name: "Updated Name" };

      await gatewayController.updateGateway(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteGateway", () => {
    it("should delete gateway and respond with 204 and no content", async () => {
      (gatewayService.deleteGatewayService as jest.Mock).mockResolvedValue(undefined);

      req.params = { networkCode: "NET1", macAddress: "00:11:22:33:44:55" };

      await gatewayController.deleteGateway(req as Request, res as Response, next);

      expect(gatewayService.deleteGatewayService).toHaveBeenCalledWith("NET1", "00:11:22:33:44:55");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Delete failed");
      (gatewayService.deleteGatewayService as jest.Mock).mockRejectedValue(error);

      req.params = { networkCode: "NET1", macAddress: "00:11:22:33:44:55" };

      await gatewayController.deleteGateway(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
