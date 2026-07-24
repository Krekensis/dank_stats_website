import express from "express";
import { getScrapedData } from "../controllers/scrapedController.js";

const createScrapedRouter = (db, redisClient) => {
  const router = express.Router();
  router.get("/", getScrapedData(db, redisClient));
  return router;
};

export default createScrapedRouter;
