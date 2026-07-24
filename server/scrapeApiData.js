import dotenv from "dotenv";
import axios from "axios";
import { MongoClient, ServerApiVersion } from "mongodb";
dotenv.config();

// --- CONFIGURATION ---
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "dankstats";
const COLLECTION_NAME = "scraped";

const ENDPOINTS = [
  {
    id: "changelogs",
    url: "https://dankmemer.lol/api/bot/changelogs",
    referer: "https://dankmemer.lol/changelog"
  },
  {
    id: "items",
    url: "https://dankmemer.lol/api/bot/items",
    referer: "https://dankmemer.lol/items"
  },
  {
    id: "pets",
    url: "https://dankmemer.lol/api/bot/pets",
    referer: "https://dankmemer.lol/pets"
  },
  {
    id: "fish",
    url: "https://dankmemer.lol/api/bot/fish/data",
    referer: "https://dankmemer.lol/fishing"
  }
];

async function main() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not defined in .env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    for (const endpoint of ENDPOINTS) {
      console.log(`\nFetching ${endpoint.id} data...`);
      try {
        const response = await axios.get(endpoint.url, {
          headers: {
            "accept": "*/*",
            "referer": endpoint.referer,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
          }
        });

        let data = response.data;

        // Ensure fish data is capsulated in an array as requested
        if (endpoint.id === "fish" && !Array.isArray(data)) {
          data = [data];
        }

        // Upsert into MongoDB
        await collection.updateOne(
          { id: endpoint.id },
          {
            $set: {
              data: data,
              lastUpdated: new Date()
            }
          },
          { upsert: true }
        );

        console.log(`✅ Successfully updated '${endpoint.id}' in MongoDB! (Data size: ${JSON.stringify(data).length} bytes)`);

        // Polite delay between requests to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));

      } catch (err) {
        console.error(`❌ Failed to fetch or update ${endpoint.id}:`, err.message);
      }
    }

  } catch (error) {
    console.error("Fatal error:", error);
  } finally {
    await client.close();
    console.log("\nMongoDB connection closed.");
    process.exit(0);
  }
}

main();
