import { Router, type Router as ExpressRouter } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  createProjectController,
  deleteProjectController,
  getProjectController,
  listProjectsController,
  updateProjectController,
} from "./project.controller.js";

export function createProjectRouter(): ExpressRouter {
  const router = Router();

  router.use(requireAuth);
  router.get("/projects", listProjectsController);
  router.post("/projects", createProjectController);
  router.get("/projects/:projectId", getProjectController);
  router.patch("/projects/:projectId", updateProjectController);
  router.delete("/projects/:projectId", deleteProjectController);

  return router;
}
