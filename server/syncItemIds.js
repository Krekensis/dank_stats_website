import dotenv from "dotenv";
import { MongoClient } from "mongodb";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "dankstats";

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

async function main() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not defined in .env");
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    const db = client.db(DB_NAME);

    // 1. Fetch official scraped items
    const scrapedDoc = await db.collection("scraped").findOne({ id: "items" });
    if (!scrapedDoc || !scrapedDoc.data) {
      console.error("No scraped items data found.");
      return;
    }
    const officialItems = scrapedDoc.data;

    // Create a map of name -> official item
    const officialNameMap = new Map();
    for (const item of officialItems) {
      officialNameMap.set(item.name.toLowerCase(), item);
    }

    // 2. Fetch all our local items
    const localItems = await db.collection("items").find({}).toArray();

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const localItem of localItems) {
      let officialItem = officialNameMap.get(localItem.name.toLowerCase());

      if (!officialItem) {
        // Try with fixed name
        const fixed = fixName(localItem.name.toLowerCase());
        officialItem = officialNameMap.get(fixed);
      }

      if (officialItem) {
        if (localItem.id !== officialItem.id) {
          console.log(`Mismatch found: '${localItem.name}' (Local ID: ${localItem.id}, Official ID: ${officialItem.id})`);

          // Update the local item with the official ID
          await db.collection("items").updateOne(
            { _id: localItem._id },
            { $set: { id: officialItem.id } }
          );
          updatedCount++;
        }
      } else {
        console.log(`Warning: '${localItem.name}' not found in official scraped data.`);
        notFoundCount++;
      }
    }

    // 3. Find missing official items and add them
    const localIdSet = new Set(localItems.map(item => item.id));
    let addedCount = 0;

    const defaultStats = {
      total: { trades: 0, vol: 0, num: 0 },
      public: { buy: { trades: 0, vol: 0, num: 0 }, sell: { trades: 0, vol: 0, num: 0 } },
      private: { buy: { trades: 0, vol: 0, num: 0 }, sell: { trades: 0, vol: 0, num: 0 } },
    };

    for (const officialItem of officialItems) {
      if (!localIdSet.has(officialItem.id)) {
        console.log(`Adding missing item: '${officialItem.name}' (ID: ${officialItem.id})`);

        const newItem = {
          id: officialItem.id,
          name: officialItem.name.toLowerCase(),
          url: officialItem.imageURL || null,
          stats: defaultStats,
          history: []
        };

        await db.collection("items").insertOne(newItem);
        addedCount++;
      }
    }

    console.log(`\nSync Complete: Updated ${updatedCount} items. Added ${addedCount} missing items. ${notFoundCount} local items not found in official data.`);

  } catch (error) {
    console.error("Error during sync:", error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

main();
