import { Measurement } from "@models/dto/Measurement";
import { MeasurementsRepository } from "@repositories/MeasurementsRepository";

const repo = new MeasurementsRepository();

export async function getMeasPerNetwork(
  networkCode: string,
  sensorMacs: string[],
  startDate: string,
  endDate: string
) {
  return repo.getMeasPerNetwork(networkCode, sensorMacs, startDate, endDate);
}

export async function getStatisticsPerSensorInNetwork(
  networkCode: string,
  sensorMacs: string[],
  startDate: string,
  endDate: string
) {
  return repo.getStatisticsPerSensorInNetwork(networkCode, sensorMacs, startDate, endDate);
}


export async function addMeasurements(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  measurements: Measurement[]
): Promise<void> {
  return repo.storeMeasurements(networkCode, gatewayMac, sensorMac, measurements);
}


export async function fetchOutliers(
  networkCode: string,
  sensorMacs: string[],
  startDate: string,
  endDate: string
): Promise<Array<{
  sensorMacAddress: string;
  stats: any;
  measurements: any[];
}>> {
  // 1) compute stats per sensor
  const statsArr = await repo.getStatisticsPerSensorInNetwork(networkCode, sensorMacs, startDate, endDate);
  // 2) load all measurements in window
  const allMeas = await repo.getMeasPerNetwork(networkCode, sensorMacs, startDate, endDate);

  // build a quick map of stats
  const statsMap = new Map<string, any>(
    statsArr.map(s => [ (s as any).sensorMacAddress, (s as any).stats ])
  );

  // filter only outliers
  const grouped: Record<string, any[]> = {};
  for (const m of allMeas) {
    const mac = m.sensorMacAddress
    const st = statsMap.get(mac);
    if (!st) continue;
  
    for (const meas of m.measurements) {
      if (meas.value > st.upperThreshold || meas.value < st.lowerThreshold) {
        (grouped[mac] ||= []).push(meas);
      }
    }
  }
  // merge into final shape
  return statsArr.map(s => {
    const mac = (s as any).sensorMacAddress;
    return {
      sensorMacAddress: mac,
      stats: (s as any).stats,
      measurements: grouped[mac] || []
    };
  });
}
export async function getMeasurementsForSingleSensor(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  startDate: string,
  endDate: string
) {
  return repo.getMeasurementsForSingleSensor(
    networkCode,
    gatewayMac,
    sensorMac,
    startDate,
    endDate
  );
}

export async function getStatisticsForSingleSensor(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  startDate: string,
  endDate: string
) {
  return repo.getStatisticsForSingleSensor(
    networkCode,
    gatewayMac,
    sensorMac,
    startDate,
    endDate
  );
}

export async function getOutliersForSingleSensor(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  startDate: string,
  endDate: string
) {
  return repo.getOutliersForSingleSensor(
    networkCode,
    gatewayMac,
    sensorMac,
    startDate,
    endDate
  );
}
