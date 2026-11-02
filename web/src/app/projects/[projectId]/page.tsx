"use client";

import { ArrowLeftIcon, PencilIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";
import { RequireAuth } from "@/components/auth-guard";
import { ConfirmButton } from "@/components/confirm-button";
import { ProjectForm } from "@/components/project-form";
import { EmptyState, LoadingState } from "@/components/states";
import { TaskBoard } from "@/components/task-board";
import { TaskFilters } from "@/components/task-filters";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { TaskItem } from "@/components/task-item";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";
import { localDateKey } from "@/lib/format";
import {
  useDeleteProjectMutation,
  useGetProjectQuery,
  useListTasksQuery,
  type TaskListArgs,
} from "@/store/api";
import { useAppSelector } from "@/store/hooks";

function ProjectDetailView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const filters = useAppSelector((state) => state.taskFilters);

  const projectQuery = useGetProjectQuery(projectId);

  // Held in one place so the board's optimistic patch targets the same cache
  // entry this query filled.
  const listArgs = useMemo<TaskListArgs>(
    () => ({
      projectId,
      ...(filters.status.length > 0 ? { status: filters.status } : {}),
      ...(filters.due ? { due: filters.due, today: localDateKey() } : {}),
      sort: filters.sort,
      order: filters.order,
    }),
    [projectId, filters.status, filters.due, filters.sort, filters.order],
  );
  const tasksQuery = useListTasksQuery(listArgs);

  const [deleteProject] = useDeleteProjectMutation();
  const [editingProject, setEditingProject] = useState(false);
  const [addingTask, setAddingTask] = useState(false);

  if (projectQuery.isLoading) {
    return <LoadingState label="Loading project" />;
  }

  if (projectQuery.error || !projectQuery.data) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {errorMessage(projectQuery.error, "That project could not be loaded.")}
          </AlertDescription>
        </Alert>
        <Link href="/projects" className="text-sm hover:underline">
          ← Back to projects
        </Link>
      </div>
    );
  }

  const project = projectQuery.data;
  const tasks = tasksQuery.data ?? [];

  return (
    <div className="space-y-6">
      {/* nativeButton={false} tells Base UI this renders an anchor, not a <button>. */}
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/projects" />}>
        <ArrowLeftIcon data-icon="inline-start" />
        All projects
      </Button>

      {editingProject ? (
        <ProjectForm
          project={project}
          onDone={() => setEditingProject(false)}
          onCancel={() => setEditingProject(false)}
        />
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">{project.title}</h1>
            {project.description ? (
              <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                {project.description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingProject(true)}>
              <PencilIcon data-icon="inline-start" />
              Edit project
            </Button>
            <ConfirmButton
              label="Delete project"
              onConfirm={async () => {
                await deleteProject(project.id);
                router.replace("/projects");
              }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold tracking-tight">Tasks</h2>
        <Button size="sm" onClick={() => setAddingTask(true)}>
          <PlusIcon data-icon="inline-start" />
          Add task
        </Button>
      </div>

      <TaskFormDialog
        open={addingTask}
        onOpenChange={setAddingTask}
        projectId={project.id}
      />

      <TaskFilters total={project.taskCounts.total} shown={tasks.length} />

      {tasksQuery.error ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(tasksQuery.error, "Could not load tasks.")}</AlertDescription>
        </Alert>
      ) : null}
      {tasksQuery.isLoading ? <LoadingState label="Loading tasks" /> : null}

      {filters.view === "board" ? (
        <TaskBoard projectId={project.id} tasks={tasks} listArgs={listArgs} />
      ) : (
        <>
          {!tasksQuery.isLoading && tasks.length === 0 ? (
            <EmptyState
              title={
                project.taskCounts.total === 0
                  ? "No tasks in this project yet"
                  : "No tasks match these filters"
              }
            >
              {project.taskCounts.total === 0
                ? "Add the first one to get going."
                : "Try clearing the status filter."}
            </EmptyState>
          ) : null}

          <div className="grid gap-3">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return (
    <RequireAuth>
      <ProjectDetailView projectId={projectId} />
    </RequireAuth>
  );
}
