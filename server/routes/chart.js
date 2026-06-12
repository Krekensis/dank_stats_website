import express from "express";
import { getChart } from "../controllers/chartController.js";

export default function createChartsRouter(db1, db2, pgPool, redisClient) {
  const router = express.Router();
  router.get("/", getChart(db1, db2, pgPool, redisClient));
  return router;
}
