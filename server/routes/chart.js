import express from "express";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

export default function createChartsRouter(db1, db2) {
    const logs1 = db1.collection("marketlogs");
    const logs2 = db2.collection("marketlogs");
    const router = express.Router();

    const width = 700;
    const height = 400;

    const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width,
        height,
        backgroundColour: "transparent",
    });

    function removeOutliers(data) {
        if (!data.length) return data;
        const values = data.map(d => d.y).sort((a, b) => a - b);
        const q1 = values[Math.floor(values.length / 4)];
        const q3 = values[Math.floor(values.length * 3 / 4)];
        const iqr = q3 - q1;
        const lower = q1 - 1.5 * iqr;
        const upper = q3 + 1.5 * iqr;
        return data.filter(d => d.y >= lower && d.y <= upper);
    }

    function generateThreeLabels(trades) {
        const totalPoints = trades.length;
        if (totalPoints === 0) return [];
        if (totalPoints === 1) return [0];
        if (totalPoints === 2) return [0, 1];

        const first = 0;
        const last = totalPoints - 1;
        const middle = Math.floor(totalPoints / 2);

        return [first, middle, last];
    }

    function movingAverageLine(data, windowSize = 5) {
        if (data.length < 2) return [];

        const sorted = [...data].sort((a, b) => a.x - b.x);
        const smoothed = [];

        for (let i = 0; i < sorted.length; i++) {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(sorted.length, i + Math.floor(windowSize / 2) + 1);
            const subset = sorted.slice(start, end);
            const avgY = subset.reduce((sum, d) => sum + d.y, 0) / subset.length;
            smoothed.push({ x: sorted[i].x, y: avgY });
        }

        return smoothed;
    }


    router.get("/", async (req, res) => {
        try {
            const itemId = req.query.item;
            if (!itemId) return res.status(400).json({ error: "Missing ?item parameter" });

            const lastN = Math.min(parseInt(req.query.last || "500", 10), 5000);
            const hidePrivate = req.query.private === "false";
            const removeOutlierFlag = req.query.routlier === "true";

            const query = { i: parseInt(itemId, 10) };
            if (hidePrivate) query.id = { $not: { $regex: /^PV/ } };

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

            if (!merged.length) return res.status(404).json({ error: "No trades found" });

            const trades = merged.reverse();

            let sellTrades = trades
                .map((t, idx) => t.s === true ? { x: idx, y: t.y, date: t.x } : null)
                .filter(Boolean);

            let buyTrades = trades
                .map((t, idx) => t.s === false ? { x: idx, y: t.y, date: t.x } : null)
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
            res.set("Content-Type", "image/png");
            res.send(image);

        } catch (err) {
            console.error("Error generating chart:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    return router;
}
