import express from "express";
import { getPets } from "../controllers/petsController.js";

export default function createPetsRouter(db, pgPool) {
  const router = express.Router();
  router.get("/", getPets(db, pgPool));
  return router;
}
