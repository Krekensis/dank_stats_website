import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';

async function check() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db('dankstats');

  // 1. Check if DB has stats
  const itemWithStats = await db.collection('items').findOne({ stats: { $exists: true } });
  console.log("DB Stats object:", JSON.stringify(itemWithStats?.stats, null, 2));

  // 2. Check the API response directly
  try {
    const res = await fetch('http://localhost:3001/api/items');
    if (res.ok) {
      const data = await res.json();
      console.log("API returned items count:", data.length);
      console.log("First item stats:", JSON.stringify(data[0]?.stats, null, 2));
    } else {
      console.log("API error:", res.status);
    }
  } catch (e) {
    console.log("Fetch failed. Is server running?");
  }

  await client.close();
}

check();
