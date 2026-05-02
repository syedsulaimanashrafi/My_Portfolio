import { Router } from "express";
import {
  getAllSensors,
  getSensor,
  createSensor,
  updateSensor,
  deleteSensor,
} from "@controllers/SensorController";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";

const router = Router({ mergeParams: true });

router
  .route("/")
  .get(authenticateUser(), getAllSensors)
  .post(
    authenticateUser([UserType.Admin, UserType.Operator]),
    createSensor
  )
  .all((req, res) => {
    res.sendStatus(405);
  });

router
  .route("/:macAddress")
  .get(authenticateUser(), getSensor)
  .put(
    authenticateUser([UserType.Admin, UserType.Operator]),
    updateSensor
  )
  .patch(
    authenticateUser([UserType.Admin, UserType.Operator]),
    updateSensor
  )
  .delete(
    authenticateUser([UserType.Admin, UserType.Operator]),
    deleteSensor
  )
  .all((req, res) => {
    res.sendStatus(405);
  });

export default router;
