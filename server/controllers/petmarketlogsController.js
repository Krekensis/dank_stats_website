export const getPetMarketLogs = (db1, db2) => async (req, res) => {
  const logs1 = db1.collection("petmarketlogs");
  const logs2 = db2.collection("petmarketlogs");

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
      excludeOneCoin, // optional: "true" to filter out v===1 trades
      sortBy,
      order,
    } = req.query;

    if (type && type !== 'sell' && type !== 'buy') {
      return res.status(400).json({ error: "Wrong parameter value given. Use from sell / buy for type" });
    }

    if (excludeOneCoin && excludeOneCoin !== 'true' && excludeOneCoin !== 'false') {
      return res.status(400).json({ error: "Wrong parameter value given. Use from true / false for excludeOneCoin" });
    }

    if (sortBy) {
      const validSortCols = ['time', 'value', 'amount'];
      if (!validSortCols.includes(sortBy)) {
        return res.status(400).json({ error: "Wrong parameter value given. Use from time / value / amount for sortBy" });
      }
    }

    if (order && order.toLowerCase() !== 'asc' && order.toLowerCase() !== 'desc') {
      return res.status(400).json({ error: "Wrong parameter value given. Use from desc / asc for order" });
    }

    const query = {};
    if (item) query.i = parseInt(item, 10);
    if (type === "sell") query.s = true;
    else if (type === "buy") query.s = false;
    if (isPrivate === "false") query.id = { $not: { $regex: /^PV/ } };
    // Server-side exclude 1 DMC trades via DB query for efficiency
    if (excludeOneCoin === "true") query.v = { $ne: 1 };

    if (start || end) {
      query.t = {};
      if (start) {
        if (isNaN(Date.parse(start))) return res.status(400).json({ error: "Invalid start date format." });
        query.t.$gte = new Date(start);
      }
      if (end) {
        if (isNaN(Date.parse(end))) return res.status(400).json({ error: "Invalid end date format." });
        query.t.$lte = new Date(end);
      }
    }

    if (skip !== undefined && isNaN(parseInt(skip, 10))) return res.status(400).json({ error: "Invalid skip format. Expected integer." });
    if (limit !== undefined && isNaN(parseInt(limit, 10))) return res.status(400).json({ error: "Invalid limit format. Expected integer." });

    // Count mode
    if (countOnly === "true") {
      const [count1, count2] = await Promise.all([
        logs1.countDocuments(query),
        logs2.countDocuments(query),
      ]);
      return res.json({ count: count1 + count2 });
    }

    const limitVal = Math.min(parseInt(limit), 10000);
    const skipVal = parseInt(skip);
    const fetchLimit = skipVal + limitVal;

    let mongoSort = { t: -1 };
    let sortDir = order && order.toLowerCase() === 'asc' ? 1 : -1;
    
    if (sortBy === 'value') mongoSort = { v: sortDir };
    else if (sortBy === 'amount') mongoSort = { n: sortDir };
    else if (sortBy === 'time') mongoSort = { t: sortDir };
    else if (order) mongoSort = { t: sortDir };

    // Fetch data from both, pushing sort and limit down to MongoDB
    const [docs1, docs2] = await Promise.all([
      logs1.find(query).sort(mongoSort).limit(fetchLimit).project({ x: "$t", y: "$v", n: "$n", id: 1, s: 1, i: 1 }).toArray(),
      logs2.find(query).sort(mongoSort).limit(fetchLimit).project({ x: "$t", y: "$v", n: "$n", id: 1, s: 1, i: 1 }).toArray(),
    ]);

    // Merge the results
    const merged = [...docs1, ...docs2];

    if (merged.length === 0) {
      return res.status(404).json({ error: "No market data found for these parameters." });
    }

    // Re-sort the merged array
    merged.sort((a, b) => {
        let valA, valB;
        if (sortBy === 'value') { valA = a.y; valB = b.y; }
        else if (sortBy === 'amount') { valA = a.n; valB = b.n; }
        else { valA = new Date(a.x).getTime(); valB = new Date(b.x).getTime(); }

        if (valA < valB) return -1 * sortDir;
        if (valA > valB) return 1 * sortDir;
        return 0;
    });

    // Apply exact pagination on the merged/sorted dataset
    const sliced = merged.slice(skipVal, skipVal + limitVal);

    // Format for client
    let data = sliced.map((d) => ({
      timestamp: d.x,
      value: d.y,
      amount: d.n,
      tradeId: d.id,
      isSell: d.s,
      itemId: d.i
    }));

    res.json(data);
  } catch (err) {
    console.error("Error fetching pet market logs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
