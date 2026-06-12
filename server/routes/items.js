import express from "express";
import { getItems } from "../controllers/itemsController.js";

export default function createItemsRouter(db, pgPool, redisClient) {
  const router = express.Router();
  router.get("/", getItems(db, pgPool, redisClient));
  return router;
}