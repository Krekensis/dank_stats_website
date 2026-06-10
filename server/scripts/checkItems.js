import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Path to the complete-item-data.json relative to this script's location
const jsonFilePath = path.join(__dirname, "../../client/src/assets/complete-item-data.json");

async function checkItems() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    const db = client.db("dankstats");
    const itemsCollection = db.collection("items");

    // Fetch all items from MongoDB
    const dbItems = await itemsCollection.find({}, { projection: { id: 1, name: 1 } }).toArray();
    const dbItemMap = new Map(dbItems.map(item => [item.id, item.name]));
    const dbItemIds = new Set(dbItemMap.keys());

    // Fetch all items from the JSON file
    if (!fs.existsSync(jsonFilePath)) {
      console.error("❌ JSON file not found at path:", jsonFilePath);
      return;
    }

    const fileData = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
    const fileItemMap = new Map(fileData.map(item => [item.id, item.name]));
    const fileItemIds = new Set(fileItemMap.keys());

    // Compare the two sets
    const missingInFile = [...dbItemIds]
      .filter(id => !fileItemIds.has(id))
      .map(id => ({ id, name: dbItemMap.get(id) }));
      
    const missingInDb = [...fileItemIds]
      .filter(id => !dbItemIds.has(id))
      .map(id => ({ id, name: fileItemMap.get(id) }));

    console.log(`Total items in DB: ${dbItemIds.size}`);
    console.log(`Total items in JSON: ${fileItemIds.size}`);
    console.log("--------------------------------------------------");

    let perfectMatch = true;

    if (missingInFile.length > 0) {
      perfectMatch = false;
      console.log(`❌ Items in DB but missing in JSON (${missingInFile.length}):`);
      console.table(missingInFile);
    }

    if (missingInDb.length > 0) {
      perfectMatch = false;
      console.log(`❌ Items in JSON but missing in DB (${missingInDb.length}):`);
      console.table(missingInDb);
    }

    if (perfectMatch) {
      console.log("✅ All items match perfectly between the Database and the JSON file.");
    }
  } catch (error) {
    console.error("❌ Error during check:", error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

checkItems();
