import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";

import Redis from "ioredis";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";



import createItemsRouter from "./routes/items.js";
import createMarketLogsRouter from "./routes/marketlogs.js";
import createPetsRouter from "./routes/pets.js";
import createPetMarketLogsRouter from "./routes/petmarketlogs.js";
import createChartsRouter from "./routes/chart.js";
import createScrapedRouter from "./routes/scraped.js";

const app = express();

// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(cors());

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Initialize Redis Client
const redisClient = new Redis(process.env.REDIS_URI || process.env.REDIS_URI);

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});
redisClient.on("connect", () => {
  console.log("✅ Connected to Redis");
});

// Standard Rate Limiter
const standardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window` (here, per minute)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests, please try again later." }
});

// Stricter Rate Limiter for Chart Generation
const chartLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many chart generation requests, please try again later." }
});

// Apply standard rate limit to all /api routes
app.use("/api", standardLimiter);

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

    app.use("/api/items", createItemsRouter(db1, redisClient));
    app.use("/api/marketlogs", createMarketLogsRouter(db1, db2, redisClient));
    app.use("/api/pets", createPetsRouter(db1));
    app.use("/api/petmarketlogs", createPetMarketLogsRouter(db1, db2));
    app.use("/api/scraped", createScrapedRouter(db1, redisClient));

    // Apply stricter limiter explicitly to the chart route, overriding the standard one
    app.use("/api/chart", chartLimiter, createChartsRouter(db1, db2, redisClient));

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () =>
      console.log(`🚀 API running on http://localhost:${PORT}/api`)
    );
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

startServer();