"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { RequireAuth } from "@/components/auth-guard";
import { ProjectCard } from "@/components/project-card";
import { ProjectForm } from "@/components/project-form";
import { EmptyState, LoadingState } from "@/components/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";
import { useListProjectsQuery } from "@/store/api";

function ProjectsView() {
  const { data: projects, isLoading, error } = useListProjectsQuery();
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {projects
              ? `${projects.length} project${projects.length === 1 ? "" : "s"} · open one to manage its tasks`
              : " "}
          </p>
        </div>
        {!creating ? (
          <Button onClick={() => setCreating(true)}>
            <PlusIcon data-icon="inline-start" />
            New project
          </Button>
        ) : null}
      </div>

      {creating ? (
        <ProjectForm onDone={() => setCreating(false)} onCancel={() => setCreating(false)} />
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {errorMessage(error, "Could not load your projects.")}
          </AlertDescription>
        </Alert>
      ) : null}
      {isLoading ? <LoadingState label="Loading projects" /> : null}

      {projects && projects.length === 0 && !creating ? (
        <EmptyState title="No projects yet">
          Create your first project to start tracking tasks.
        </EmptyState>
      ) : null}

      <div className="grid gap-4">
        {projects?.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <RequireAuth>
      <ProjectsView />
    </RequireAuth>
  );
}
