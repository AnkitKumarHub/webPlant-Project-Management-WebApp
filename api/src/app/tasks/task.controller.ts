import type { Request, Response } from "express";
import { sendData } from "../shared/envelope.js";
import { AppError } from "../shared/errors.js";
import { parseOrThrow, requireParam } from "../shared/validate.js";
import { createTaskSchema, taskQuerySchema, updateTaskSchema } from "./task.schema.js";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "./task.service.js";

function callerId(req: Request): string {
  if (!req.auth) {
    throw AppError.unauthenticated("Authentication required.");
  }
  return req.auth.id;
}

export async function listProjectTasksController(req: Request, res: Response) {
  const projectId = requireParam(req.params, "projectId");
  const query = parseOrThrow(taskQuerySchema, req.query);
  sendData(res, await listTasks(callerId(req), query, projectId));
}

export async function listAllTasksController(req: Request, res: Response) {
  const query = parseOrThrow(taskQuerySchema, req.query);
  sendData(res, await listTasks(callerId(req), query));
}

export async function createTaskController(req: Request, res: Response) {
  const projectId = requireParam(req.params, "projectId");
  const body = parseOrThrow(createTaskSchema, req.body);
  sendData(res, await createTask(callerId(req), projectId, body), 201);
}

export async function getTaskController(req: Request, res: Response) {
  const taskId = requireParam(req.params, "taskId");
  sendData(res, await getTask(callerId(req), taskId));
}

export async function updateTaskController(req: Request, res: Response) {
  const taskId = requireParam(req.params, "taskId");
  const body = parseOrThrow(updateTaskSchema, req.body);
  sendData(res, await updateTask(callerId(req), taskId, body));
}

export async function deleteTaskController(req: Request, res: Response) {
  const taskId = requireParam(req.params, "taskId");
  await deleteTask(callerId(req), taskId);
  sendData(res, { ok: true });
}
