const API_BASE = "https://api.jikan.moe/v4";
const CACHE_PREFIX = "anime-hub:v1:";
const DEFAULT_TTL = 30 * 60 * 1000;
const memoryCache = new Map();

function readCache(key) {
  const memory = memoryCache.get(key);
  if (memory && Date.now() - memory.time < memory.ttl) return memory.value;

  try {
    const saved = localStorage.getItem(CACHE_PREFIX + key);
    if (!saved) return null;
    const entry = JSON.parse(saved);
    if (Date.now() - entry.time >= entry.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    memoryCache.set(key, entry);
    return entry.value;
  } catch {
    return null;
  }
}

function writeCache(key, value, ttl) {
  const entry = { time: Date.now(), ttl, value };
  memoryCache.set(key, entry);

  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage can be unavailable or full; in-memory caching still works.
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function requestJson(path, { signal, ttl = DEFAULT_TTL } = {}) {
  const key = path;
  const cached = readCache(key);
  if (cached) return cached;

  let lastError;

  // Retry transient rate limits and server errors with a short backoff.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        signal,
        headers: { Accept: "application/json" }
      });

      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get("Retry-After")) || (1 + attempt);
        await sleep(Math.min(retryAfter * 1000, 5000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      writeCache(key, data, ttl);
      return data;
    } catch (error) {
      if (error.name === "AbortError") throw error;
      lastError = error;
      if (attempt < 2) await sleep(500 * (attempt + 1));
    }
  }

  throw lastError || new Error("Anime API is temporarily unavailable.");
}

export const AnimeAPI = {
  async top(page = 1, signal) {
    return requestJson(`/top/anime?page=${page}&limit=24&sfw=true`, { signal });
  },

  async search(query, page = 1, signal) {
    const q = encodeURIComponent(query);
    return requestJson(`/anime?q=${q}&page=${page}&limit=24&sfw=true`, { signal });
  },

  async episodes(id, page = 1, signal) {
    return requestJson(`/anime/${encodeURIComponent(id)}/episodes?page=${page}`, {
      signal,
      ttl: 60 * 60 * 1000
    });
  }
};
