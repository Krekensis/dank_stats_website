import express from "express";
import { getMarketLogs } from "../controllers/marketlogsController.js";

export default function createMarketLogsRouter(db1, db2, pgPool) {
  const router = express.Router();
  router.get("/", getMarketLogs(db1, db2, pgPool));
  return router;
}
