const mcache = require('memory-cache');
const { redisClient } = require('../config/cache');

// Memory cache instance
const cache = new mcache.Cache();

// Cache duration in seconds
const DEFAULT_DURATION = 60; // 1 minute
const PRODUCT_CACHE_DURATION = 300; // 5 minutes
const STATS_CACHE_DURATION = 1800; // 30 minutes

// Memory cache middleware
const memoryCache = (duration = DEFAULT_DURATION) => {
  return (req, res, next) => {
    const key = '__express__' + req.originalUrl || req.url;
    const cachedBody = cache.get(key);

    if (cachedBody) {
      return res.json(JSON.parse(cachedBody));
    }

    res.sendResponse = res.json;
    res.json = (body) => {
      cache.put(key, JSON.stringify(body), duration * 1000);
      res.sendResponse(body);
    };

    next();
  };
};

// Redis cache middleware (if Redis is available)
const redisCache = (duration = DEFAULT_DURATION) => {
  return async (req, res, next) => {
    if (!redisClient || !redisClient.isReady) {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      res.sendResponse = res.json;
      res.json = (body) => {
        redisClient.setEx(key, duration, JSON.stringify(body));
        res.sendResponse(body);
      };

      next();
    } catch (error) {
      console.error('Redis cache error:', error);
      next();
    }
  };
};

// Clear cache for specific patterns
const clearCache = (pattern) => {
  return async (req, res, next) => {
    // Clear memory cache
    const keys = cache.keys();
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.del(key);
      }
    });

    // Clear Redis cache
    if (redisClient && redisClient.isReady) {
      try {
        const redisKeys = await redisClient.keys(`cache:*${pattern}*`);
        if (redisKeys.length > 0) {
          await redisClient.del(redisKeys);
        }
      } catch (error) {
        console.error('Redis clear cache error:', error);
      }
    }

    next();
  };
};

// Cache by user ID
const userCache = (duration = DEFAULT_DURATION) => {
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const key = `__user__${req.user._id}__${req.originalUrl}`;
    const cachedBody = cache.get(key);

    if (cachedBody) {
      return res.json(JSON.parse(cachedBody));
    }

    res.sendResponse = res.json;
    res.json = (body) => {
      cache.put(key, JSON.stringify(body), duration * 1000);
      res.sendResponse(body);
    };

    next();
  };
};

// No cache middleware
const noCache = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
};

module.exports = {
  memoryCache,
  redisCache,
  clearCache,
  userCache,
  noCache,
  // Cache durations
  DEFAULT_DURATION,
  PRODUCT_CACHE_DURATION,
  STATS_CACHE_DURATION
};