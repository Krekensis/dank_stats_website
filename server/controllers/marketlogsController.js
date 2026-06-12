export const getMarketLogs = (db1, db2, pgPool) => async (req, res) => {
  // const logs1 = db1.collection("marketlogs");
  // const logs2 = db2.collection("marketlogs");

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
        if (isNaN(parseInt(item, 10))) return res.status(400).json({ error: "Invalid item format. Expected integer." });
        whereClauses.push(`i = $${paramIndex++}`);
        queryParams.push(parseInt(item, 10));
    }
    if (type === "sell") {
        whereClauses.push(`s = true`);
    } else if (type === "buy") {
        whereClauses.push(`s = false`);
    } else if (type && type !== "sell" && type !== "buy") {
        return res.status(400).json({ error: "Invalid type. Must be 'sell' or 'buy'." });
    }
    
    if (isPrivate === "false") {
        whereClauses.push(`id NOT LIKE 'PV%'`);
    }
    if (excludeOneCoin === "true") {
        whereClauses.push(`v != 1`);
    }
    if (start) {
        if (isNaN(Date.parse(start))) return res.status(400).json({ error: "Invalid start date format." });
        whereClauses.push(`t >= $${paramIndex++}`);
        queryParams.push(new Date(start));
    }
    if (end) {
        if (isNaN(Date.parse(end))) return res.status(400).json({ error: "Invalid end date format." });
        whereClauses.push(`t <= $${paramIndex++}`);
        queryParams.push(new Date(end));
    }

    if (skip !== undefined && isNaN(parseInt(skip))) return res.status(400).json({ error: "Invalid skip format. Expected integer." });
    if (limit !== undefined && isNaN(parseInt(limit))) return res.status(400).json({ error: "Invalid limit format. Expected integer." });

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
      const countRes = await pgPool.query(`SELECT COUNT(*) FROM marketlogs ${whereString}`, queryParams);
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

    let sortCol = 't';
    if (sortBy === 'value') sortCol = 'v';
    else if (sortBy === 'amount') sortCol = 'n';
    else if (sortBy === 'time') sortCol = 't';

    const sortDir = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const sqlQuery = `
        SELECT t as timestamp, v as value, n as amount, id as "tradeId", s as "isSell", i as "itemId" 
        FROM marketlogs 
        ${whereString} 
        ORDER BY ${sortCol} ${sortDir}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    queryParams.push(limitVal, skipVal);

    const result = await pgPool.query(sqlQuery, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No market data found for these parameters." });
    }

    // Return data as sorted by SQL
    let data = result.rows;

    res.json(data);
  } catch (err) {
    console.error("Error fetching market logs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
