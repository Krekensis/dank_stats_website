import dotenv from "dotenv";
import axios from "axios";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "dankstats";
const COLLECTION_NAME = "petmarketlogs";
const PETS_COLLECTION = "pets";

const CHANNEL_ID = "1011289984306778283"; // marketplace-logs
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const TARGET_BOT_ID = "270904126974590976"; // dank memer

const discordAPI = axios.create({
    baseURL: "https://discord.com/api/v10",
    headers: { Authorization: DISCORD_TOKEN },
});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNum(input) {
    const match = input?.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, ""), 10) : null;
}

function getName(str) {
    return str
        .replace(/,/g, "")
        .replace(/^\d+\s*x\s*/i, "")
        .replace(/<a?:\w+:\d+>/g, "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/\d+/g, "")
        .replace(/\([^)]*\)/g, "")
        .toLowerCase()
        .replace("pet", "")
        .trim();

}

function hasVPU(str) {
    return str.toLowerCase().includes("value per unit");
}

function extractEmojiURL(input) {
    const match = input.match(/<(a?):(\w+):(\d+)>/);
    if (!match) return null;
    return `https://cdn.discordapp.com/emojis/${match[3]}.${match[1] === "a" ? "webp?animated=true" : "webp"}`;
}

async function main() {

    const { data: [latestMsg] } = await discordAPI.get(`/channels/${CHANNEL_ID}/messages`, {
        params: { limit: 1 },
    });
    let before = latestMsg.id;
    let l_id = latestMsg.embeds?.[0]?.footer?.text?.slice(4) || "??";

    console.warn(`🚀 Starting from latest message ID: ${before} | ${l_id}`);

    if (!before) return console.warn('No "before" id');

    const client = new MongoClient(MONGO_URI, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });

    await client.connect();
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION_NAME);
    const itemsCol = db.collection(PETS_COLLECTION);
    await col.createIndex({ id: 1 }, { unique: true });

    const items = await itemsCol.find().toArray();
    const itemMap = new Map(items.map(i => [i.name, i.id]));

    let inserted = 0;
    const BATCH_SIZE = 50;
    let buffer = [];

    while (true) {
        try {
            const { data: messages } = await discordAPI.get(`/channels/${CHANNEL_ID}/messages`, {
                params: { limit: 100, before },
            });

            await sleep(250);

            const botMessages = messages.filter((m) => m.author?.id === TARGET_BOT_ID);
            if (botMessages.length === 0) {
                console.warn("📭 No more messages to process.");
                break;
            }

            console.warn(`🔍 Processing ${botMessages.length} bot messages...`);

            for (const msg of botMessages) {
                before = msg.id;
                const embed = msg.embeds?.[0];
                if (!embed || !embed.footer?.text) continue;
                if (!embed.description?.toLowerCase().includes(" pet *for*") && !embed.description.toLowerCase().includes(" pet (")) continue;

                let type, item, vpu, amt, iurl;
                const desc = embed.description;

                if (embed.title.toLowerCase().includes("sell offer")) {
                    type = true;
                    if (hasVPU(desc)) {
                        iurl = extractEmojiURL(desc.split("\n")[0].split("*for*")[0].trimStart());
                        item = getName(desc.split("\n")[0].split("*for*")[0].trimStart());
                        amt = 1;
                        vpu = getNum(desc.split("\n")[2]);
                    } else continue;
                }

                const timestamp = new Date(msg.timestamp);
                const id = embed.footer.text.slice(4);

                if (type !== undefined && item && vpu && amt && iurl && id) {

                    let itemID = itemMap.get(item);
                    if (!itemID) {
                        const maxId = Math.max(...itemMap.values(), -1) + 1;
                        itemID = maxId;
                        itemMap.set(item, itemID);

                        itemsCol.updateOne(
                            { name: item },
                            { $set: { name: item, id: itemID, url: iurl, history: [{ t: timestamp, v: 0 }] } },
                            { upsert: true }
                        ).catch(console.error);
                    }

                    buffer.push({ id, i: itemID, t: timestamp, v: vpu, n: amt, s: type });

                    if (buffer.length >= BATCH_SIZE) {
                        try {
                            const result = await col.insertMany(buffer, { ordered: false });
                            inserted += result.insertedCount;
                            console.warn(`📦 Inserted ${result.insertedCount} trades`);
                            for (const doc of buffer) {
                                console.log(`✅ ${doc.id} | ${doc.i} | ⏣ ${doc.v} x ${doc.n}`);
                            }
                        } catch (e) {
                            if (e.code === 11000 || (e.writeErrors && e.writeErrors.some(err => err.code === 11000))) {
                                const insertedIds = e.result?.insertedIds || {};
                                const insertedDocs = Object.keys(insertedIds).map(i => buffer[parseInt(i)]);

                                if (insertedDocs.length > 0) {
                                    console.warn(`📦 Inserted ${insertedDocs.length} (before duplicate hit):`);
                                    for (const doc of insertedDocs) {
                                        console.log(`✅ ${doc.id} | ${doc.i} | ⏣ ${doc.v} x ${doc.n}`);
                                    }
                                    inserted += insertedDocs.length;
                                }

                                // Find which ID caused the duplicate
                                const dupErr = e.writeErrors?.find(err => err.code === 11000);
                                if (dupErr) {
                                    const dupDoc = buffer[dupErr.index];
                                    console.error(`🛑 Duplicate ID detected: ${dupDoc.id}. Stopping script.`);
                                } else {
                                    console.error("🛑 Duplicate ID detected (could not resolve specific doc). Stopping script.");
                                }

                                await client.close();
                                console.warn(`\n📊 Final Inserted: ${inserted} | Stopped at message ID: ${before}`);
                                process.exit(0);
                            }
                            else {
                                console.error("❌ Insert error:", e.message);
                            }
                        }
                        buffer = [];
                    }
                }
            }
        } catch (err) {
            if (err.response?.status === 429) {
                const retryAfter = err.response.data.retry_after ?? 1000;
                console.warn(`⚠️ Rate limited. Retrying in ${retryAfter}ms`);
                await sleep(retryAfter);
            } else {
                console.error("❌ Request failed:", err.message);
                await sleep(1000);
            }
        }
    }

    if (buffer.length > 0) {
        try {
            const result = await col.insertMany(buffer, { ordered: false });
            inserted += result.insertedCount;
            console.warn(`📦 Inserted final batch of ${result.insertedCount}`);
            for (const doc of buffer) {
                console.log(`✅ ${doc.id} | ${doc.i} | ⏣ ${doc.v} x ${doc.n}`);
            }
        } catch (e) {
            if (e.code === 11000 || (e.writeErrors && e.writeErrors.some(err => err.code === 11000))) {
                const insertedIds = e.result?.insertedIds || {};
                const insertedDocs = Object.keys(insertedIds).map(i => buffer[parseInt(i)]);

                if (insertedDocs.length > 0) {
                    console.warn(`📦 Inserted ${insertedDocs.length} (before duplicate hit in final batch):`);
                    for (const doc of insertedDocs) {
                        console.log(`✅ ${doc.id} | ${doc.i} | ⏣ ${doc.v} x ${doc.n}`);
                    }
                    inserted += insertedDocs.length;
                }

                const dupErr = e.writeErrors?.find(err => err.code === 11000);
                if (dupErr) {
                    const dupDoc = buffer[dupErr.index];
                    console.error(`🛑 Duplicate ID in final batch: ${dupDoc.id}`);
                } else {
                    console.error("🛑 Duplicate ID in final batch (unresolved).");
                }
            }
            else {
                console.error("❌ Final insert error:", e.message);
            }
        }
    }

    await client.close();
    console.warn(`\n🎉 Done! Inserted: ${inserted}`);
}

main().catch((err) => {
    console.error("❌ Script crashed:", err);
});