import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "dankstats";
const COLLECTION_NAME = "marketlogs";

// cutoff date
const CUTOFF = new Date("2025-07-01T00:00:00.000Z");

async function del() {

    const client1 = new MongoClient(MONGO_URI, {
        serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
    });

    try {
        await client1.connect();

        const db1 = client1.db(DB_NAME);
        const col1 = db1.collection(COLLECTION_NAME);

        const result = await col1.deleteMany({
        t: { $gt: CUTOFF }
        });

        console.log(`Deleted ${result.deletedCount} documents`);

    }
    finally {
        await client1.close();
    }
}

del()
