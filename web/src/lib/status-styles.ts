import type { TaskStatus } from "./types";

/**
 * Written out as whole class names on purpose — Tailwind scans source text,
 * so a composed `bg-${token}` would never make it into the stylesheet.
 *
 * The hues are deliberately low-chroma: three columns of saturated colour
 * reads as three alerts. These should read as stages.
 */
export const STATUS_STYLES: Record<
  TaskStatus,
  { dot: string; label: string; column: string; dropRing: string }
> = {
  todo: {
    dot: "bg-status-todo",
    label: "text-status-todo",
    column: "bg-status-todo/4",
    dropRing: "ring-status-todo/40 bg-status-todo/8",
  },
  "in-progress": {
    dot: "bg-status-progress",
    label: "text-status-progress",
    column: "bg-status-progress/4",
    dropRing: "ring-status-progress/40 bg-status-progress/8",
  },
  done: {
    dot: "bg-status-done",
    label: "text-status-done",
    column: "bg-status-done/4",
    dropRing: "ring-status-done/40 bg-status-done/8",
  },
};
