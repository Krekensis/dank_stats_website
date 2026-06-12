/**
 * MarketCache — Client-side segment cache for market data.
 *
 * Stores raw API responses keyed by itemId. Tracks the date range
 * already fetched per item. On subsequent requests, determines which
 * date segments are missing and only fetches those, then merges with
 * the existing cache.
 *
 * Cache is in-memory (Map) and lives for the browser tab session.
 */

class MarketCache {
  constructor() {
    // Map<itemId, { data: Array, rangeStart: Date, rangeEnd: Date }>
    this.cache = new Map();
  }

  /**
   * Check if we have cached data for an item covering the requested range.
   * Returns an object describing what needs to be fetched.
   *
   * @param {number|string} itemId
   * @param {Date} requestedStart
   * @param {Date} requestedEnd
   * @returns {{ type: 'full'|'none'|'before'|'after'|'both', segments: Array<{start: Date, end: Date}> }}
   */
  getMissingSegments(itemId, requestedStart, requestedEnd) {
    const key = String(itemId);
    const entry = this.cache.get(key);

    if (!entry) {
      return {
        type: 'full',
        segments: [{ start: requestedStart, end: requestedEnd }]
      };
    }

    const cachedStart = entry.rangeStart;
    const cachedEnd = entry.rangeEnd;

    // Fully covered
    if (requestedStart >= cachedStart && requestedEnd <= cachedEnd) {
      return { type: 'none', segments: [] };
    }

    const segments = [];

    // Need data before what we have
    if (requestedStart < cachedStart) {
      segments.push({ start: requestedStart, end: new Date(cachedStart.getTime() - 1) });
    }

    // Need data after what we have
    if (requestedEnd > cachedEnd) {
      segments.push({ start: new Date(cachedEnd.getTime() + 1), end: requestedEnd });
    }

    let type = 'both';
    if (segments.length === 1) {
      type = requestedStart < cachedStart ? 'before' : 'after';
    }

    return { type, segments };
  }

  /**
   * Get cached data for an item within a date range.
   * Returns empty array if nothing is cached.
   *
   * @param {number|string} itemId
   * @param {Date} start
   * @param {Date} end
   * @returns {Array}
   */
  getData(itemId, start, end) {
    const key = String(itemId);
    const entry = this.cache.get(key);
    if (!entry) return [];

    return entry.data.filter(point => {
      const pointDate = new Date(point.timestamp);
      return pointDate >= start && pointDate <= end;
    });
  }

  /**
   * Merge new data into the cache for an item. Automatically
   * extends the tracked date range.
   *
   * @param {number|string} itemId
   * @param {Array} newData - Raw API response data points
   * @param {Date} fetchedStart - Start of the fetched range
   * @param {Date} fetchedEnd - End of the fetched range
   */
  mergeData(itemId, newData, fetchedStart, fetchedEnd) {
    const key = String(itemId);
    const entry = this.cache.get(key);

    if (!entry) {
      this.cache.set(key, {
        data: [...newData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
        rangeStart: fetchedStart,
        rangeEnd: fetchedEnd
      });
      return;
    }

    // Merge and deduplicate by creating a Map keyed by stringified (x, y, id)
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

  /**
   * Clear cache for a specific item, or all items if no id given.
   */
  clear(itemId) {
    if (itemId) {
      this.cache.delete(String(itemId));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache stats for debugging.
   */
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

// Singleton instance shared across the app
const marketCache = new MarketCache();
export default marketCache;
