import "dotenv/config";
import { MongoClient, ServerApiVersion } from "mongodb";

const DB_NAME = "dankstats";
const COLLECTION_NAME = "items";

const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function convertTimestamps() {
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const items = await collection.find({}).toArray();
    let updatedCount = 0;

    for (const item of items) {
      if (!Array.isArray(item.history)) continue;

      let didUpdate = false;

      const updatedHistory = item.history.map((entry) => {
        if (typeof entry.t === "string") {
          didUpdate = true;
          return {
            ...entry,
            timestamp: new Date(entry.t),
          };
        }
        return entry;
      });

      if (didUpdate) {
        await collection.updateOne(
          { _id: item._id },
          { $set: { history: updatedHistory } }
        );
        updatedCount++;
      }
    }

    console.log(`✅ Updated ${updatedCount} items with proper Date objects.`);
  } catch (err) {
    console.error("❌ Error converting timestamps:", err);
  } finally {
    await client.close();
  }
}

convertTimestamps();