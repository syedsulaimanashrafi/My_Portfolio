// ✅ Fixed gatewayService.ts
import { GatewayRepository } from "@repositories/GatewayRepository";
import { Gateway } from "@dto/Gateway";

const gatewayRepo = new GatewayRepository();

export async function getAllGatewaysService(networkCode: string): Promise<Gateway[]> {
  return await gatewayRepo.getAllGateways(networkCode);
}

export async function getGatewayService(networkCode: string, macAddress: string): Promise<Gateway> {
  return await gatewayRepo.getGateway(networkCode, macAddress);
}

export async function createGatewayService(networkCode: string, gatewayData: any): Promise<Gateway> {
  return await gatewayRepo.createGateway(networkCode, gatewayData);
}

export async function updateGatewayService(
  networkCode: string,
  macAddress: string,
  updatedGatewayData: any
): Promise<Gateway> {
  return await gatewayRepo.updateGateway(networkCode, macAddress, updatedGatewayData);
}

export async function deleteGatewayService(networkCode: string, macAddress: string): Promise<void> {
  await gatewayRepo.deleteGateway(networkCode, macAddress);
}
