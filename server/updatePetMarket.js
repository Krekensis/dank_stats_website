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

const defaultStats = {
    total: { trades: 0, vol: 0, num: 0 },
    public: { buy: { trades: 0, vol: 0, num: 0 }, sell: { trades: 0, vol: 0, num: 0 } },
    private: { buy: { trades: 0, vol: 0, num: 0 }, sell: { trades: 0, vol: 0, num: 0 } },
};

async function incrementStats(docs, itemsCol) {
    if (docs.length === 0) return;
    const bulkOps = [];
    const uniqueItemIds = new Set();
    for (const doc of docs) {
        uniqueItemIds.add(doc.i);
        const vis = doc.id.startsWith("PV") ? "private" : "public";
        const type = doc.s ? "sell" : "buy";
        const vol = doc.v * doc.n;
        bulkOps.push({
            updateOne: {
                filter: { id: doc.i },
                update: {
                    $inc: {
                        "stats.total.trades": 1,
                        "stats.total.vol": vol,
                        "stats.total.num": doc.n,
                        [`stats.${vis}.${type}.trades`]: 1,
                        [`stats.${vis}.${type}.vol`]: vol,
                        [`stats.${vis}.${type}.num`]: doc.n
                    }
                }
            }
        });
    }
    await itemsCol.bulkWrite(bulkOps, { ordered: false }).catch(err => console.error("Stats update error:", err));
}



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

    async function getNextValidId() {
        const allItems = await itemsCol.find({}, { projection: { id: 1 } }).toArray();
        const uniqueIds = Array.from(new Set(allItems.map(i => i.id))).filter(id => typeof id === 'number').sort((a, b) => b - a);
        const idSet = new Set(uniqueIds);
        let maxValidId = -1;
        for (const id of uniqueIds) {
            if (idSet.has(id - 1) && idSet.has(id - 2)) {
                maxValidId = id;
                break;
            }
        }
        if (maxValidId === -1 && uniqueIds.length > 0) {
            maxValidId = Math.max(...uniqueIds);
        }
        return maxValidId >= 0 ? maxValidId + 1 : 1;
    }

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
                    if (itemID === undefined) {
                        itemID = await getNextValidId();
                        itemMap.set(item, itemID);

                        await itemsCol.updateOne(
                            { name: item },
                            { 
                                $setOnInsert: { stats: defaultStats },
                                $set: { name: item, id: itemID, url: iurl, history: [{ t: timestamp, v: 0 }] } 
                            },
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
                            await incrementStats(buffer, itemsCol);
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
                                    await incrementStats(insertedDocs, itemsCol);
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
            await incrementStats(buffer, itemsCol);
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
                    await incrementStats(insertedDocs, itemsCol);
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