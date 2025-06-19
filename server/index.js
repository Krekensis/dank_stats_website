import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";

const app = express();
app.use(cors());

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

    app.get("/api/items", async (req, res) => {
      try {
        const items = await client.db("dankstats").collection("items").find({}).toArray();
        res.json(items);
      } catch (err) {
        console.error("❌ Error fetching items:", err);
        res.status(500).json({ error: "MongoDB query error" });
      }
    });

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`🚀 API running on ${PORT}`));

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

startServer();
