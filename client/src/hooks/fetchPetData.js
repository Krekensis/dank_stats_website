import localPetData from "../assets/complete-pet-data.json";

let memoryCache = null;
let fetchPromise = null;
const CACHE_KEY = "dank_stats_pets_cache_v2";
const CACHE_EXPIRY_KEY = "dank_stats_pets_cache_expiry_v2";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export const getCachedPetData = () => {
  if (memoryCache) return memoryCache;
  try {
    const cachedString = sessionStorage.getItem(CACHE_KEY);
    const cachedExpiry = sessionStorage.getItem(CACHE_EXPIRY_KEY);
    if (cachedString && cachedExpiry && Date.now() < parseInt(cachedExpiry, 10)) {
      memoryCache = JSON.parse(cachedString);
      return memoryCache;
    }
  } catch (e) {
    console.warn("Failed to read pet data from sessionStorage:", e);
  }
  return null;
};

export const fetchPetData = async () => {
  const cached = getCachedPetData();
  if (cached) return cached;
  
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/pets`);
      if (!res.ok) throw new Error("API fetch failed");
      const data = await res.json();
      
      memoryCache = data;
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        sessionStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
      } catch (e) {
        console.warn("Failed to write pet data to sessionStorage:", e);
      }
      
      return data;
    } catch (err) {
      console.warn("Using fallback local pet data due to error:", err);
      // Map local pet data to match API format (imageURL -> url)
      memoryCache = localPetData.map(pet => ({
        ...pet,
        url: pet.imageURL || pet.url,
      }));
      return memoryCache;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
};
