// server/config/redis.js

const Redis = require('ioredis');

// In production, Redis URL is a single connection string
// In development, we use host/port separately
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      tls: { rejectUnauthorized: false } // required for Upstash TLS connection
    })
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
    });

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

module.exports = redis;