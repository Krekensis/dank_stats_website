export const getScrapedData = (db, redisClient) => async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Missing required query parameter: id (e.g., ?id=items)" });
    }

    const validIds = ["changelogs", "items", "pets", "fish"];
    if (!validIds.includes(id)) {
      return res.status(400).json({ error: `Invalid id parameter. Allowed values: ${validIds.join(", ")}` });
    }

    // Check Redis Cache
    const cacheKey = `scraped:${id}`;
    if (redisClient) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          res.set("X-Cache", "HIT");
          return res.json(JSON.parse(cachedData));
        }
      } catch (err) {
        console.error("Redis get error in scraped:", err);
      }
    }

    const collection = db.collection("scraped");
    const doc = await collection.findOne({ id: id });

    if (!doc) {
      return res.status(404).json({ error: "No data found for this id." });
    }

    // Cache the result (expire in 5 minutes / 300 seconds)
    if (redisClient) {
      try {
        await redisClient.setex(cacheKey, 300, JSON.stringify(doc));
      } catch (err) {
        console.error("Redis set error in scraped:", err);
      }
    }

    res.set("X-Cache", "MISS");
    res.json(doc);
  } catch (error) {
    console.error("Error in getScrapedData:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
