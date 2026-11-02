import type { Request, Response } from "express";
import { sendData } from "../shared/envelope.js";
import { AppError } from "../shared/errors.js";
import { parseOrThrow, requireParam } from "../shared/validate.js";
import { createProjectSchema, updateProjectSchema } from "./project.schema.js";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "./project.service.js";

function callerId(req: Request): string {
  if (!req.auth) {
    throw AppError.unauthenticated("Authentication required.");
  }
  return req.auth.id;
}

export async function listProjectsController(req: Request, res: Response) {
  sendData(res, await listProjects(callerId(req)));
}

export async function createProjectController(req: Request, res: Response) {
  const body = parseOrThrow(createProjectSchema, req.body);
  sendData(res, await createProject(callerId(req), body), 201);
}

export async function getProjectController(req: Request, res: Response) {
  const projectId = requireParam(req.params, "projectId");
  sendData(res, await getProject(callerId(req), projectId));
}

export async function updateProjectController(req: Request, res: Response) {
  const projectId = requireParam(req.params, "projectId");
  const body = parseOrThrow(updateProjectSchema, req.body);
  sendData(res, await updateProject(callerId(req), projectId, body));
}

export async function deleteProjectController(req: Request, res: Response) {
  const projectId = requireParam(req.params, "projectId");
  await deleteProject(callerId(req), projectId);
  sendData(res, { ok: true });
}
