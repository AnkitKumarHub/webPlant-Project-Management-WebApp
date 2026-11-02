import type { Types } from "mongoose";
import { TaskModel, type TaskDocument, type TaskStatus } from "../../db/models/task.model.js";
import { AppError } from "../shared/errors.js";
import { toObjectId } from "../shared/object-id.js";
import { requireOwnedProject } from "../projects/project.service.js";
import type { CreateTaskInput, TaskQuery, UpdateTaskInput } from "./task.schema.js";

export type TaskView = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
};

type TaskRow = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: Date | null;
  project: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

function rowToView(row: TaskRow): TaskView {
  return {
    id: row._id.toString(),
    title: row.title,
    description: row.description,
    status: row.status,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    projectId: row.project.toString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function docToView(task: TaskDocument): TaskView {
  return rowToView({
    _id: task._id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate ?? null,
    project: task.project,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  });
}

/**
 * Due dates are calendar dates, not instants: they are stored as UTC midnight,
 * so every boundary here is computed in UTC too. A server in a different
 * timezone would otherwise shift "today" by a day.
 */
function utcDayStart(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

const DAY_MS = 86_400_000;

function utcDayEnd(date: Date): Date {
  return new Date(utcDayStart(date).getTime() + DAY_MS - 1);
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function applyDueFilter(match: Record<string, unknown>, query: TaskQuery): void {
  // Prefer the caller's calendar date; fall back to the server's for API
  // clients that do not send one.
  const today = query.today ? parseDateOnly(query.today) : utcDayStart();

  switch (query.due) {
    case "undated":
      match["dueDate"] = null;
      return;
    case "overdue":
      match["dueDate"] = { $ne: null, $lt: today };
      // "Overdue" means still outstanding. A finished task is not late, which
      // is the same rule the UI uses when it decides to colour a date red.
      // An explicit status filter is narrowed rather than overwritten, so
      // `status=done&due=overdue` correctly returns nothing.
      match["status"] = query.status
        ? { $in: query.status.filter((status) => status !== "done") }
        : { $ne: "done" };
      return;
    case "today":
      match["dueDate"] = { $gte: today, $lte: utcDayEnd(today) };
      return;
    case "week":
      match["dueDate"] = {
        $gte: today,
        $lte: utcDayEnd(new Date(today.getTime() + 7 * DAY_MS)),
      };
      return;
    default:
      break;
  }

  if (query.dueFrom ?? query.dueTo) {
    const range: Record<string, Date> = {};
    if (query.dueFrom) range["$gte"] = parseDateOnly(query.dueFrom);
    if (query.dueTo) range["$lte"] = utcDayEnd(parseDateOnly(query.dueTo));
    // A range never matches an undated task, which is what you want: it has no
    // date to fall inside the window.
    match["dueDate"] = range;
  }
}

export async function listTasks(
  ownerId: string,
  query: TaskQuery,
  projectId?: string,
): Promise<TaskView[]> {
  const match: Record<string, unknown> = { owner: toObjectId(ownerId) };

  if (projectId !== undefined) {
    // Resolving through the project also proves the caller owns it, so an
    // unknown project reads as 404 rather than an empty list.
    const project = await requireOwnedProject(ownerId, projectId);
    match["project"] = project._id;
  }
  if (query.status) {
    match["status"] = { $in: query.status };
  }
  applyDueFilter(match, query);

  const direction = query.order === "asc" ? 1 : -1;
  const sort: Record<string, 1 | -1> =
    query.sort === "dueDate"
      ? // Undated tasks sort last whichever direction is asked for; they are
        // not "due first", they are simply not scheduled.
        { undated: 1, dueDate: direction, _id: direction }
      : { [query.sort]: direction, _id: direction };

  const rows = await TaskModel.aggregate<TaskRow>([
    { $match: match },
    { $addFields: { undated: { $cond: [{ $eq: ["$dueDate", null] }, 1, 0] } } },
    { $sort: sort },
    { $unset: "undated" },
  ]);

  return rows.map(rowToView);
}

export async function createTask(
  ownerId: string,
  projectId: string,
  input: CreateTaskInput,
): Promise<TaskView> {
  const project = await requireOwnedProject(ownerId, projectId);
  const task = await TaskModel.create({
    title: input.title,
    description: input.description,
    status: input.status,
    dueDate: input.dueDate,
    project: project._id,
    owner: project.owner,
  });
  return docToView(task);
}

async function requireOwnedTask(ownerId: string, taskId: string): Promise<TaskDocument> {
  const task = await TaskModel.findOne({
    _id: toObjectId(taskId, "Task"),
    owner: toObjectId(ownerId),
  });
  if (!task) {
    throw AppError.notFound("Task not found.");
  }
  return task;
}

export async function getTask(ownerId: string, taskId: string): Promise<TaskView> {
  return docToView(await requireOwnedTask(ownerId, taskId));
}

export async function updateTask(
  ownerId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskView> {
  const task = await requireOwnedTask(ownerId, taskId);
  if (input.title !== undefined) task.title = input.title;
  if (input.description !== undefined) task.description = input.description;
  if (input.status !== undefined) task.status = input.status;
  if (input.dueDate !== undefined) task.dueDate = input.dueDate;
  await task.save();
  return docToView(task);
}

export async function deleteTask(ownerId: string, taskId: string): Promise<void> {
  const task = await requireOwnedTask(ownerId, taskId);
  await task.deleteOne();
}
