import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application } from "express";
import { loadEnv } from "../env.js";
import { createAuthRouter } from "./auth/auth.route.js";
import { createProjectRouter } from "./projects/project.route.js";
import { errorHandler, notFoundHandler } from "./shared/error-handler.js";
import { createTaskRouter } from "./tasks/task.route.js";

export const API_PREFIX = "/api/v1";

export function createServerApplication(): Application {
  const env = loadEnv();
  const app = express();

  // Needed for correct req.ip behind a platform proxy (Render, Railway, Fly).
  app.set("trust proxy", 1);

  app.use(cookieParser());
  app.use(
    cors({
      origin: env.WEB_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ data: { status: "ok" } });
  });

  app.use(API_PREFIX, createAuthRouter());
  app.use(API_PREFIX, createProjectRouter());
  app.use(API_PREFIX, createTaskRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
