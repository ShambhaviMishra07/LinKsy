// test-redis.js — temporary file just for testing

const Redis = require('ioredis');

const redis = new Redis('rediss://default:********@evolving-pheasant-122583.upstash.io:6379', {
  tls: { rejectUnauthorized: false }
});

redis.on('connect', () => {
  console.log('✅ WORKS');
  process.exit(0);
});

redis.on('error', (e) => {
  console.log('❌ FAILED:', e.message);
  process.exit(1);
});