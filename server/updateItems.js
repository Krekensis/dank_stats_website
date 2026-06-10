import dotenv from "dotenv";
import axios from "axios";
import { MongoClient, ServerApiVersion } from "mongodb";
import pkg from 'pg';
const { Pool } = pkg;
dotenv.config();

// --- CONFIGURATION ---
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "dankstats";
const COLLECTION_NAME = "items";
const CHANNEL_ID = "1011290554233008218";
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const TARGET_BOT_ID = "270904126974590976";
const COCKROACH_DB_URI = process.env.COCKROACH_DB_URI;

// --- DISCORD API CLIENT ---
const discordAPI = axios.create({
  baseURL: "https://discord.com/api/v10",
  headers: { Authorization: DISCORD_TOKEN },
});

// --- UTILITY FUNCTIONS ---
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const defaultStats = {
  total: { trades: 0, vol: 0, num: 0 },
  public: { buy: { trades: 0, vol: 0, num: 0 }, sell: { trades: 0, vol: 0, num: 0 } },
  private: { buy: { trades: 0, vol: 0, num: 0 }, sell: { trades: 0, vol: 0, num: 0 } },
};

function extractValue(input) {
  if (!input || typeof input !== "string") return null;
  const cleaned = input.replace(/`/g, "").trim();
  const matches = [...cleaned.matchAll(/⏣\s?([\d,]+)/g)];
  if (matches.length === 0) return null;
  const lastValue = matches[matches.length - 1][1];
  return parseInt(lastValue.replace(/,/g, ""), 10);
}

function extractName(input) {
  if (!input || typeof input !== "string") return null;
  return input
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/<a?:\w+:\d+>/g, "")
    .trim()
    .toLowerCase();
}

function extractEmojiURL(input) {
  const match = input.match(/<(a?):(\w+):(\d+)>/);
  if (!match) return null;
  return `https://cdn.discordapp.com/emojis/${match[3]}.${match[1] === "a" ? "webp?animated=true" : "webp"}`;
}

// --- NEW: fixName() ---
function fixName(name) {
  const corrections = {
    "jelly fish": "legacy jelly fish",
    "yeng's paw": "squishy paw",
    "legendary fish": "legacy legendary fish",
    "patreon pack": "membership pack",
    "fishing bait": "legacy fishing bait",
    "potato ☭": "potato",
    "common fish": "legacy common fish",
    "patreon box": "membership box",
    "kraken": "legacy kraken",
    "rare fish": "legacy rare fish",
    "exotic fish": "legacy rare fish",
    "bunny's apron": "apron",
    "amathine's butterfly": "rare butterfly",
    "alexa's megaphone": "the megaphone",
    "exclusive website box": "exclusive gems box",
    "fishing pole": "legacy fishing pole",
    "delta  seeds": "delta 9 seeds",
    "d": "d100",
    "sunbear's d": "sunbear's d20",
    "bean mp player": "bean mp3 player",
  };
  return corrections[name] || name;
}

// --- MAIN FUNCTION ---
const main = async () => {
  const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  const pgPool = new Pool({ connectionString: COCKROACH_DB_URI });

  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  console.log(`🔄 Fetching messages from channel ${CHANNEL_ID}...`);
  let before = null;
  let batch = 1;
  let stopFlag = false;

  async function getNextValidId() {
      const allItems = await collection.find({}, { projection: { id: 1 } }).toArray();
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

  while (!stopFlag) {
    try {
      const { data: messages } = await discordAPI.get(
        `/channels/${CHANNEL_ID}/messages`,
        {
          params: {
            limit: 100,
            ...(before && { before }),
          },
        }
      );

      if (!messages.length) break;

      console.log(`📦 Batch ${batch++}: ${messages.length} messages`);

      for (const msg of messages) {
        if (msg.author?.id !== TARGET_BOT_ID) continue;
        const timestamp = new Date(msg.timestamp);

        // --- Extract item name and value ---
        let itemRaw = null;
        let valueRaw = null;

        if (msg.embeds?.length > 0) {
          const embed = msg.embeds[0];
          itemRaw = embed.title || null;
          valueRaw =
            embed.fields?.length > 0
              ? embed.fields[embed.fields.length - 1].value
              : embed.description || null;
        } else if (msg.components?.length > 0) {
          const comps = msg.components[0]?.components || [];
          itemRaw = comps[0]?.content || null;
          valueRaw = comps[2]?.content || null;
        }

        let name = extractName(itemRaw);
        if (!name) continue;
        name = fixName(name);

        const parsedValue = extractValue(valueRaw);
        if (parsedValue === null) continue;

        const emojiURL = extractEmojiURL(itemRaw);

        // --- Check existing document in DB ---
        let existing = await collection.findOne({ name });
        if (existing && existing.history.some((h) => new Date(h.t).getTime() === timestamp.getTime())) {
          console.log(`⏹️ Stopping at duplicate timestamp for "${name}"`);
          stopFlag = true;
          break;
        }
        // --- ID assignment ---
        let itemId;
        if (existing?.id !== undefined) {
          itemId = existing.id;
        } else {
          itemId = await getNextValidId();
        }

        // --- Safe update to append to history ---
        await collection.updateOne(
          { name },
          {
            $setOnInsert: { id: itemId, stats: defaultStats },
            $set: { url: emojiURL || existing?.url || null },
            $push: { history: { t: timestamp, v: parsedValue } },
          },
          { upsert: true }
        );

        // --- NEW: Sync to CockroachDB ---
        const updatedDoc = await collection.findOne({ name });
        if (updatedDoc) {
            await pgPool.query(
                `INSERT INTO items (id, name, url, history, stats) VALUES ($1, $2, $3, $4, $5) 
                 ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, url = EXCLUDED.url, history = EXCLUDED.history, stats = EXCLUDED.stats`,
                [updatedDoc.id, updatedDoc.name, updatedDoc.url, JSON.stringify(updatedDoc.history || []), JSON.stringify(updatedDoc.stats || {})]
            );
        }

        console.log(`💾 Updated: ${name} (id=${itemId}) @ ${timestamp.toISOString()}`);
      }

      before = messages[messages.length - 1].id;
    } catch (err) {
      console.error("❌ Error:", err.message);
      break;
    }

    await sleep(300);
  }

  console.log("🎉 Sync complete!");
  await client.close();
  await pgPool.end();
};

main().catch((err) => {
  console.error("❌ Script crashed:", err);
});
