"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { TaskBoardCard, TaskCardBody } from "@/components/task-board-card";
import { STATUS_STYLES } from "@/lib/status-styles";
import { TASK_STATUSES, TASK_STATUS_LABELS, type Task, type TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { api, useUpdateTaskMutation, type TaskListArgs } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";

function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

/**
 * dnd-kit's default keyboard step is 25px, which would take a dozen presses to
 * cross a column. Left/Right jump a whole column instead, which is the only
 * move this board actually supports.
 */
const boardKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  { currentCoordinates, context },
) => {
  const direction =
    event.code === "ArrowRight" ? 1 : event.code === "ArrowLeft" ? -1 : 0;
  if (direction === 0) return undefined;
  event.preventDefault();

  const rects = TASK_STATUSES.map((status) => context.droppableRects.get(status));
  if (rects.some((rect) => rect === undefined)) return undefined;

  const collision = context.collisionRect;
  const centreX = collision
    ? collision.left + collision.width / 2
    : currentCoordinates.x;

  let index = rects.findIndex(
    (rect) => rect && centreX >= rect.left && centreX <= rect.left + rect.width,
  );
  if (index === -1) index = direction > 0 ? 0 : rects.length - 1;

  const nextIndex = Math.min(Math.max(index + direction, 0), rects.length - 1);
  const from = rects[index];
  const to = rects[nextIndex];
  if (nextIndex === index || !from || !to) return undefined;

  return { x: currentCoordinates.x + (to.left - from.left), y: currentCoordinates.y };
};

function BoardColumn({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const styles = STATUS_STYLES[status];

  return (
    <section
      ref={setNodeRef}
      aria-label={`${TASK_STATUS_LABELS[status]} column, ${tasks.length} tasks`}
      className={cn(
        "flex min-w-[260px] flex-1 flex-col gap-3 rounded-xl border p-3 transition-colors",
        styles.column,
        isOver && cn("ring-2", styles.dropRing),
      )}
    >
      <header className="flex items-center gap-2">
        <span aria-hidden className={cn("size-2 rounded-full", styles.dot)} />
        <h3 className={cn("text-xs font-semibold tracking-wide uppercase", styles.label)}>
          {TASK_STATUS_LABELS[status]}
        </h3>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {tasks.length}
        </span>
      </header>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskBoardCard key={task.id} task={task} />
        ))}

        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
            {isOver ? "Drop here" : "Nothing here"}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function TaskBoard({
  projectId,
  tasks,
  listArgs,
}: {
  projectId: string;
  tasks: Task[];
  /** The exact args the list was fetched with, so the optimistic patch lands on the right cache entry. */
  listArgs: TaskListArgs;
}) {
  const dispatch = useAppDispatch();
  const [updateTask] = useUpdateTaskMutation();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    // A few pixels of slop so clicking Edit or Delete is not read as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: boardKeyboardCoordinates }),
  );

  const byStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = { todo: [], "in-progress": [], done: [] };
    for (const task of tasks) {
      groups[task.status].push(task);
    }
    return groups;
  }, [tasks]);

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up task ${String(active.id)}.`,
    onDragOver: ({ over }) =>
      over && isTaskStatus(over.id)
        ? `Over ${TASK_STATUS_LABELS[over.id]}.`
        : "No drop target.",
    onDragEnd: ({ over }) =>
      over && isTaskStatus(over.id)
        ? `Moved to ${TASK_STATUS_LABELS[over.id]}.`
        : "Move cancelled.",
    onDragCancel: () => "Move cancelled.",
  };

  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.["task"] as Task | undefined;
    setActiveTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const task = activeTask;
    setActiveTask(null);

    const target = event.over?.id;
    if (!task || !isTaskStatus(target) || task.status === target) {
      return;
    }

    // Move the card immediately, then let the refetch confirm it. Without this
    // the card jumps back to its old column until the request lands.
    const optimistic = dispatch(
      api.util.updateQueryData("listTasks", listArgs, (draft) => {
        const found = draft.find((item) => item.id === task.id);
        if (found) {
          found.status = target;
        }
      }),
    );

    try {
      await updateTask({ id: task.id, projectId, patch: { status: target } }).unwrap();
    } catch {
      optimistic.undo();
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {TASK_STATUSES.map((status) => (
          <BoardColumn key={status} status={status} tasks={byStatus[status]} />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="w-[260px] cursor-grabbing">
            <TaskCardBody task={activeTask} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
