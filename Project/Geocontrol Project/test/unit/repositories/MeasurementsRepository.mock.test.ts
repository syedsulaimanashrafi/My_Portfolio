jest.mock("@repositories/MeasurementsRepository");

const mockStore = jest.fn();
const mockGetMeasPerNetwork = jest.fn();
const mockGetStatsPerNetwork = jest.fn();
const mockGetMeasSingle = jest.fn();
const mockGetStatsSingle = jest.fn();
const mockGetOutliersSingle = jest.fn();

import { MeasurementsRepository } from "@repositories/MeasurementsRepository";

(MeasurementsRepository as jest.Mock).mockImplementation(() => ({
    storeMeasurements: mockStore,
    getMeasPerNetwork: mockGetMeasPerNetwork,
    getStatisticsPerSensorInNetwork: mockGetStatsPerNetwork,
    getMeasurementsForSingleSensor: mockGetMeasSingle,
    getStatisticsForSingleSensor: mockGetStatsSingle,
    getOutliersForSingleSensor: mockGetOutliersSingle,
  }));

import * as svc from "@services/measurementsService";
import { Measurement } from "@models/dto/Measurement";



describe("measurementsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("addMeasurements should call storeMeasurements on the repo", async () => {
    const data: Measurement[] = [{ createdAt: new Date(), value: 1, isOutlier: false }];
    await svc.addMeasurements("N", "G", "S", data);
    expect(mockStore).toHaveBeenCalledWith("N", "G", "S", data);
  });

  it("getMeasPerNetwork should return repo getMeasPerNetwork result", async () => {
    const fake = [{ sensorMacAddress: "S", measurements: [], stats: {} }];
    mockGetMeasPerNetwork.mockResolvedValue(fake);
    const result = await svc.getMeasPerNetwork("N", ["S"], "a", "b");
    expect(result).toBe(fake);
    expect(mockGetMeasPerNetwork).toHaveBeenCalledWith("N", ["S"], "a", "b");
  });

  it("getStatisticsPerSensorInNetwork should return repo getStatisticsPerSensorInNetwork result", async () => {
    const fake = [{ sensorMac: "S", stats: {} }];
    mockGetStatsPerNetwork.mockResolvedValue(fake);
    const result = await svc.getStatisticsPerSensorInNetwork("N", ["S"], "a", "b");
    expect(result).toBe(fake);
    expect(mockGetStatsPerNetwork).toHaveBeenCalledWith("N", ["S"], "a", "b");
  });

  it("fetchOutliers should group and filter outliers correctly", async () => {
    const statsArr = [{
      sensorMacAddress: "S1",
      stats: { upperThreshold: 50, lowerThreshold: 0, startDate: new Date(), endDate: new Date(), mean: 10, variance: 25 }
    }];
    const measArr = [{
      sensorMacAddress: "S1",
      measurements: [
        { createdAt: new Date(), value: 10, isOutlier: false },
        { createdAt: new Date(), value: 100, isOutlier: true }
      ],
      stats: null
    }];
    mockGetStatsPerNetwork.mockResolvedValue(statsArr);
    mockGetMeasPerNetwork.mockResolvedValue(measArr as any);

    const out = await svc.fetchOutliers("N", ["S1"], "a", "b");
    expect(out).toEqual([{
      sensorMacAddress: "S1",
      stats: statsArr[0].stats,
      measurements: measArr[0].measurements.filter(m => m.value === 100)
    }]);
  });

  it("getMeasurementsForSingleSensor should return repo getMeasurementsForSingleSensor result", async () => {
    const fake = { sensorMacAddress: "S", measurements: [], stats: null };
    mockGetMeasSingle.mockResolvedValue(fake);
    const result = await svc.getMeasurementsForSingleSensor("N", "G", "S", "a", "b");
    expect(result).toBe(fake);
    expect(mockGetMeasSingle).toHaveBeenCalledWith("N", "G", "S", "a", "b");
  });

  it("getStatisticsForSingleSensor should return repo getStatisticsForSingleSensor result", async () => {
    const fake = { sensorMac: "S", stats: {} };
    mockGetStatsSingle.mockResolvedValue(fake);
    const result = await svc.getStatisticsForSingleSensor("N", "G", "S", "a", "b");
    expect(result).toBe(fake);
    expect(mockGetStatsSingle).toHaveBeenCalledWith("N", "G", "S", "a", "b");
  });

  it("getOutliersForSingleSensor should return repo getOutliersForSingleSensor result", async () => {
    const fake = { sensorMacAddress: "S", stats: {}, measurements: [] };
    mockGetOutliersSingle.mockResolvedValue(fake);
    const result = await svc.getOutliersForSingleSensor("N", "G", "S", "a", "b");
    expect(result).toBe(fake);
    expect(mockGetOutliersSingle).toHaveBeenCalledWith("N", "G", "S", "a", "b");
  });
});