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

async function migrateItems() {
  await client.connect();

  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  // Fetch all items
  const cursor = collection.find({});
  let updatedCount = 0;

  while (await cursor.hasNext()) {
    const item = await cursor.next();

    // Build updated history
    const newHistory = item.history.map(entry => ({
      t: entry.t,  // already a Date object
      v: entry.v,
    }));

    // Build updated document fields
    const updatedDoc = {
      url: item.emoji.url,
      history: newHistory
    };

    await collection.updateOne(
      { _id: item._id },
      {
        $set: updatedDoc,
        $unset: { 'emoji': '' } // remove full emoji field
      }
    );

    updatedCount++;
  }

  console.log(`Migration complete. ${updatedCount} items updated.`);
  await client.close();
}

migrateItems().catch(console.error);