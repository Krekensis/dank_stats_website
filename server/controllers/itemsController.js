export const getItems = (db, pgPool) => async (req, res) => {
  // const itemsCollection = db.collection("items");
  try {
    // const items = await itemsCollection.find({}, { projection: { name: 1, id: 1, url: 1, history: 1, stats: 1 } }).toArray();
    const result = await pgPool.query('SELECT name, id, url, history, stats FROM items');
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
