"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { Button } from "@/components/ui/button";
import { dueState, formatDate } from "@/lib/format";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDeleteTaskMutation } from "@/store/api";

const DUE_STYLES: Record<ReturnType<typeof dueState>, string> = {
  none: "text-muted-foreground/60",
  overdue: "text-destructive font-medium",
  soon: "text-foreground font-medium",
  later: "text-muted-foreground",
};

/** The card body, shared by the real card and the floating drag overlay. */
export function TaskCardBody({
  task,
  dragging = false,
  handle,
}: {
  task: Task;
  dragging?: boolean;
  handle?: ReactNode;
}) {
  const due = dueState(task.dueDate, task.status);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3 shadow-sm select-none",
        dragging && "rotate-1 shadow-lg",
      )}
    >
      <div className="flex items-start gap-2">
        {handle}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "pr-12 text-sm leading-snug font-medium",
              task.status === "done" && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>
          {task.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {task.description}
            </p>
          ) : null}
          <p className={cn("mt-2 text-xs", DUE_STYLES[due])}>
            {formatDate(task.dueDate)}
            {due === "overdue" ? " · overdue" : due === "soon" ? " · due soon" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TaskBoardCard({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false);
  const [armed, setArmed] = useState(false);
  const [deleteTask] = useDeleteTaskMutation();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  // Same two-step delete as the list view, just icon-sized.
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Translate.toString(transform) }}
        // The original stays put but fades while the overlay follows the cursor,
        // so the column does not reflow mid-drag.
        className={cn("group/card relative", isDragging && "opacity-40")}
      >
        <TaskCardBody
          task={task}
          handle={
            <button
              type="button"
              className={cn(
                "-ml-1 cursor-grab touch-none rounded p-1 text-muted-foreground/50",
                "hover:bg-muted hover:text-foreground active:cursor-grabbing",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              )}
              aria-label={`Move ${task.title}`}
              {...listeners}
              {...attributes}
            >
              <GripVerticalIcon className="size-4" />
            </button>
          }
        />

        <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Edit ${task.title}`}
            onClick={() => setEditing(true)}
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={armed ? `Confirm delete ${task.title}` : `Delete ${task.title}`}
            className={cn(armed && "bg-destructive/15 opacity-100")}
            onClick={() => {
              if (!armed) {
                setArmed(true);
                return;
              }
              void deleteTask({ id: task.id, projectId: task.projectId });
            }}
          >
            <Trash2Icon className="text-destructive" />
          </Button>
        </div>
      </div>

      <TaskFormDialog
        open={editing}
        onOpenChange={setEditing}
        projectId={task.projectId}
        task={task}
      />
    </>
  );
}
