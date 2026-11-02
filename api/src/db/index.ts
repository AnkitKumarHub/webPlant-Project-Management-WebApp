import mongoose from "mongoose";
import { loadEnv } from "../env.js";

mongoose.set("strictQuery", true);

export async function connectDatabase(): Promise<typeof mongoose> {
  const { MONGODB_URI } = loadEnv();
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");
  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
