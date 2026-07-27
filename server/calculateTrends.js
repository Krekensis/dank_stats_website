import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const MONGO_URI2 = process.env.MONGO_URI2;

const removeOutliers = (data, threshold = 3) => {
    if (data.length === 0) return data;

    const baselineTrades = data.filter(p => p.v !== 1 && (!p.id || !p.id.startsWith('PV')));
    const baseData = baselineTrades.length > 0 ? baselineTrades : data;

    const values = baseData.map(point => point.v).sort((a, b) => a - b);

    const getMedian = (arr) => {
      const mid = Math.floor(arr.length / 2);
      return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    };

    const median = getMedian(values);
    const deviations = values.map(v => Math.abs(v - median)).sort((a, b) => a - b);
    const mad = getMedian(deviations);

    let madStdDev = 1.4826 * mad;

    if (madStdDev === 0) {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
      madStdDev = stdDev > 0 ? stdDev : Math.max(1, median * 0.01);
    }

    return data.filter(point => Math.abs(point.v - median) <= threshold * madStdDev);
};

const getAvg = (data) => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, curr) => acc + curr.v, 0);
    return sum / data.length;
};

const getTradeCount = (data) => data.length;

async function main() {
    console.log("🚀 Starting market trends calculation...");
    
    const client1 = new MongoClient(MONGO_URI, {
        serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    });
    const client2 = new MongoClient(MONGO_URI2, {
        serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    });
    
    await Promise.all([client1.connect(), client2.connect()]);
    
    const db1 = client1.db("dankstats");
    const db2 = client2.db("dankstats");
    
    const itemsCol = db1.collection("items");
    const logs1 = db1.collection("marketlogs");
    const logs2 = db2.collection("marketlogs");
    const scrapedCol = db1.collection("scraped");

    const items = await itemsCol.find({}, { projection: { id: 1, name: 1, url: 1 } }).toArray();
    console.log(`Found ${items.length} items to process.`);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const trends = [];

    let count = 0;
    for (const item of items) {
        count++;
        // Fetch last 14 days of logs, filtering out 1-coin trades explicitly in the DB for efficiency
        const query = { i: item.id, t: { $gte: fourteenDaysAgo }, v: { $ne: 1 } };
        
        const [docs1, docs2] = await Promise.all([
            logs1.find(query).project({ t: 1, v: 1, n: 1, id: 1 }).toArray(),
            logs2.find(query).project({ t: 1, v: 1, n: 1, id: 1 }).toArray()
        ]);
        
        let allLogs = [...docs1, ...docs2];
        
        // Remove outliers
        allLogs = removeOutliers(allLogs);
        
        // Split into periods
        const last24h = allLogs.filter(l => l.t >= oneDayAgo);
        const prev24h = allLogs.filter(l => l.t >= twoDaysAgo && l.t < oneDayAgo);
        
        const last7d = allLogs.filter(l => l.t >= sevenDaysAgo);
        const prev7d = allLogs.filter(l => l.t >= fourteenDaysAgo && l.t < sevenDaysAgo);
        
        const avg24h = getAvg(last24h);
        const avgPrev24h = getAvg(prev24h);
        
        const avg7d = getAvg(last7d);
        const avgPrev7d = getAvg(prev7d);
        
        const change24h = avg24h - avgPrev24h;
        const changePct24h = avgPrev24h > 0 ? (change24h / avgPrev24h) * 100 : 0;
        
        const change7d = avg7d - avgPrev7d;
        const changePct7d = avgPrev7d > 0 ? (change7d / avgPrev7d) * 100 : 0;
        
        const vol24h = last24h.reduce((acc, curr) => acc + (curr.v * curr.n), 0);
        const vol7d = last7d.reduce((acc, curr) => acc + (curr.v * curr.n), 0);
        
        trends.push({
            id: item.id,
            name: item.name,
            url: item.url,
            daily: {
                avg: avg24h,
                prevAvg: avgPrev24h,
                change: change24h,
                changePct: changePct24h,
                trades: getTradeCount(last24h),
                vol: vol24h
            },
            weekly: {
                avg: avg7d,
                prevAvg: avgPrev7d,
                change: change7d,
                changePct: changePct7d,
                trades: getTradeCount(last7d),
                vol: vol7d
            }
        });

        if (count % 20 === 0) {
            console.log(`Processed ${count}/${items.length} items...`);
        }
    }

    console.log("Saving trends to database...");
    
    await scrapedCol.updateOne(
        { id: "market_trends" },
        { 
            $set: { 
                id: "market_trends", 
                updatedAt: new Date(), 
                data: trends 
            } 
        },
        { upsert: true }
    );
    
    console.log("✅ Market trends saved successfully!");

    await client1.close();
    await client2.close();
    process.exit(0);
}

main().catch(err => {
    console.error("❌ Error calculating market trends:", err);
    process.exit(1);
});
