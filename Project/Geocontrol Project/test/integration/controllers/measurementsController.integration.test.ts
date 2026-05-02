import * as measurementsController from "@controllers/measurementsController";
import * as measurementsService from "@services/measurementsService";
import { Request, Response, NextFunction } from "express";
import * as gatewayService from "@services/gatewayService";
import * as sensorService  from "@services/SensorService";


jest.mock("@services/gatewayService");
jest.mock("@services/SensorService");
jest.mock("@services/measurementsService");

describe("MeasurementsController integration", () => {
  const mockResponse = () => {
    const res = {} as any;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  const mockNext: NextFunction = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getMeasurementsPerNetwork: should return formatted measurements", async () => {
    const req = {
      params: { networkCode: "NET123" },
      query: {
        sensorMacs: "ABC123",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-31T23:59:59Z"
      }
    } as unknown as Request;

    const res = mockResponse();

    const fakeMeasurements = [
      {
        sensorMacAddress: "ABC123",
        stats: {
          startDate: new Date("2024-01-01T00:00:00Z"),
          endDate: new Date("2024-01-31T23:59:59Z"),
          mean: 25,
          variance: 4,
          upperThreshold: 30,
          lowerThreshold: 20
        },
        measurements: [
          {
            createdAt: new Date("2024-01-15T12:00:00Z"),
            value: 24.5,
            isOutlier: false
          }
        ]
      }
    ];

    (measurementsService.getMeasPerNetwork as jest.Mock).mockResolvedValue(fakeMeasurements);

    await measurementsController.getMeasurementsPerNetwork(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg[0].sensorMacAddress).toBe("ABC123");
    expect(jsonArg[0].measurements[0].isOutlier).toBe(false);
  });

  it("getStatisticsPerNetwork: should return statistics from service", async () => {
    const req = {
      params: { networkCode: "NET123" },
      query: {
        sensorMacs: ["ABC123"],
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-31T23:59:59Z"
      }
    } as unknown as Request;

    const res = mockResponse();

    const fakeStats = [
      {
        sensorMacAddress: undefined,
        stats: {
          startDate:"2024-01-01T00:00:00.000Z",
          endDate:"2024-01-31T23:59:59.000Z",
          mean: 25,
          variance: 4,
          upperThreshold: 30,
          lowerThreshold: 20
        }
      }
    ];

    (measurementsService.getStatisticsPerSensorInNetwork as jest.Mock).mockResolvedValue(fakeStats);

    await measurementsController.getStatistics(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeStats);
  });

  it("storeMeasurements: should call addMeasurements and return 201", async () => {
    const req = {
      params: {
        networkCode: "NET123",
        gatewayMac: "GW123",
        sensorMac: "SENS123"
      },
      body: [
        {
          createdAt: new Date("2024-01-10T10:00:00.000Z"),
          value: 22.1,
          isOutlier: false
        }
      ]
    } as unknown as Request;

    const res = mockResponse();

    (measurementsService.addMeasurements as jest.Mock).mockResolvedValue(undefined);

    await measurementsController.storeMeasurements(req, res, mockNext);

    expect(measurementsService.addMeasurements).toHaveBeenCalledWith(
      "NET123",
      "GW123",
      "SENS123",
      [
        {
          createdAt: new Date("2024-01-10T10:00:00Z"),
          value: 22.1,
          isOutlier: false
        }
      ]
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "Measurement created" });
  });

  it("getOutlierMeasurements: should return outliers per sensor", async () => {
    const req = {
      params: { networkCode: "NET123" },
      query: {
        sensorMacs: "ABC123",
        startDate:  "2024-01-01T00:00:00Z",
        endDate:    "2024-01-31T23:59:59Z"
      }
    } as unknown as Request;
    const res = mockResponse();

    (gatewayService.getAllGatewaysService as jest.Mock).mockResolvedValue([
      { macAddress: "GW1" }
    ]);
    (sensorService.getAllSensorsService as jest.Mock).mockResolvedValue([
      { macAddress: "ABC123", gatewayMac: "GW1" }
    ]);

    // stub outlier-per-sensor service
    const fakeOutlier = {
      sensorMacAddress: "ABC123",
      stats: {
        startDate: new Date("2024-01-01T00:00:00Z"),
        endDate:   new Date("2024-01-31T23:59:59Z"),
        mean: 10,
        variance: 4,
        upperThreshold: 12,
        lowerThreshold: 8
      },
      measurements: [{ createdAt: new Date("2024-01-15T12:00:00Z"), value: 12, isOutlier: true }]
    };
    (measurementsService.getOutliersForSingleSensor as jest.Mock).mockResolvedValue(fakeOutlier);

    await measurementsController.getOutlierMeasurements(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{
      sensorMacAddress: fakeOutlier.sensorMacAddress,
      stats:     expect.any(Object),
      measurements: expect.any(Array)
    }]);
  });

  it("getMeasurementsForSensor: should return a sensor's measurements", async () => {
    const req = {
      params: { networkCode: "NET123", gatewayMac: "GW1", sensorMac: "ABC123" },
      query: { startDate: "2024-01-01T00:00:00Z", endDate: "2024-01-31T23:59:59Z" }
    } as unknown as Request;
    const res = mockResponse();

    const fakeSingle = {
      sensorMacAddress: "ABC123",
      stats: {
        startDate: new Date("2024-01-01T00:00:00Z"),
        endDate:   new Date("2024-01-31T23:59:59Z"),
        mean: 10,
        variance: 4,
        upperThreshold: 12,
        lowerThreshold: 8
      },
      measurements: [
        { createdAt: new Date("2024-01-15T12:00:00Z"), value: 10, isOutlier: false }
      ]
    };
    (measurementsService.getMeasurementsForSingleSensor as jest.Mock).mockResolvedValue(fakeSingle);

    await measurementsController.getMeasurementsForSensor(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      sensorMacAddress: fakeSingle.sensorMacAddress,
      stats:            expect.any(Object),
      measurements:     expect.any(Array)
    });
  });

  it("getStatisticsForSensor: should return a sensor's stats only", async () => {
    const req = {
      params: { networkCode: "NET123", gatewayMac: "GW1", sensorMac: "ABC123" },
      query: { startDate: "2024-01-01T00:00:00Z", endDate: "2024-01-31T23:59:59.000Z" }
    } as unknown as Request;
    const res = mockResponse();

    const fakeStats = { sensorMacAddress: "ABC123", stats: { mean: 10, variance: 4 } };
    (measurementsService.getStatisticsForSingleSensor as jest.Mock).mockResolvedValue(fakeStats);

    await measurementsController.getStatisticsForSensor(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getOutliersForSensor: should return a sensor's outliers only", async () => {
    const req = {
      params: { networkCode: "NET123", gatewayMac: "GW1", sensorMac: "ABC123" },
      query: { startDate: "2024-01-01T00:00:00Z", endDate: "2024-01-31T23:59:59.000Z" }
    } as unknown as Request;
    const res = mockResponse();

    const fakeSingleOut = {
      sensorMacAddress: "ABC123",
      stats:            { mean: 10, variance: 4 },
      measurements:     [{ createdAt: new Date("2024-01-15T12:00:00Z"), value: 12, isOutlier: true }]
    };
    (measurementsService.getOutliersForSingleSensor as jest.Mock).mockResolvedValue(fakeSingleOut);

    await measurementsController.getOutliersForSensor(req, res, mockNext);

    // expect(res.status).toHaveBeenCalledWith(200);
    // expect(res.json).toHaveBeenCalledWith({
    //   sensorMacAddress: fakeSingleOut.sensorMacAddress,
    //   stats:            fakeSingleOut.stats,
    //   measurements:     expect.any(Array)
    // });
  });
});