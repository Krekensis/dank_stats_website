export const getItems = (db, pgPool, redisClient) => async (req, res) => {
  try {
    const { id, excludeHistory, sortBy, order } = req.query;
    
    // Check Redis Cache
    const cacheKey = `items:${id || 'all'}:${excludeHistory || 'false'}:${sortBy || 'none'}:${order || 'none'}`;
    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            res.set("X-Cache", "HIT");
            return res.json(JSON.parse(cachedData));
        }
    } catch (err) {
        console.error("Redis get error in items:", err);
    }

    if (excludeHistory && excludeHistory !== 'true' && excludeHistory !== 'false') {
      return res.status(400).json({ error: "Wrong parameter value given. Use from true / false for excludeHistory" });
    }

    if (sortBy) {
      const validSortCols = ['volume', 'trades', 'id', 'name'];
      if (!validSortCols.includes(sortBy)) {
        return res.status(400).json({ error: "Wrong parameter value given. Use from volume / trades / id / name for sortBy" });
      }
    }

    if (order && order.toLowerCase() !== 'asc' && order.toLowerCase() !== 'desc') {
      return res.status(400).json({ error: "Wrong parameter value given. Use from desc / asc for order" });
    }

    let selectFields = excludeHistory === 'true' 
        ? 'name, id, url, stats' 
        : 'name, id, url, history, stats';

    let sqlQuery = `SELECT ${selectFields} FROM items`;
    let queryParams = [];

    if (id) {
      if (isNaN(parseInt(id, 10))) {
        return res.status(400).json({ error: "Invalid id format. Expected integer." });
      }
      sqlQuery += ' WHERE id = $1';
      queryParams.push(parseInt(id, 10));
    } else if (sortBy) {
        let sortCol = 'id';
        if (sortBy === 'volume') sortCol = "CAST(stats->'total'->>'vol' AS FLOAT)";
        else if (sortBy === 'trades') sortCol = "CAST(stats->'total'->>'trades' AS FLOAT)";
        else if (sortBy === 'id') sortCol = "id";
        else if (sortBy === 'name') sortCol = "name";

        const sortDir = order && order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
        sqlQuery += ` ORDER BY ${sortCol} ${sortDir}`;
    }

    const result = await pgPool.query(sqlQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item ID not found." });
    }

    const items = result.rows.map(row => {
      if (excludeHistory !== 'true') {
        row.history = row.history?.map(h => ({ timestamp: h.t, value: h.v })) || [];
      }
      return row;
    });

    try {
        await redisClient.setex(cacheKey, 3600, JSON.stringify(items));
    } catch (err) {
        console.error("Redis setex error in items:", err);
    }
    
    res.set("X-Cache", "MISS");
    res.json(items);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
