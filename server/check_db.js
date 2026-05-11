import dotenv from "dotenv";
dotenv.config();
import { MongoClient, ServerApiVersion } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

const client2 = new MongoClient(process.env.MONGO_URI2, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function check() {
  try {
    await client.connect();
    const db = client.db("dankstats");
    const db2 = client2.db("dankstats");

    const logs = db.collection("marketlogs");
    const logs2 = db2.collection("marketlogs");

    console.log("Checking DB1 marketlogs 'i' values...");

    // Group by 'i' and count
    const result = await logs.aggregate([
      { $group: { _id: "$i", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    let normalCount = 0;
    let offsetCount = 0;
    let graveyardCount = 0;
    let totalCount = 0;

    console.log("Sample of 'i' values found:");
    for (let j = 0; j < Math.min(20, result.length); j++) {
      console.log(`i: ${result[j]._id}, count: ${result[j].count}`);
    }
    if (result.length > 20) console.log(`... and ${result.length - 20} more distinct 'i' values.`);

    for (const r of result) {
      totalCount += r.count;
      if (r._id > 1000000 && r._id < 9000000) offsetCount += r.count;
      else if (r._id > 9000000) graveyardCount += r.count;
      else normalCount += r.count;
    }

    console.log(`\nSummary DB1:`);
    console.log(`Total trades: ${totalCount}`);
    console.log(`Trades in normal range (0 - 1M): ${normalCount}`);
    console.log(`Trades in offset range (1M - 9M): ${offsetCount}`);
    console.log(`Trades in graveyard range (9M+): ${graveyardCount}`);

    console.log("----------------------------------------------------------------");
    console.log("Checking db2");

    // Group by 'i' and count
    const result2 = await logs2.aggregate([
      { $group: { _id: "$i", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    let normalCount2 = 0;
    let offsetCount2 = 0;
    let graveyardCount2 = 0;
    let totalCount2 = 0;

    console.log("Sample of 'i' values found:");
    for (let j = 0; j < Math.min(20, result2.length); j++) {
      console.log(`i: ${result2[j]._id}, count: ${result2[j].count}`);
    }
    if (result2.length > 20) console.log(`... and ${result2.length - 20} more distinct 'i' values.`);

    for (const r of result2) {
      totalCount2 += r.count;
      if (r._id > 1000000 && r._id < 9000000) offsetCount2 += r.count;
      else if (r._id > 9000000) graveyardCount2 += r.count;
      else normalCount2 += r.count;
    }

    console.log(`\nSummary DB2:`);
    console.log(`Total trades: ${totalCount2}`);
    console.log(`Trades in normal range (0 - 1M): ${normalCount2}`);
    console.log(`Trades in offset range (1M - 9M): ${offsetCount2}`);
    console.log(`Trades in graveyard range (9M+): ${graveyardCount2}`);

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
check();
