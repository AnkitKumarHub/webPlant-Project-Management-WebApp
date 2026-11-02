import type { TaskStatus } from "./types";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(iso: string | null): string {
  if (!iso) return "No due date";
  return dateFormatter.format(new Date(iso));
}

/** `yyyy-mm-dd`, the value an `<input type="date">` expects. */
export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function dueState(
  iso: string | null,
  status?: TaskStatus,
): "none" | "overdue" | "soon" | "later" {
  if (!iso) return "none";
  // Finished work is never late. Flagging a done task as overdue is noise.
  if (status === "done") return "later";
  const due = new Date(iso);
  const now = new Date();
  const days = (due.getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return "overdue";
  if (days <= 3) return "soon";
  return "later";
}

/**
 * The viewer's own calendar date as YYYY-MM-DD. Sent with due-date filters so
 * "today" means the user's today, not the server's.
 */
export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
