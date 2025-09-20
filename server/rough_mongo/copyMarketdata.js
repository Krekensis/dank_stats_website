import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const MONGO_URI2 = process.env.MONGO_URI2;
const DB_NAME = "dankstats";
const COLLECTION_NAME = "marketlogs";

// cutoff date
const CUTOFF = new Date("2024-01-01T00:00:00.000Z");

async function migrate() {
    
  const client1 = new MongoClient(MONGO_URI, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
  });
  const client2 = new MongoClient(MONGO_URI2, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
  });

  try {
    await client1.connect();
    await client2.connect();

    const db1 = client1.db(DB_NAME);
    const col1 = db1.collection(COLLECTION_NAME);

    const db2 = client2.db(DB_NAME);
    const col2 = db2.collection(COLLECTION_NAME);

    // index for uniqueness
    await col2.createIndex({ id: 1 }, { unique: true });

    console.log(`🚀 Fetching docs before ${CUTOFF.toISOString()}...`);

    const cursor = col1.find({ t: { $lt: CUTOFF } });
    let batch = [];
    let totalCopied = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      batch.push(doc);

      if (batch.length >= 1000) {
        try {
          const result = await col2.insertMany(batch, { ordered: false });
          totalCopied += result.insertedCount;
          console.log(`📦 Copied ${result.insertedCount} docs (total: ${totalCopied})`);
        } catch (e) {
          if (e.code === 11000) {
            console.warn("⚠️ Duplicate key error, skipping existing docs...");
          } else {
            console.error("❌ Insert error:", e);
          }
        }
        batch = [];
      }
    }

    if (batch.length > 0) {
      try {
        const result = await col2.insertMany(batch, { ordered: false });
        totalCopied += result.insertedCount;
        console.log(`📦 Copied final ${result.insertedCount} docs (total: ${totalCopied})`);
      } catch (e) {
        if (e.code === 11000) {
          console.warn("⚠️ Duplicate key error in final batch, skipping existing docs...");
        } else {
          console.error("❌ Final insert error:", e);
        }
      }
    }

    console.log(`✅ Migration complete. Total copied: ${totalCopied}`);
    
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await client1.close();
    await client2.close();
  }
}

migrate()
