import { BadRequestError } from "@models/errors/BadRequestError";
import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import {
  getAllNetworks,
  createNetwork,
  getNetwork,
  deleteNetwork,
  updateNetwork
} from "@controllers/networkController";
import { NetworkFromJSON } from "@dto/Network";
import { Request, Response, NextFunction } from "express";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// 1) Catch “unsupported methods” on the base /networks path
// ─────────────────────────────────────────────────────────────────────────────
router.all("/", (req: Request, res: Response, next: NextFunction) => {
  if (!["GET", "POST"].includes(req.method)) {
    // tell the client which verbs are allowed here
    res.set("Allow", "GET,POST");
    // return a 405 status, with a simple JSON body
    res.status(405).send({ message: "Method Not Allowed" });
    return;
  }
  // if it’s GET or POST, continue on to the matching route
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// 2) Catch “unsupported methods” on /networks/:networkCode
// ─────────────────────────────────────────────────────────────────────────────
router.all("/:networkCode", (req: Request, res: Response, next: NextFunction) => {
  if (!["GET", "PATCH", "DELETE"].includes(req.method)) {
    res.set("Allow", "GET,PATCH,DELETE");
    res.status(405).send({ message: "Method Not Allowed" });
    return;
  }
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// 3) Now define the “real” routes below.
// ─────────────────────────────────────────────────────────────────────────────

// Get all networks (Any authenticated user)
router.get("", authenticateUser(), async (req, res, next) => {
  try {
    res.status(200).json(await getAllNetworks());
  } catch (error) {
    next(error);
  }
});

// Create a new network (Admin & Operator)
router.post(
  "",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      if (!req.body.name) {
        throw new BadRequestError(" /body/name must have required property name");
      }
      if (!req.body.code) {
        throw new BadRequestError(" /body/code must have required property code");
      }
      if (!req.body.description) {
        throw new BadRequestError(" /body/description must have required property description");
      }

      await createNetwork(NetworkFromJSON(req.body));
      res
        .status(201)
        .json({ code: req.body.code, name: req.body.name, description: req.body.description });
    } catch (error) {
      next(error);
    }
  }
);

// Get a specific network (Any authenticated user)
router.get("/:networkCode", authenticateUser(), async (req, res, next) => {
  try {
    res.status(200).json(await getNetwork(req.params.networkCode));
  } catch (error) {
    next(error);
  }
});

// Update a network (Admin & Operator)
router.patch(
  "/:networkCode",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      if (!req.params.networkCode) {
        throw new BadRequestError("/params/code must have required property code");
      }
      if (!req.body.name) {
        throw new BadRequestError("/body/name must have required property name");
      }
      if (!req.body.code) {
        throw new BadRequestError("/body/code must have required property code");
      }
      if (!req.body.description) {
        throw new BadRequestError("/body/description must have required property description");
      }

      const code = req.params.networkCode;
      const networkDto = NetworkFromJSON(req.body);
      await updateNetwork(code, networkDto);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// Delete a network (Admin & Operator)
router.delete(
  "/:networkCode",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await deleteNetwork(req.params.networkCode);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;