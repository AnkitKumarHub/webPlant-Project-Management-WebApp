import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { BCRYPT_ROUNDS } from "../app/auth/auth.constants.js";
import { connectDatabase, disconnectDatabase } from "./index.js";
import { ProjectModel } from "./models/project.model.js";
import { TaskModel } from "./models/task.model.js";
import { UserModel } from "./models/user.model.js";

const seedEnv = z.object({
  SEED_USER_EMAIL: z.string().trim().toLowerCase().email(),
  SEED_USER_PASSWORD: z.string().min(8),
});

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  const parsed = seedEnv.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      "Seeding needs SEED_USER_EMAIL and SEED_USER_PASSWORD (min 8 characters) in api/.env",
    );
  }
  const { SEED_USER_EMAIL, SEED_USER_PASSWORD } = parsed.data;

  await connectDatabase();

  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, BCRYPT_ROUNDS);
  const user = await UserModel.findOneAndUpdate(
    { email: SEED_USER_EMAIL },
    { $set: { passwordHash } },
    { new: true, upsert: true },
  );

  // Re-seeding should be idempotent, so the demo user starts from a clean slate.
  await TaskModel.deleteMany({ owner: user._id });
  await ProjectModel.deleteMany({ owner: user._id });

  const [website, mobile] = await ProjectModel.create([
    {
      title: "Website redesign",
      description: "Refresh the marketing site ahead of the spring launch.",
      owner: user._id,
    },
    {
      title: "Mobile app v2",
      description: "Offline support and a rewritten onboarding flow.",
      owner: user._id,
    },
  ]);

  if (!website || !mobile) {
    throw new Error("Seeding failed to create the demo projects.");
  }

  await TaskModel.create([
    {
      title: "Audit current pages",
      description: "List every page and note what stays, moves, or goes.",
      status: "done",
      dueDate: daysFromNow(-6),
      position: 1,
      project: website._id,
      owner: user._id,
    },
    {
      title: "Draft new homepage copy",
      description: "Two variants for the hero section.",
      status: "in-progress",
      dueDate: daysFromNow(2),
      position: 1,
      project: website._id,
      owner: user._id,
    },
    {
      title: "Pick a type scale",
      description: "",
      status: "todo",
      dueDate: null,
      position: 1,
      project: website._id,
      owner: user._id,
    },
    {
      title: "Spec the offline cache",
      description: "Decide what is cached and for how long.",
      status: "todo",
      dueDate: daysFromNow(9),
      position: 1,
      project: mobile._id,
      owner: user._id,
    },
    {
      title: "Rewrite onboarding screens",
      description: "Three screens, down from seven.",
      status: "in-progress",
      dueDate: daysFromNow(4),
      position: 1,
      project: mobile._id,
      owner: user._id,
    },
  ]);

  console.log(`Seeded ${SEED_USER_EMAIL} with 2 projects and 5 tasks.`);
  await disconnectDatabase();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
