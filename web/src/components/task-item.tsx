"use client";

import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dueState, formatDate } from "@/lib/format";
import { TASK_STATUSES, TASK_STATUS_LABELS, type Task, type TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDeleteTaskMutation, useUpdateTaskMutation } from "@/store/api";

const DUE_STYLES: Record<ReturnType<typeof dueState>, string> = {
  none: "text-muted-foreground/70",
  overdue: "text-destructive font-medium",
  soon: "text-foreground font-medium",
  later: "text-muted-foreground",
};

export function TaskItem({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false);
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const due = dueState(task.dueDate, task.status);

  return (
    <>
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3
                className={cn(
                  "text-sm font-medium",
                  task.status === "done" && "text-muted-foreground line-through",
                )}
              >
                {task.title}
              </h3>
              {task.description ? (
                <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                  {task.description}
                </p>
              ) : null}
              <p className={cn("mt-2 text-xs", DUE_STYLES[due])}>
                {formatDate(task.dueDate)}
                {due === "overdue" ? " · overdue" : due === "soon" ? " · due soon" : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Select
                items={TASK_STATUS_LABELS}
                value={task.status}
                disabled={isUpdating}
                onValueChange={(value) => {
                  if (!value) return;
                  void updateTask({
                    id: task.id,
                    projectId: task.projectId,
                    patch: { status: value as TaskStatus },
                  });
                }}
              >
                <SelectTrigger size="sm" aria-label={`Status for ${task.title}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {TASK_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <PencilIcon data-icon="inline-start" />
                Edit
              </Button>
              <ConfirmButton
                label="Delete"
                onConfirm={() => void deleteTask({ id: task.id, projectId: task.projectId })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskFormDialog
        open={editing}
        onOpenChange={setEditing}
        projectId={task.projectId}
        task={task}
      />
    </>
  );
}
