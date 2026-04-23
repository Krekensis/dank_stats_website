import express from "express";
import { getItems } from "../controllers/itemsController.js";

export default function createItemsRouter(db) {
  const router = express.Router();
  router.get("/", getItems(db));
  return router;
}