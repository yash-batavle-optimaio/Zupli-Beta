// app/utils/redis.server.js
import { createClient } from "redis";

export const redis = createClient({
  username: "default",
  password: "TAqxfnXDpLQv9QG64FZNRsdk6Daq0xrL",
  socket: {
    host: "redis-16663.crce179.ap-south-1-1.ec2.cloud.redislabs.com",
    port: 16663,
  },
});

redis.on("error", (err) => {
  console.error("❌ Redis Client Error", err);
});

if (!redis.isOpen) {
  await redis.connect();
}
