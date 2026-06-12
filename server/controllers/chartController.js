import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { removeOutliers, generateThreeLabels, movingAverageLine } from "../utils/mathUtils.js";

const width = 700;
const height = 400;

const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: "transparent",
});

export const getChart = (db1, db2, pgPool, redisClient) => async (req, res) => {
    const isPet = req.query.isPet === "true";
    // const logs1 = db1.collection(isPet ? "petmarketlogs" : "marketlogs");
    // const logs2 = db2.collection(isPet ? "petmarketlogs" : "marketlogs");
    const tableName = isPet ? "petmarketlogs" : "marketlogs";

    try {
        const itemId = req.query.item;
        if (!itemId) return res.status(400).json({ error: "Missing ?item parameter" });
        if (isNaN(parseInt(itemId, 10))) return res.status(400).json({ error: "Invalid item ID. Must be an integer." });

        const lastN = Math.min(parseInt(req.query.last || "500", 10), 5000);
        const hidePrivate = req.query.private === "false";
        const removeOutlierFlag = req.query.routlier === "true";
        const excludeOneCoin = req.query.ronecoin === "true";

        // Check Redis cache before doing any DB work
        const cacheKey = `chart:${itemId}-${isPet}-${lastN}-${hidePrivate}-${removeOutlierFlag}-${excludeOneCoin}`;
        try {
            const cachedImage = await redisClient.getBuffer(cacheKey);
            if (cachedImage) {
                res.set("Content-Type", "image/png");
                res.set("Cache-Control", "public, max-age=60, s-maxage=60");
                res.set("X-Cache", "HIT");
                return res.send(cachedImage);
            }
        } catch (err) {
            console.error("Redis getBuffer error:", err);
            // If redis fails, continue and generate from DB
        }

        /*
        const query = { i: parseInt(itemId, 10) };
        if (hidePrivate) query.id = { $not: { $regex: /^PV/ } };
        if (excludeOneCoin) query.v = { $ne: 1 };

        let docs1 = await logs1.find(query)
            .sort({ t: -1 })
            .limit(lastN)
            .project({ x: "$t", y: "$v", s: 1 })
            .toArray();

        let merged = docs1;

        if (docs1.length < lastN) {
            const remaining = lastN - docs1.length;
            const docs2 = await logs2.find(query)
                .sort({ t: -1 })
                .limit(remaining)
                .project({ x: "$t", y: "$v", s: 1 })
                .toArray();

            merged = [...docs1, ...docs2]
                .sort((a, b) => new Date(b.x) - new Date(a.x))
                .slice(0, lastN);
        }
        */

        let whereClauses = [`i = $1`];
        let queryParams = [parseInt(itemId, 10)];
        let paramIndex = 2;

        if (hidePrivate) whereClauses.push(`id NOT LIKE 'PV%'`);
        if (excludeOneCoin) whereClauses.push(`v != 1`);
        
        const whereString = "WHERE " + whereClauses.join(" AND ");
        const sqlQuery = `
            SELECT t as x, v as y, s as "isSell"
            FROM ${tableName} 
            ${whereString} 
            ORDER BY t DESC 
            LIMIT $${paramIndex++}
        `;
        queryParams.push(lastN);

        const result = await pgPool.query(sqlQuery, queryParams);
        let merged = result.rows;

        if (!merged.length) return res.status(404).json({ error: "No trades found" });

        const trades = merged.reverse();

        let sellTrades = trades
            .map((t, idx) => t.isSell === true ? { x: idx, y: t.y, date: t.x } : null)
            .filter(Boolean);

        let buyTrades = trades
            .map((t, idx) => t.isSell === false ? { x: idx, y: t.y, date: t.x } : null)
            .filter(Boolean);

        if (removeOutlierFlag) {
            sellTrades = removeOutliers(sellTrades);
            buyTrades = removeOutliers(buyTrades);
        }

        const sellAvgLine = movingAverageLine(sellTrades, 50);
        const buyAvgLine = movingAverageLine(buyTrades, 50);

        const labelIndices = generateThreeLabels(trades);

        const configuration = {
            type: "scatter",
            data: {
                datasets: [
                    ...(sellAvgLine.length > 1 ? [{
                        label: "Sell Trend",
                        data: sellAvgLine,
                        type: "line",
                        borderColor: "#d5ffcc",
                        borderWidth: 5,
                        fill: false,
                        tension: 0.1,
                        pointRadius: 0,
                    }] : []),

                    ...(buyAvgLine.length > 1 ? [{
                        label: "Buy Trend",
                        data: buyAvgLine,
                        type: "line",
                        borderColor: "#ffcabf",
                        borderWidth: 5,
                        fill: false,
                        tension: 0.1,
                        pointRadius: 0,
                    }] : []),
                    {
                        label: "Sell Trades",
                        data: sellTrades,
                        borderColor: "#93ff7d",
                        backgroundColor: "#93ff7d70",
                        pointRadius: 3,
                    },
                    {
                        label: "Buy Trades",
                        data: buyTrades,
                        borderColor: "#ff5736",
                        backgroundColor: "#ff573670",
                        pointRadius: 3,
                    },
                ],
            },
            options: {
                responsive: false,
                plugins: {
                    legend: { display: false },
                    title: { display: false },
                },
                scales: {
                    x: {
                        type: "linear",
                        display: true,
                        min: 0,
                        max: trades.length - 1,
                        ticks: {
                            color: "#fff",
                            callback: function (value) {
                                const tickValue = Math.round(value);
                                if (labelIndices.includes(tickValue)) {
                                    if (trades[tickValue]) {
                                        return new Date(trades[tickValue].x).toLocaleDateString();
                                    }
                                }
                                return "";
                            },
                            stepSize: Math.max(1, Math.floor((trades.length - 1) / 2)),
                            autoSkip: false,
                            includeBounds: true,
                        },
                        afterBuildTicks: function (scale) {
                            scale.ticks = labelIndices.map(index => ({
                                value: index,
                                label: new Date(trades[index].x).toLocaleDateString(),
                            }));
                        },
                        grid: { display: false },
                        border: { display: false },
                    },
                    y: {
                        ticks: { color: "#fff" },
                        grid: { color: "rgba(255,255,255,0.1)" },
                    },
                },
            },
        };

        const image = await chartJSNodeCanvas.renderToBuffer(configuration);

        // Store in Redis cache for 60 seconds
        try {
            await redisClient.setex(cacheKey, 60, image);
        } catch (err) {
            console.error("Redis setex error:", err);
        }

        res.set("Content-Type", "image/png");
        res.set("Cache-Control", "public, max-age=60, s-maxage=60");
        res.set("X-Cache", "MISS");
        res.send(image);

    } catch (err) {
        console.error("Error generating chart:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
