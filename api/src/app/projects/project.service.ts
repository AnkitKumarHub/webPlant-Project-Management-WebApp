import { Types } from "mongoose";
import { ProjectModel, type ProjectDocument } from "../../db/models/project.model.js";
import { TaskModel, TASK_STATUSES } from "../../db/models/task.model.js";
import { AppError } from "../shared/errors.js";
import { toObjectId } from "../shared/object-id.js";
import type { CreateProjectInput, UpdateProjectInput } from "./project.schema.js";

export type TaskCounts = Record<(typeof TASK_STATUSES)[number] | "total", number>;

export type ProjectView = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  taskCounts: TaskCounts;
};

function emptyCounts(): TaskCounts {
  return { todo: 0, "in-progress": 0, done: 0, total: 0 };
}

function toView(project: ProjectDocument, counts: TaskCounts): ProjectView {
  return {
    id: project._id.toString(),
    title: project.title,
    description: project.description,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    taskCounts: counts,
  };
}

/** One grouped count query for the whole page, instead of one per project. */
async function countsByProject(
  ownerId: Types.ObjectId,
  projectIds: Types.ObjectId[],
): Promise<Map<string, TaskCounts>> {
  const result = new Map<string, TaskCounts>();
  if (projectIds.length === 0) return result;

  const rows = await TaskModel.aggregate<{
    _id: { project: Types.ObjectId; status: string };
    count: number;
  }>([
    { $match: { owner: ownerId, project: { $in: projectIds } } },
    { $group: { _id: { project: "$project", status: "$status" }, count: { $sum: 1 } } },
  ]);

  for (const row of rows) {
    const key = row._id.project.toString();
    const counts = result.get(key) ?? emptyCounts();
    if (row._id.status === "todo" || row._id.status === "in-progress" || row._id.status === "done") {
      counts[row._id.status] = row.count;
    }
    counts.total += row.count;
    result.set(key, counts);
  }

  return result;
}

export async function listProjects(ownerId: string): Promise<ProjectView[]> {
  const owner = toObjectId(ownerId);
  const projects = await ProjectModel.find({ owner }).sort({ createdAt: -1 });
  const counts = await countsByProject(
    owner,
    projects.map((p) => p._id),
  );
  return projects.map((p) => toView(p, counts.get(p._id.toString()) ?? emptyCounts()));
}

/** Loads a project only if it belongs to the caller. Used as the ownership gate. */
export async function requireOwnedProject(
  ownerId: string,
  projectId: string,
): Promise<ProjectDocument> {
  const project = await ProjectModel.findOne({
    _id: toObjectId(projectId, "Project"),
    owner: toObjectId(ownerId),
  });
  if (!project) {
    throw AppError.notFound("Project not found.");
  }
  return project;
}

export async function getProject(ownerId: string, projectId: string): Promise<ProjectView> {
  const project = await requireOwnedProject(ownerId, projectId);
  const counts = await countsByProject(toObjectId(ownerId), [project._id]);
  return toView(project, counts.get(project._id.toString()) ?? emptyCounts());
}

export async function createProject(
  ownerId: string,
  input: CreateProjectInput,
): Promise<ProjectView> {
  const project = await ProjectModel.create({
    title: input.title,
    description: input.description,
    owner: toObjectId(ownerId),
  });
  return toView(project, emptyCounts());
}

export async function updateProject(
  ownerId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<ProjectView> {
  const project = await requireOwnedProject(ownerId, projectId);
  if (input.title !== undefined) project.title = input.title;
  if (input.description !== undefined) project.description = input.description;
  await project.save();

  const counts = await countsByProject(toObjectId(ownerId), [project._id]);
  return toView(project, counts.get(project._id.toString()) ?? emptyCounts());
}

export async function deleteProject(ownerId: string, projectId: string): Promise<void> {
  const project = await requireOwnedProject(ownerId, projectId);
  // Tasks have no meaning without their project, so they go with it.
  await TaskModel.deleteMany({ project: project._id });
  await project.deleteOne();
}
