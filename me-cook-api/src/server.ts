import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { creatorsRouter } from "./routes/creators.js";
import { healthRouter } from "./routes/health.js";
import { mediaRouter } from "./routes/media.js";
import { notificationsRouter } from "./routes/notifications.js";
import { recipesRouter } from "./routes/recipes.js";
import { socialRouter } from "./routes/social.js";
import { usersRouter } from "./routes/users.js";

const app = express();
if (env.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

const allowedOrigins = env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(
  rateLimit({
    windowMs: 60_000,
    max: 250,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
  }),
);
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan("combined"));

app.use("/uploads", express.static(path.resolve(env.MEDIA_UPLOAD_DIR)));
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/creators", creatorsRouter);
app.use("/api/recipes", recipesRouter);
app.use("/api/media", mediaRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/social", socialRouter);
app.use("/api/users", usersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`MeCook API running on port ${env.PORT}`);
});
