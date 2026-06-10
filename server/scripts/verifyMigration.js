import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import pkg from 'pg';
const { Pool } = pkg;
import assert from "assert";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const MONGO_URI2 = process.env.MONGO_URI2;
const COCKROACH_DB_URI = process.env.COCKROACH_DB_URI;

async function verify() {
    console.log("Starting verification...");

    const client1 = new MongoClient(MONGO_URI);
    const client2 = new MongoClient(MONGO_URI2);
    const pgPool = new Pool({ connectionString: COCKROACH_DB_URI });

    try {
        await Promise.all([client1.connect(), client2.connect()]);
        const db1 = client1.db("dankstats");
        const db2 = client2.db("dankstats");

        // 1. Verify Marketlogs Count
        console.log("Counting marketlogs in Mongo...");
        const mongoMarketLogs1 = await db1.collection("marketlogs").countDocuments({});
        const mongoMarketLogs2 = await db2.collection("marketlogs").countDocuments({});
        const totalMongoMarketLogs = mongoMarketLogs1 + mongoMarketLogs2;

        console.log("Counting marketlogs in CockroachDB...");
        const pgMarketLogsRes = await pgPool.query('SELECT COUNT(*) FROM marketlogs');
        const pgMarketLogs = parseInt(pgMarketLogsRes.rows[0].count, 10);

        console.log(`[Marketlogs] Mongo: ${totalMongoMarketLogs} | Cockroach: ${pgMarketLogs}`);
        if (totalMongoMarketLogs === pgMarketLogs) console.log("✅ Marketlogs counts match!");
        else console.warn("⚠️ Marketlogs counts mismatch.");

        // 2. Verify Petmarketlogs Count
        console.log("\nCounting petmarketlogs in Mongo...");
        const mongoPetMarketLogs1 = await db1.collection("petmarketlogs").countDocuments({});
        const mongoPetMarketLogs2 = await db2.collection("petmarketlogs").countDocuments({});
        const totalMongoPetMarketLogs = mongoPetMarketLogs1 + mongoPetMarketLogs2;

        console.log("Counting petmarketlogs in CockroachDB...");
        const pgPetMarketLogsRes = await pgPool.query('SELECT COUNT(*) FROM petmarketlogs');
        const pgPetMarketLogs = parseInt(pgPetMarketLogsRes.rows[0].count, 10);

        console.log(`[PetMarketlogs] Mongo: ${totalMongoPetMarketLogs} | Cockroach: ${pgPetMarketLogs}`);
        if (totalMongoPetMarketLogs === pgPetMarketLogs) console.log("✅ PetMarketlogs counts match!");
        else console.warn("⚠️ PetMarketlogs counts mismatch.");

        // Helper to deeply compare stats
        function compareStats(s1, s2) {
            try {
                // Ignore missing fields vs undefined
                assert.deepStrictEqual(JSON.parse(JSON.stringify(s1 || {})), JSON.parse(JSON.stringify(s2 || {})));
                return true;
            } catch (e) {
                return false;
            }
        }

        // 3. Verify Items
        console.log("\nVerifying items deeply...");
        const mongoItems = await db1.collection("items").find().toArray();
        const pgItemsRes = await pgPool.query('SELECT * FROM items');
        const pgItems = pgItemsRes.rows;

        console.log(`[Items Count] Mongo: ${mongoItems.length} | Cockroach: ${pgItems.length}`);
        let itemMismatch = 0;
        for (const mItem of mongoItems) {
            const pItem = pgItems.find(p => String(p.id) === String(mItem.id));
            if (!pItem) {
                console.error(`❌ Item ${mItem.name} (id:${mItem.id}) missing in CockroachDB!`);
                itemMismatch++;
                continue;
            }
            if (mItem.name !== pItem.name) {
                console.error(`❌ Item ${mItem.name} mismatch in basic fields.`);
                itemMismatch++;
            }
            if (!compareStats(mItem.stats, pItem.stats)) {
                console.error(`❌ Item ${mItem.name} mismatch in stats!`);
                console.error("Mongo Stats:", JSON.stringify(mItem.stats));
                console.error("PG Stats:", JSON.stringify(pItem.stats));
                itemMismatch++;
            }
        }
        if (itemMismatch === 0) console.log("✅ All items match perfectly!");

        // 4. Verify Pets
        console.log("\nVerifying pets deeply...");
        const mongoPets = await db1.collection("pets").find().toArray();
        const pgPetsRes = await pgPool.query('SELECT * FROM pets');
        const pgPets = pgPetsRes.rows;

        console.log(`[Pets Count] Mongo: ${mongoPets.length} | Cockroach: ${pgPets.length}`);
        let petMismatch = 0;
        for (const mPet of mongoPets) {
            const pPet = pgPets.find(p => String(p.id) === String(mPet.id));
            if (!pPet) {
                console.error(`❌ Pet ${mPet.name} (id:${mPet.id}) missing in CockroachDB!`);
                petMismatch++;
                continue;
            }
            if (mPet.name !== pPet.name) {
                console.error(`❌ Pet ${mPet.name} mismatch in basic fields.`);
                petMismatch++;
            }
            if (!compareStats(mPet.stats, pPet.stats)) {
                console.error(`❌ Pet ${mPet.name} mismatch in stats!`);
                console.error("Mongo Stats:", JSON.stringify(mPet.stats));
                console.error("PG Stats:", JSON.stringify(pPet.stats));
                petMismatch++;
            }
        }
        if (petMismatch === 0) console.log("✅ All pets match perfectly!");

    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await client1.close();
        await client2.close();
        await pgPool.end();
    }
}

verify();
