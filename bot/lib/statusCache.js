const fs = require('fs');
const path = require('path');

const CACHE_FILE = '/tmp/botstatus.json';
const CACHE_TTL = 30000; // 30 seconds - consider it "recently updated"

/**
 * Read the status cache from temp file
 */
function readCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = fs.readFileSync(CACHE_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        // If cache is corrupted, ignore and return empty
    }
    return {};
}

/**
 * Write the status cache to temp file
 */
function writeCache(cache) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (e) {
        console.error('Error writing status cache:', e.message);
    }
}

/**
 * Check if bot status was recently updated in cache
 * Returns true if bot was updated within TTL window
 */
function isCached(botId) {
    const cache = readCache();
    const entry = cache[botId];
    
    if (!entry) return false;
    
    const now = Date.now();
    const timeSinceUpdate = now - entry.timestamp;
    
    // If update is recent enough, return true (skip DB update)
    return timeSinceUpdate < CACHE_TTL;
}

/**
 * Update cache with bot status and timestamp
 */
function updateCache(botId, status) {
    const cache = readCache();
    cache[botId] = {
        status: status,
        timestamp: Date.now()
    };
    writeCache(cache);
}

/**
 * Check if we should update DB
 * Returns true only if cache is missing or stale
 */
function shouldUpdateDB(botId) {
    return !isCached(botId);
}

/**
 * Mark bot status in cache (don't update DB yet)
 */
function markBotStatus(botId, status) {
    updateCache(botId, status);
}

/**
 * Get all cached statuses
 */
function getAllCached() {
    return readCache();
}

/**
 * Clear cache for a specific bot
 */
function clearBotCache(botId) {
    const cache = readCache();
    delete cache[botId];
    writeCache(cache);
}

/**
 * Clear entire cache
 */
function clearAllCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            fs.unlinkSync(CACHE_FILE);
        }
    } catch (e) {
        console.error('Error clearing status cache:', e.message);
    }
}

module.exports = {
    isCached,
    updateCache,
    shouldUpdateDB,
    markBotStatus,
    getAllCached,
    clearBotCache,
    clearAllCache,
    CACHE_TTL
};
