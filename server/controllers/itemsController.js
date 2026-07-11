export const getItems = (db, redisClient) => async (req, res) => {
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

    let query = {};
    if (id) {
      if (isNaN(parseInt(id, 10))) {
        return res.status(400).json({ error: "Invalid id format. Expected integer." });
      }
      query.id = parseInt(id, 10);
    }
    
    const collection = db.collection("items");
    const cursor = collection.find(query);

    if (sortBy) {
        let sortCol = 'id';
        if (sortBy === 'volume') sortCol = 'stats.total.vol';
        else if (sortBy === 'trades') sortCol = 'stats.total.trades';
        else if (sortBy === 'id') sortCol = 'id';
        else if (sortBy === 'name') sortCol = 'name';

        const sortDir = order && order.toLowerCase() === 'desc' ? -1 : 1;
        cursor.sort({ [sortCol]: sortDir });
    }

    let projection = { name: 1, id: 1, url: 1, stats: 1, _id: 0 };
    if (excludeHistory !== 'true') {
        projection.history = 1;
    }
    cursor.project(projection);

    const result = await cursor.toArray();

    if (result.length === 0) {
      return res.status(404).json({ error: "Item ID not found." });
    }

    const items = result.map(row => {
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
