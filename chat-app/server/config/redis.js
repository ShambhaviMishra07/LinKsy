

// server/config/redis.js

const Redis = require('ioredis');

let redis;

if (process.env.REDIS_URL) {
  // Production — Upstash connection string
  // Upstash requires TLS so we use rediss:// (with double s)
  redis = new Redis(process.env.REDIS_URL, {
    tls: {
      rejectUnauthorized: false
    },
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    }
  });
} else {
  // Local development — plain connection
  redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: 3
  });
}

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

module.exports = redis;