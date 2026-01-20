import dotenv from "dotenv";

dotenv.config();

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: numberFromEnv(process.env.PORT, 3000),
  redis: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: numberFromEnv(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD,
  },
};
