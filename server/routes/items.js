import express from "express";
import { getItems } from "../controllers/itemsController.js";

export default function createItemsRouter(db, redisClient) {
  const router = express.Router();
  router.get("/", getItems(db, redisClient));
  return router;
}