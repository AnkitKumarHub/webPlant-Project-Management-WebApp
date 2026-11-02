import { z } from "zod";
import { TASK_STATUSES } from "../../db/models/task.model.js";

const statusSchema = z.enum(TASK_STATUSES);

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required.")
  .max(200, "Title must be at most 200 characters.");

const descriptionSchema = z
  .string()
  .trim()
  .max(5000, "Description must be at most 5000 characters.");

const dueDateSchema = z.union([z.string(), z.null()]).transform((value, ctx) => {
  if (value === null || value.trim() === "") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    ctx.addIssue({ code: "custom", message: "Enter a valid due date." });
    return z.NEVER;
  }
  return parsed;
});

export const createTaskSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.default(""),
  status: statusSchema.default("todo"),
  dueDate: dueDateSchema.default(null),
});

/**
 * Built from the bare field schemas rather than `createTaskSchema.partial()`,
 * because `.partial()` keeps the defaults: an omitted description would parse
 * as `""` and an omitted status as `"todo"`, so a `PATCH {"title": "x"}` would
 * quietly reset the other fields.
 */
export const updateTaskSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    status: statusSchema,
    dueDate: dueDateSchema,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

/** `?status=todo&status=done` and `?status=todo,done` both mean the same thing. */
const statusFilterSchema = z
  .preprocess((value) => {
    if (value === undefined) return undefined;
    const raw = Array.isArray(value) ? value : [value];
    return raw
      .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }, z.array(statusSchema).nonempty())
  .optional();

export const DUE_FILTERS = ["overdue", "today", "week", "undated"] as const;
export type DueFilter = (typeof DUE_FILTERS)[number];

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date.")
  .optional();

export const taskQuerySchema = z
  .object({
    status: statusFilterSchema,
    due: z.enum(DUE_FILTERS).optional(),
    dueFrom: dateOnlySchema,
    dueTo: dateOnlySchema,
    /**
     * The caller's own calendar date, used as the anchor for `due`. Without it
     * the server would answer "today" from its own clock, which is a day out
     * for anyone whose local date differs from UTC.
     */
    today: dateOnlySchema,
    sort: z.enum(["dueDate", "createdAt", "updatedAt", "title", "status"]).default("createdAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
  })
  // Both at once would be ambiguous, so say so rather than silently picking one.
  .refine((value) => !(value.due && (value.dueFrom ?? value.dueTo)), {
    message: "Use either `due` or `dueFrom`/`dueTo`, not both.",
  })
  .refine(
    (value) => !(value.dueFrom && value.dueTo) || value.dueFrom <= value.dueTo,
    { message: "`dueFrom` must not be after `dueTo`." },
  );

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
