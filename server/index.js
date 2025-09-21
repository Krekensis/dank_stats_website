import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";

import createItemsRouter from "./routes/items.js";
import createMarketLogsRouter from "./routes/marketlogs.js";
import createChartsRouter from "./routes/chart.js";

const app = express();
app.use(cors());

const client1 = new MongoClient(process.env.MONGO_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});
const client2 = new MongoClient(process.env.MONGO_URI2, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function startServer() {
  try {
    await Promise.all([client1.connect(), client2.connect()]);
    console.log("✅ Connected to both MongoDB clusters");

    const db1 = client1.db("dankstats");
    const db2 = client2.db("dankstats");

    app.use("/api/items", createItemsRouter(db1));
    app.use("/api/marketlogs", createMarketLogsRouter(db1, db2));
    app.use("/api/chart", createChartsRouter(db1, db2));

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () =>
      console.log(`🚀 API running on http://localhost:${PORT}/api`)
    );
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

startServer();