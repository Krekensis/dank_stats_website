/**
 * PetMarketCache — Client-side segment cache for pet market data.
 *
 * Identical to MarketCache but as a separate instance so pet and item
 * caches don't collide.
 */

class PetMarketCache {
  constructor() {
    this.cache = new Map();
  }

  getMissingSegments(petId, requestedStart, requestedEnd) {
    const key = String(petId);
    const entry = this.cache.get(key);

    if (!entry) {
      return {
        type: 'full',
        segments: [{ start: requestedStart, end: requestedEnd }]
      };
    }

    const cachedStart = entry.rangeStart;
    const cachedEnd = entry.rangeEnd;

    if (requestedStart >= cachedStart && requestedEnd <= cachedEnd) {
      return { type: 'none', segments: [] };
    }

    const segments = [];

    if (requestedStart < cachedStart) {
      segments.push({ start: requestedStart, end: new Date(cachedStart.getTime() - 1) });
    }

    if (requestedEnd > cachedEnd) {
      segments.push({ start: new Date(cachedEnd.getTime() + 1), end: requestedEnd });
    }

    let type = 'both';
    if (segments.length === 1) {
      type = requestedStart < cachedStart ? 'before' : 'after';
    }

    return { type, segments };
  }

  getData(petId, start, end) {
    const key = String(petId);
    const entry = this.cache.get(key);
    if (!entry) return [];

    return entry.data.filter(point => {
      const pointDate = new Date(point.timestamp);
      return pointDate >= start && pointDate <= end;
    });
  }

  mergeData(petId, newData, fetchedStart, fetchedEnd) {
    const key = String(petId);
    const entry = this.cache.get(key);

    if (!entry) {
      this.cache.set(key, {
        data: [...newData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
        rangeStart: fetchedStart,
        rangeEnd: fetchedEnd
      });
      return;
    }

    const existing = new Map();
    for (const point of entry.data) {
      const k = `${point.timestamp}_${point.value}_${point.tradeId || ''}`;
      existing.set(k, point);
    }
    for (const point of newData) {
      const k = `${point.timestamp}_${point.value}_${point.tradeId || ''}`;
      existing.set(k, point);
    }

    const merged = Array.from(existing.values()).sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    entry.data = merged;
    entry.rangeStart = new Date(Math.min(entry.rangeStart, fetchedStart));
    entry.rangeEnd = new Date(Math.max(entry.rangeEnd, fetchedEnd));
  }

  clear(petId) {
    if (petId) {
      this.cache.delete(String(petId));
    } else {
      this.cache.clear();
    }
  }

  getStats() {
    const stats = {};
    for (const [key, entry] of this.cache) {
      stats[key] = {
        points: entry.data.length,
        rangeStart: entry.rangeStart?.toISOString(),
        rangeEnd: entry.rangeEnd?.toISOString()
      };
    }
    return stats;
  }
}

const petMarketCache = new PetMarketCache();
export default petMarketCache;
