import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";

import createItemsRouter from "./routes/items.js";
import createMarketLogsRouter from "./routes/marketlogs.js";

const app = express();
app.use(cors()); // Needed for POST support

const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function startServer() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("dankstats");

    app.use("/api/items", createItemsRouter(db));
    app.use("/api/marketlogs", createMarketLogsRouter(db));

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`🚀 API running on ${PORT}`));

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

startServer();