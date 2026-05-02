import { Request, Response, NextFunction } from "express";
import { 
  getAllGatewaysService, 
  getGatewayService, 
  createGatewayService, 
  updateGatewayService, 
  deleteGatewayService 
} from "@services/gatewayService";
import { BadRequestError } from "@models/errors/BadRequestError";

export async function getAllGateways(req: Request, res: Response, next: NextFunction) {
  try {
    const { networkCode } = req.params;
    if (!networkCode) {
      throw new BadRequestError("Network code is required");
    }
    const gateways = await getAllGatewaysService(networkCode);
    res.status(200).json(gateways);
  } catch (error) {
    next(error);
  }
}

export async function getGateway(req: Request, res: Response, next: NextFunction) {
  try {
    const { networkCode, macAddress } = req.params;
    if (!networkCode || !macAddress) {
      throw new BadRequestError("Network code and MAC address are required");
    }
    const gateway = await getGatewayService(networkCode, macAddress);
    res.status(200).json(gateway);
  } catch (error) {
    next(error);
  }
}

export async function createGateway(req: Request, res: Response, next: NextFunction) {
  try {
    const { networkCode } = req.params;
    if (!networkCode) {
      throw new BadRequestError("Network code is required");
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw new BadRequestError("Invalid gateway data: Request body must be an object");
    }

    // Validate required fields
    if (!req.body.macAddress) {
      throw new BadRequestError("Invalid gateway data: MAC address is required");
    }

    // Validate field types
    if (typeof req.body.macAddress !== 'string' || !req.body.macAddress.trim()) {
      throw new BadRequestError("Invalid gateway data: MAC address must be a non-empty string");
    }

    if ('name' in req.body && (typeof req.body.name !== 'string' || !req.body.name.trim())) {
      throw new BadRequestError("Invalid gateway data: name must be a non-empty string");
    }

    if ('description' in req.body && (typeof req.body.description !== 'string' || !req.body.description.trim())) {
      throw new BadRequestError("Invalid gateway data: description must be a non-empty string");
    }

    // Check for unexpected fields
    const allowedFields = ['macAddress', 'name', 'description'];
    const invalidFields = Object.keys(req.body).filter(key => !allowedFields.includes(key));
    if (invalidFields.length > 0) {
      throw new BadRequestError(`Invalid gateway data: Unexpected field(s) ${invalidFields.join(', ')}`);
    }

    const gateway = await createGatewayService(networkCode, req.body);
    res.status(201).json(gateway);
  } catch (error) {
    next(error);
  }
}

export async function updateGateway(req: Request, res: Response, next: NextFunction) {
  try {
    const { networkCode, macAddress } = req.params;
    if (!networkCode || !macAddress) {
      throw new BadRequestError("Network code and MAC address are required");
    }

    // Validate request body exists and is an object
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw new BadRequestError("Invalid update payload: Request body must be an object");
    }

    // Validate each field if present
    const updates: any = {};

    // List of allowed fields
    const allowedFields = ['macAddress', 'name', 'description'];

    // Check for unexpected fields first
    const invalidFields = Object.keys(req.body).filter(key => !allowedFields.includes(key));
    if (invalidFields.length > 0) {
      throw new BadRequestError(`Invalid update payload: Unexpected field(s) ${invalidFields.join(', ')}`);
    }

    // Validate each field that is present
    if ('macAddress' in req.body) {
      if (typeof req.body.macAddress !== 'string' || !req.body.macAddress.trim()) {
        throw new BadRequestError("Invalid update payload: macAddress must be a non-empty string");
      }
      updates.macAddress = req.body.macAddress;
    }

    if ('name' in req.body) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
        throw new BadRequestError("Invalid update payload: name must be a non-empty string");
      }
      updates.name = req.body.name;
    }

    if ('description' in req.body) {
      if (typeof req.body.description !== 'string' || !req.body.description.trim()) {
        throw new BadRequestError("Invalid update payload: description must be a non-empty string");
      }
      updates.description = req.body.description;
    }

    // Ensure at least one valid field is being updated
    if (Object.keys(updates).length === 0) {
      throw new BadRequestError("Invalid update payload: At least one field (macAddress, name, or description) must be provided");
    }

    await updateGatewayService(networkCode, macAddress, updates);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function deleteGateway(req: Request, res: Response, next: NextFunction) {
  try {
    const { networkCode, macAddress } = req.params;
    if (!networkCode || !macAddress) {
      throw new BadRequestError("Network code and MAC address are required");
    }
    await deleteGatewayService(networkCode, macAddress);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
