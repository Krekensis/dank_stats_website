import express from "express";
import { getPets } from "../controllers/petsController.js";

export default function createPetsRouter(db) {
  const router = express.Router();
  router.get("/", getPets(db));
  return router;
}
