export const getPets = (db) => async (req, res) => {
  try {
    const { id, excludeHistory, sortBy, order } = req.query;

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
    
    const collection = db.collection("pets");
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
      return res.status(404).json({ error: "Pet ID not found." });
    }

    const pets = result.map(row => {
      if (excludeHistory !== 'true') {
        row.history = row.history?.map(h => ({ timestamp: h.t, value: h.v })) || [];
      }
      return row;
    });
    res.json(pets);
  } catch (err) {
    console.error("Error fetching pets:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
