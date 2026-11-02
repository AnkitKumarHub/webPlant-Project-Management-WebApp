import "dotenv/config";
import http from "node:http";
import { connectDatabase, disconnectDatabase } from "./db/index.js";
import { loadEnv } from "./env.js";
import { createServerApplication } from "./app/index.js";

async function main() {
  const env = loadEnv();
  await connectDatabase();

  const server = http.createServer(createServerApplication());

  server.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down.`);
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  console.error("Failed to start the API:", error);
  process.exit(1);
});
