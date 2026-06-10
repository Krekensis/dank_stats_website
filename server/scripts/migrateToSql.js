import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import pkg from 'pg';
const { Pool } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const MONGO_URI2 = process.env.MONGO_URI2;
const COCKROACH_DB_URI = process.env.COCKROACH_DB_URI;

async function migrate() {
    if (!MONGO_URI || !MONGO_URI2 || !COCKROACH_DB_URI) {
        console.error("Missing environment variables.");
        return;
    }

    const pgPool = new Pool({ connectionString: COCKROACH_DB_URI });

    console.log("Creating tables...");
    await pgPool.query(`
        CREATE TABLE IF NOT EXISTS items (
            id INT PRIMARY KEY,
            name TEXT,
            url TEXT,
            history JSONB,
            stats JSONB
        );
        CREATE TABLE IF NOT EXISTS pets (
            id INT PRIMARY KEY,
            name TEXT,
            url TEXT,
            history JSONB,
            stats JSONB
        );
        CREATE TABLE IF NOT EXISTS marketlogs (
            id TEXT PRIMARY KEY,
            i INT,
            s BOOLEAN,
            t TIMESTAMP,
            v BIGINT,
            n INT
        );
        CREATE INDEX IF NOT EXISTS idx_marketlogs_i_t ON marketlogs(i, t DESC);
        CREATE INDEX IF NOT EXISTS idx_marketlogs_s ON marketlogs(s);

        CREATE TABLE IF NOT EXISTS petmarketlogs (
            id TEXT PRIMARY KEY,
            i INT,
            s BOOLEAN,
            t TIMESTAMP,
            v BIGINT,
            n INT
        );
        CREATE INDEX IF NOT EXISTS idx_petmarketlogs_i_t ON petmarketlogs(i, t DESC);
        CREATE INDEX IF NOT EXISTS idx_petmarketlogs_s ON petmarketlogs(s);
    `);
    console.log("Tables created successfully.");

    const client1 = new MongoClient(MONGO_URI);
    const client2 = new MongoClient(MONGO_URI2);

    try {
        await Promise.all([client1.connect(), client2.connect()]);
        const db1 = client1.db("dankstats");
        const db2 = client2.db("dankstats");

        // Migrate items
        /*
        console.log("Migrating items...");
        const items = await db1.collection("items").find().toArray();
        for (const item of items) {
            await pgPool.query(
                `INSERT INTO items (id, name, url, history, stats) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
                [item.id, item.name, item.url, JSON.stringify(item.history || []), JSON.stringify(item.stats || {})]
            );
        }
        console.log(`Migrated ${items.length} items.`);

        // Migrate pets
        console.log("Migrating pets...");
        const pets = await db1.collection("pets").find().toArray();
        for (const pet of pets) {
            await pgPool.query(
                `INSERT INTO pets (id, name, url, history, stats) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
                [pet.id, pet.name, pet.url, JSON.stringify(pet.history || []), JSON.stringify(pet.stats || {})]
            );
        }
        console.log(`Migrated ${pets.length} pets.`);
        */

        // Helper to migrate logs
        async function migrateLogs(db, collectionName, tableName) {
            console.log(`Migrating ${collectionName} from DB...`);
            const cursor = db.collection(collectionName).find();
            let batch = [];
            const batchSize = 2000;
            let total = 0;

            for await (const doc of cursor) {
                batch.push(doc);
                if (batch.length >= batchSize) {
                    await insertLogBatch(pgPool, tableName, batch);
                    total += batch.length;
                    console.log(`Inserted ${total} ${tableName}...`);
                    batch = [];
                }
            }
            if (batch.length > 0) {
                await insertLogBatch(pgPool, tableName, batch);
                total += batch.length;
                console.log(`Inserted ${total} ${tableName}...`);
            }
            console.log(`Finished migrating ${total} records to ${tableName}.`);
        }

        async function insertLogBatch(pool, tableName, docs) {
            if (docs.length === 0) return;
            const values = [];
            const queryParams = [];
            let i = 1;
            for (const doc of docs) {
                values.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);

                const v = typeof doc.v === 'object' && doc.v !== null && doc.v.toString ? doc.v.toString() : doc.v;
                const n = typeof doc.n === 'object' && doc.n !== null && doc.n.toString ? doc.n.toString() : doc.n;

                queryParams.push(doc.id, doc.i, doc.s, new Date(doc.t), v, n);
            }
            const query = `INSERT INTO ${tableName} (id, i, s, t, v, n) VALUES ${values.join(", ")} ON CONFLICT (id) DO NOTHING`;
            await pool.query(query, queryParams);
        }

        // await migrateLogs(db1, "marketlogs", "marketlogs");
        await migrateLogs(db2, "marketlogs", "marketlogs");
        await migrateLogs(db1, "petmarketlogs", "petmarketlogs");
        await migrateLogs(db2, "petmarketlogs", "petmarketlogs");

        console.log("Migration complete!");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client1.close();
        await client2.close();
        await pgPool.end();
    }
}

migrate();
