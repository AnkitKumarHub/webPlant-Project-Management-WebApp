"use client";

import { ChevronRightIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { ProjectForm } from "@/components/project-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_STYLES } from "@/lib/status-styles";
import { TASK_STATUSES, TASK_STATUS_LABELS, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDeleteProjectMutation } from "@/store/api";

export function ProjectCard({ project }: { project: Project }) {
  const [editing, setEditing] = useState(false);
  const [deleteProject] = useDeleteProjectMutation();

  if (editing) {
    return (
      <ProjectForm
        project={project}
        onDone={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const { taskCounts } = project;
  const href = `/projects/${project.id}`;
  const total = taskCounts.total;

  return (
    <Card className="transition-colors hover:bg-muted/40 hover:ring-foreground/15">
      <CardHeader>
        <CardTitle>
          <Link
            href={href}
            className="rounded-sm outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {project.title}
          </Link>
        </CardTitle>
        <CardAction className="relative z-10 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <PencilIcon data-icon="inline-start" />
            Edit
          </Button>
          <ConfirmButton label="Delete" onConfirm={() => void deleteProject(project.id)} />
        </CardAction>
      </CardHeader>

      <CardContent>
        <Link
          href={href}
          className="group/open block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {project.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No description</p>
          )}

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                {total === 0
                  ? "No tasks yet"
                  : `${total} task${total === 1 ? "" : "s"}`}
              </span>

              {total > 0
                ? TASK_STATUSES.map((status) => (
                    <Badge key={status} variant="secondary">
                      <span
                        aria-hidden
                        className={cn("size-1.5 rounded-full", STATUS_STYLES[status].dot)}
                      />
                      {TASK_STATUS_LABELS[status]}
                      <span className="font-semibold">{taskCounts[status]}</span>
                    </Badge>
                  ))
                : null}
            </div>

            <div
              className="flex h-1.5 overflow-hidden rounded-full bg-muted"
              role="presentation"
              aria-hidden={total === 0}
            >
              {total > 0
                ? TASK_STATUSES.map((status) => {
                    const count = taskCounts[status];
                    if (count === 0) return null;
                    return (
                      <span
                        key={status}
                        className={cn("h-full", STATUS_STYLES[status].dot)}
                        style={{ width: `${(count / total) * 100}%` }}
                        title={`${TASK_STATUS_LABELS[status]}: ${count}`}
                      />
                    );
                  })
                : null}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {total === 0 ? "Open to add tasks" : "Open project"}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-foreground transition-transform group-hover/open:translate-x-0.5">
                {total === 0 ? "Add tasks" : "View tasks"}
                <ChevronRightIcon className="size-3.5" />
              </span>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
