import { CONFIG } from "@config";
import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import {
  getMeasurementsPerNetwork,
  getStatistics,
  getOutlierMeasurements,
  storeMeasurements,
  getMeasurementsForSensor,
  getStatisticsForSensor,
  getOutliersForSensor
} from "@controllers/measurementsController";

const router = Router();


router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/measurements",
  authenticateUser(),
  getMeasurementsPerNetwork
);

router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/stats",
  authenticateUser(),
  getStatistics
);

router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/outliers",
  authenticateUser(),
  getOutlierMeasurements
);

// Sensor-specific routes (under network/gateway/sensor)

router.post(
  CONFIG.ROUTES.V1_NETWORKS +
    "/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements",
  authenticateUser([UserType.Admin, UserType.Operator]),
  storeMeasurements
);

router.get(
  CONFIG.ROUTES.V1_NETWORKS +
    "/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements",
  authenticateUser(),
  getMeasurementsForSensor
);

router.get(
  CONFIG.ROUTES.V1_NETWORKS +
    "/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/stats",
  authenticateUser(),
  getStatisticsForSensor
);

router.get(
  CONFIG.ROUTES.V1_NETWORKS +
    "/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/outliers",
  authenticateUser(),
  getOutliersForSensor
);

export default router;
