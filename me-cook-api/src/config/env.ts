import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  APP_BASE_URL: z.string().default("https://mecook.app"),
  MEDIA_UPLOAD_DIR: z.string().default("./uploads"),
  CORS_ORIGINS: z.string().optional(),
  TRUST_PROXY: z.coerce.boolean().default(true),
  PUSH_ENABLED: z.coerce.boolean().default(true),
  PUSH_BATCH_SIZE: z.coerce.number().int().positive().max(100).default(100),
  PUSH_BATCH_DELAY_MS: z.coerce.number().int().nonnegative().default(100),
});

export const env = envSchema.parse(process.env);
