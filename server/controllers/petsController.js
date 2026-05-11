export const getPets = (db) => async (req, res) => {
  const petsCollection = db.collection("pets");
  try {
    const pets = await petsCollection.find({}, { projection: { name: 1, id: 1, url: 1, history: 1, stats: 1 } }).toArray();
    res.json(pets);
  } catch (err) {
    console.error("Error fetching pets:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
