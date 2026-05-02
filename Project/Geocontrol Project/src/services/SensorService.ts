import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@models/dao/SensorDAO";
import { Sensor } from "@dto/Sensor";

const sensorRepo = new SensorRepository();

export async function getAllSensorsService(
  networkCode: string,
  gatewayMac: string
): Promise<SensorDAO[]> {
  return sensorRepo.getAllSensors(networkCode, gatewayMac);
}

export async function getSensorService(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string
): Promise<SensorDAO> {
  return sensorRepo.getSensor(networkCode, gatewayMac, sensorMac);
}

export async function createSensorService(
  networkCode: string,
  gatewayMac: string,
  sensorDto: Sensor
): Promise<SensorDAO> {
  const dao = new SensorDAO();
  dao.macAddress  = sensorDto.macAddress;
  dao.name        = sensorDto.name;
  dao.description = sensorDto.description;
  dao.variable    = sensorDto.variable;
  dao.unit        = sensorDto.unit;
 
  
  return sensorRepo.createSensor(networkCode, gatewayMac, dao);
}

export async function updateSensorService(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  updateData: Partial<SensorDAO>
): Promise<SensorDAO> {
  return sensorRepo.updateSensor(
    networkCode,
    gatewayMac,
    sensorMac,
    updateData
  );
}

export async function deleteSensorService(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string
): Promise<void> {
  return sensorRepo.deleteSensor(networkCode, gatewayMac, sensorMac);
}
