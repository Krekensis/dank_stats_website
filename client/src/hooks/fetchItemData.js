import localItemData from "../assets/parsed_items4.json";

export const fetchItemData = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/items`);
    if (!res.ok) throw new Error("API fetch failed");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback local data due to error:", err);
    return localItemData;
  }
};