import AppError from "@models/errors/AppError";
import { Router } from "express";
import {
  getAllGateways,
  createGateway,
  getGateway,
  updateGateway,
  deleteGateway
} from "@controllers/gatewayController";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";

const router = Router({ mergeParams: true });

// Get all gateways (Any authenticated user)
router.get("", authenticateUser(), async (req, res, next) => {
  try {
    await getAllGateways(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Create a new gateway (Admin & Operator)
router.post(
  "",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await createGateway(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// Get a specific gateway (Any authenticated user)
router.get("/:macAddress", authenticateUser(), async (req, res, next) => {
  try {
    await getGateway(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Update a gateway (Admin & Operator)
router.patch(
  "/:macAddress",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await updateGateway(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// Delete a gateway (Admin & Operator)
router.delete(
  "/:macAddress",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await deleteGateway(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// Catch unsupported methods
router.all("", (req, res) => {
  res.set("Allow", "GET,POST");
  res.status(405).json({ message: "Method Not Allowed" });
});

router.all("/:macAddress", (req, res) => {
  res.set("Allow", "GET,PATCH,DELETE");
  res.status(405).json({ message: "Method Not Allowed" });
});

export default router;
