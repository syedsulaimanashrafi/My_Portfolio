import { Request, Response, NextFunction } from "express";
import { SensorFromJSON } from "@dto/Sensor";
import {
  getAllSensorsService,
  getSensorService,
  createSensorService,
  updateSensorService,
  deleteSensorService,
} from "@services/SensorService";
import { BadRequestError } from "@models/errors/BadRequestError";
export async function getAllSensors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { networkCode, gatewayMac } = req.params;
  try {
    const sensors = await getAllSensorsService(networkCode, gatewayMac);
    res.status(200).json(sensors);
  } catch (err) {
    next(err);
  }
}

export async function getSensor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { networkCode, gatewayMac, macAddress } = req.params;
  try {
    const sensor = await getSensorService(
      networkCode,
      gatewayMac,
      macAddress
    );
    res.status(200).json(sensor);
  } catch (err) {
    next(err);
  }
}

export async function createSensor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { networkCode, gatewayMac } = req.params;
  try {
    const sensorDto = SensorFromJSON(req.body);
    if (!sensorDto.macAddress) {
       throw new BadRequestError("macAddress is required");
     }
    const created = await createSensorService(
      networkCode,
      gatewayMac,
      sensorDto
    );
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function updateSensor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { networkCode, gatewayMac, macAddress } = req.params;
  try {
    const sensorDto = SensorFromJSON(req.body);

     if (!sensorDto.macAddress) {
       throw new BadRequestError("macAddress is required");
     }

     const updated = await updateSensorService(
       networkCode,
       gatewayMac,
       macAddress,
       sensorDto
     );
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

export async function deleteSensor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { networkCode, gatewayMac, macAddress } = req.params;
  try {
    await deleteSensorService(networkCode, gatewayMac, macAddress);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}
