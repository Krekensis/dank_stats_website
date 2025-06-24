import express from "express";

const router = express.Router();

export default function createMarketLogsRouter(db) {
    const logsCollection = db.collection("marketlogs");

    router.get("/", async (req, res) => {
        try {
            const {
                item,
                type,
                private: isPrivate,
                skip = 0,
                limit = 10000,
                start,
                end,
                countOnly,
            } = req.query;

            const query = {};
            if (item) query.i = item;
            if (type === "sell") query.s = true;
            else if (type === "buy") query.s = false;
            if (isPrivate === "false") query.id = { $not: { $regex: /^PV/ } };

            if (start || end) {
                query.t = {};
                if (start) query.t.$gte = new Date(start);
                if (end) query.t.$lte = new Date(end);
            }

            if (countOnly === "true") {
                const count = await logsCollection.countDocuments(query);
                return res.json({ count });
            }

            const logs = await logsCollection
                .find(query)
                .project({ x: "$t", y: "$v", n: "$n", id: 1, s: 1, i: 1 })
                .sort({ t: 1 })
                .skip(parseInt(skip))
                .limit(Math.min(parseInt(limit), 10000))
                .toArray();

            res.json(logs);
        } catch (err) {
            console.error("Error fetching market logs:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    return router;
}
