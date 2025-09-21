import express from "express";

export default function createItemsRouter(db) {
  const itemsCollection = db.collection("items");
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const items = await itemsCollection.find({}, { projection: { name: 1, id: 1, url: 1, history: 1 } }).toArray();
      res.json(items);
    } catch (err) {
      console.error("Error fetching items:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}