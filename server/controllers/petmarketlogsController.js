export const getPetMarketLogs = (db1, db2, pgPool) => async (req, res) => {
  // const logs1 = db1.collection("petmarketlogs");
  // const logs2 = db2.collection("petmarketlogs");

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
    } = req.query;

    /*
    const query = {};
    if (item) query.i = parseInt(item, 10);
    if (type === "sell") query.s = true;
    else if (type === "buy") query.s = false;
    if (isPrivate === "false") query.id = { $not: { $regex: /^PV/ } };
    // Server-side exclude 1 DMC trades via DB query for efficiency
    if (excludeOneCoin === "true") query.v = { $ne: 1 };

    if (start || end) {
      query.t = {};
      if (start) query.t.$gte = new Date(start);
      if (end) query.t.$lte = new Date(end);
    }
    */

    let whereClauses = [];
    let queryParams = [];
    let paramIndex = 1;

    if (item) {
        whereClauses.push(`i = $${paramIndex++}`);
        queryParams.push(parseInt(item, 10));
    }
    if (type === "sell") {
        whereClauses.push(`s = true`);
    } else if (type === "buy") {
        whereClauses.push(`s = false`);
    }
    if (isPrivate === "false") {
        whereClauses.push(`id NOT LIKE 'PV%'`);
    }
    if (excludeOneCoin === "true") {
        whereClauses.push(`v != 1`);
    }
    if (start) {
        whereClauses.push(`t >= $${paramIndex++}`);
        queryParams.push(new Date(start));
    }
    if (end) {
        whereClauses.push(`t <= $${paramIndex++}`);
        queryParams.push(new Date(end));
    }

    const whereString = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    // Count mode
    if (countOnly === "true") {
      /*
      const [count1, count2] = await Promise.all([
        logs1.countDocuments(query),
        logs2.countDocuments(query),
      ]);
      return res.json({ count: count1 + count2 });
      */
      const countRes = await pgPool.query(`SELECT COUNT(*) FROM petmarketlogs ${whereString}`, queryParams);
      return res.json({ count: parseInt(countRes.rows[0].count, 10) });
    }

    /*
    // Fetch data from both
    const [docs1, docs2] = await Promise.all([
      logs1.find(query).project({ x: "$t", y: "$v", n: "$n", id: 1, s: 1, i: 1 }).toArray(),
      logs2.find(query).project({ x: "$t", y: "$v", n: "$n", id: 1, s: 1, i: 1 }).toArray(),
    ]);

    // Merge + sort descending (latest first) then slice for "latest N" semantics
    const merged = [...docs1, ...docs2].sort((a, b) => b.x - a.x);
    const sliced = merged.slice(
      parseInt(skip),
      parseInt(skip) + Math.min(parseInt(limit), 10000)
    );

    // Return in chronological order
    sliced.sort((a, b) => a.x - b.x);

    res.json(sliced);
    */

    const limitVal = Math.min(parseInt(limit), 10000);
    const skipVal = parseInt(skip);

    const sqlQuery = `
        SELECT t as x, v as y, n, id, s, i 
        FROM petmarketlogs 
        ${whereString} 
        ORDER BY t DESC 
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    queryParams.push(limitVal, skipVal);

    const result = await pgPool.query(sqlQuery, queryParams);
    
    // Return in chronological order
    const data = result.rows.sort((a, b) => new Date(a.x) - new Date(b.x));

    res.json(data);
  } catch (err) {
    console.error("Error fetching pet market logs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
