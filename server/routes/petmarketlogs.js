import express from "express";
import { getPetMarketLogs } from "../controllers/petmarketlogsController.js";

export default function createPetMarketLogsRouter(db1, db2) {
  const router = express.Router();
  router.get("/", getPetMarketLogs(db1, db2));
  return router;
}
