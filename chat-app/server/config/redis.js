// server/config/redis.js — add error handling that doesn't crash the app

// const Redis = require('ioredis');


// const redis = process.env.REDIS_URL
//   ? new Redis(process.env.REDIS_URL, {
//       tls: { rejectUnauthorized: false },
//       maxRetriesPerRequest: 3,
//       retryStrategy(times) {
//         if (times > 5) return null; // stop retrying after 5 attempts
//         return Math.min(times * 200, 2000);
//       }
//     })
//   : new Redis({
//       host: process.env.REDIS_HOST || '127.0.0.1',
//       port: process.env.REDIS_PORT || 6379,
//     });

// redis.on('connect', () => console.log('✅ Redis connected'));
// redis.on('error', (err) => console.error('❌ Redis error:', err.message));

// module.exports = redis;



//for using it in local host i am using redis locally

// // server/config/redis.js

// const Redis = require('ioredis');

// const redis = process.env.REDIS_URL
//   ? new Redis(process.env.REDIS_URL, { tls: { rejectUnauthorized: false } })
//   : new Redis({
//       host: process.env.REDIS_HOST || '127.0.0.1',
//       port: process.env.REDIS_PORT || 6379,
//     });

// redis.on('connect', () => console.log('✅ Redis connected'));
// redis.on('error', (err) => console.error('❌ Redis error:', err.message));

// module.exports = redis;


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