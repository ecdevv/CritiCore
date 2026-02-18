import Redis from 'ioredis'

const getRedisURL = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;

  throw new Error('REDIS_URL is not defined');
}

export const redis = new Redis(getRedisURL(), {
  lazyConnect: true,
  retryStrategy: () => null,
  maxRetriesPerRequest: 2000
})

redis.on("error", (err) => {
  console.error("Redis error:", err.message)
})