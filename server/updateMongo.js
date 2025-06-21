import dotenv from 'dotenv';
import axios from 'axios';
import { MongoClient, ServerApiVersion } from 'mongodb';

dotenv.config();

// --- CONFIGURATION ---
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "dankstats";
const COLLECTION_NAME = "items";
const CHANNEL_ID = "1011290554233008218";
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const TARGET_BOT_ID = "270904126974590976";

// --- DISCORD API CLIENT ---
const discordAPI = axios.create({
  baseURL: "https://discord.com/api/v10",
  headers: { Authorization: DISCORD_TOKEN },
});

// --- UTILITY FUNCTIONS ---
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

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

function extractEmojiDetails(input) {
  const match = input.match(/<(a?):(\w+):(\d+)>/);
  if (!match) return null;
  return {
    name: match[2],
    id: match[3],
    raw: match[0],
    animated: match[1] === "a",
    url: `https://cdn.discordapp.com/emojis/${match[3]}.${match[1] === "a" ? "gif" : "png"
      }`,
  };
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

  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  console.log(`🔄 Fetching messages from channel ${CHANNEL_ID}...`);
  let before = null;
  let batch = 1;
  let stopFlag = false;

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
        let item = null;
        let value = null;

        if (msg.embeds?.length > 0) {
          const embed = msg.embeds[0];
          item = embed.title || null;
          value =
            embed.fields?.length > 0
              ? embed.fields[embed.fields.length - 1].value
              : embed.description || null;
        } else if (msg.components?.length > 0) {
          const comps = msg.components[0]?.components || [];
          item = comps[0]?.content || null;
          value = comps[2]?.content || null;
        }

        const name = extractName(item);
        if (!name) continue;

        const parsedValue = extractValue(value);
        if (parsedValue === null) continue;

        const newEmoji = extractEmojiDetails(item);

        // --- Check existing document in DB ---
        const existing = await collection.findOne({ name });

        // 🧠 If timestamp already exists, skip and stop early
        if (
          existing &&
          existing.history.some((h) => new Date(h.timestamp).getTime() === timestamp.getTime())
        ) {
          console.log(`⏹️ Stopping at duplicate timestamp for "${name}"`);
          stopFlag = true;
          break;
        }

        // 🎯 Prepare document structure
        const updatedItem = {
          name,
          emoji: existing?.emoji || newEmoji || {
            name: null,
            id: null,
            raw: null,
            animated: false,
            url: null,
          },
          history: [
            ...(existing?.history || []),
            { timestamp, value: parsedValue },
          ],
        };

        // ✏️ If old emoji is null but new one is valid, update emoji
        if (
          (!updatedItem.emoji?.id || updatedItem.emoji?.name === null) &&
          newEmoji
        ) {
          updatedItem.emoji = newEmoji;
        }

        // 🔄 Upsert into Mongo
        await collection.updateOne(
          { name },
          { $set: updatedItem },
          { upsert: true }
        );
        console.log(`💾 Updated: ${name} @ ${timestamp}`);
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
};

main();
