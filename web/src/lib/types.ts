export const TASK_STATUSES = ["todo", "in-progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};

export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type TaskCounts = Record<TaskStatus | "total", number>;

export type Project = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  taskCounts: TaskCounts;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string | null;
  position: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

export type Credentials = {
  email: string;
  password: string;
};

export const TASK_SORT_FIELDS = ["dueDate", "createdAt", "updatedAt", "title", "status"] as const;
/** "manual" is the board's position order; it is never offered in the list sort dropdown. */
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number] | "manual";

export const TASK_SORT_LABELS: Record<TaskSortField, string> = {
  manual: "Manual",
  dueDate: "Due date",
  createdAt: "Created",
  updatedAt: "Last updated",
  title: "Title",
  status: "Status",
};

export type SortOrder = "asc" | "desc";

export const DUE_FILTERS = ["overdue", "today", "week", "undated"] as const;
export type DueFilter = (typeof DUE_FILTERS)[number];

export const DUE_FILTER_LABELS: Record<DueFilter, string> = {
  overdue: "Overdue",
  today: "Due today",
  week: "Next 7 days",
  undated: "No due date",
};
