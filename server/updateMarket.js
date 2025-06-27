require("dotenv").config();
const axios = require("axios");
const { MongoClient, ServerApiVersion } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "dankstats";
const COLLECTION_NAME = "marketlogs";

const CHANNEL_ID = "1011289984306778283"; // marketplace-logs
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const TARGET_BOT_ID = "270904126974590976"; //dank memer 

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
    .trim()
    .toLowerCase();
}

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

function isItemTrade(str) {
  const firstLine = str.split("\n")[0];
  return !(firstLine.includes("⏣") && firstLine.split("*for*").length > 1);
}

function hasVPU(str) {
  return str.toLowerCase().includes("value per unit");
}

async function main() {

  let before;
  const { data: [latestMsg] } = await discordAPI.get(`/channels/${CHANNEL_ID}/messages`, {
    params: { limit: 1 },
  });
  before = latestMsg.id;
  console.log("🚀 Starting from latest message ID:", before);

  if(!before){return console.log('No "before" id')}

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

  await col.createIndex({ id: 1 }, { unique: true });
  let inserted = 0;
  const BATCH_SIZE = 50;
  let buffer = [];

  while (true) {
    try {
      const { data: messages } = await discordAPI.get(`/channels/${CHANNEL_ID}/messages`, {
        params: { limit: 100, before },
      });

      await sleep(250); // Safe delay

      const botMessages = messages.filter((m) => m.author?.id === TARGET_BOT_ID);
      if (botMessages.length === 0) {
        console.log("📭 No more messages to process.");
        break;
      }

      console.log(`🔍 Processing ${botMessages.length} bot messages...`);

      for (const msg of botMessages) {
        before = msg.id;

        const embed = msg.embeds?.[0];
        if (!embed || !embed.footer?.text) continue;
        if (embed.description?.toLowerCase().includes(" pet *for*") || embed.description.toLowerCase().includes(" pet (")) continue;

        let type, item, vpu, amt;
        const desc = embed.description;

        if (embed.title.toLowerCase().includes("buy offer")) {
          type = false;
          if (isItemTrade(desc) && hasVPU(desc)) {
            item = fixName(getName(desc.split("\n")[0].split("*for*")[1].trimStart()));
            amt = getNum(desc.split("\n")[0].split("*for*")[1]);
            vpu = getNum(desc.split("\n")[2]);
          } else if (!isItemTrade(desc) && hasVPU(desc)) {
            item = fixName(getName(desc.split("\n")[0].split("*for*")[1].trimStart()));
            amt = getNum(desc.split("\n")[0].split("*for*")[1]);
            vpu = getNum(desc.split("\n")[2]);
          } else if (!isItemTrade(desc) && !hasVPU(desc)) {
            item = fixName(getName(desc.split("\n")[0].split("*for*")[1].trimStart()));
            amt = getNum(desc.split("\n")[0].split("*for*")[1]);
            const total = getNum(desc.split("\n")[0].split("*for*")[0]);
            vpu = Math.round(total / amt);
          } else continue;
        }

        if (embed.title.toLowerCase().includes("sell offer")) {
          type = true;
          if (isItemTrade(desc) && hasVPU(desc)) {
            item = fixName(getName(desc.split("\n")[0].split("*for*")[0].trimStart()));
            amt = getNum(desc.split("\n")[0].split("*for*")[0]);
            vpu = getNum(desc.split("\n")[2]);
          } else if (!isItemTrade(desc) && hasVPU(desc)) {
            item = fixName(getName(desc.split("\n")[0].split("*for*")[0].trimStart()));
            amt = getNum(desc.split("\n")[0].split("*for*")[0]);
            vpu = getNum(desc.split("\n")[2]);
          } else if (!isItemTrade(desc) && !hasVPU(desc)) {
            item = fixName(getName(desc.split("\n")[0].split("*for*")[0].trimStart()));
            amt = getNum(desc.split("\n")[0].split("*for*")[0]);
            const total = getNum(desc.split("\n")[0].split("*for*")[1]);
            vpu = Math.round(total / amt);
          } else continue;
        }

        const timestamp = new Date(msg.timestamp);
        const id = embed.footer.text.slice(4);

        if (type !== undefined && item && vpu && amt && id) {
          buffer.push({ id, i: item, t: timestamp, v: vpu, n: amt, s: type });

          if (buffer.length >= BATCH_SIZE) {
            try {
              const result = await col.insertMany(buffer, { ordered: false });
              inserted += result.insertedCount;
              console.log(`📦 Inserted ${result.insertedCount} trades`);
              for (const doc of buffer) {
                console.log(`✅ ${doc.id} | ${doc.i} | ⏣ ${doc.v} x ${doc.n}`);
              }
            } catch (e) {
              if (e.code === 11000 || (e.writeErrors && e.writeErrors.some(err => err.code === 11000))) {
                console.warn("🛑 Duplicate ID detected. Stopping script.");
                await client.close();
                console.log(`\n📊 Final Inserted: ${inserted} | Stopped at message ID: ${before}`);
                process.exit(0);
              } else {
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

  // Insert remaining buffer
  if (buffer.length > 0) {
    try {
      const result = await col.insertMany(buffer, { ordered: false });
      inserted += result.insertedCount;
      console.log(`📦 Inserted final batch of ${result.insertedCount}`);
      for (const doc of buffer) {
        console.log(`✅ ${doc.id} | ${doc.i} | ⏣ ${doc.v} x ${doc.n}`);
      }
    } catch (e) {
      if (e.code === 11000 || (e.writeErrors && e.writeErrors.some(err => err.code === 11000))) {
        console.warn("🛑 Duplicate ID detected in final batch. Stopping.");
      } else {
        console.error("❌ Final insert error:", e.message);
      }
    }
  }

  await client.close();
  console.log(`\n🎉 Done! Inserted: ${inserted}`);
}

main().catch((err) => {
  console.error("❌ Script crashed:", err);
});
