// app/utils/redis.server.js
import { createClient } from "redis";

let redis;

/**
 * Returns singleton Redis client
 */
export function getRedis() {
  if (!redis) {
    redis = createClient({
      username: "default",
      password: process.env.REDIS_PASSWORD, // 🔐 move secrets to env
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    });

    redis.on("error", (err) => {
      console.error("❌ Redis Client Error", err);
    });
  }

  return redis;
}

/**
 * Ensures Redis is connected before use
 */
export async function ensureRedisConnected() {
  const client = getRedis();

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}
