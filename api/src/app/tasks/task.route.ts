import { Router, type Router as ExpressRouter } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  createTaskController,
  deleteTaskController,
  getTaskController,
  listAllTasksController,
  listProjectTasksController,
  updateTaskController,
} from "./task.controller.js";

export function createTaskRouter(): ExpressRouter {
  const router = Router();

  router.use(requireAuth);
  router.get("/tasks", listAllTasksController);
  router.get("/projects/:projectId/tasks", listProjectTasksController);
  router.post("/projects/:projectId/tasks", createTaskController);
  router.get("/tasks/:taskId", getTaskController);
  router.patch("/tasks/:taskId", updateTaskController);
  router.delete("/tasks/:taskId", deleteTaskController);

  return router;
}
