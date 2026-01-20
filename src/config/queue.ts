import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "./env";

const redisOptions = {
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  maxRetriesPerRequest: null,
};

export const redisConnection = new IORedis(redisOptions);

redisConnection.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

export const codeQueue = new Queue("code-execution", {
  connection: redisConnection as any,
});
