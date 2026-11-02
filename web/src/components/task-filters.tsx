"use client";

import {
  ArrowDownNarrowWideIcon,
  ArrowUpNarrowWideIcon,
  LayoutListIcon,
  SquareKanbanIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DUE_FILTERS,
  DUE_FILTER_LABELS,
  TASK_SORT_FIELDS,
  TASK_SORT_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskSortField,
} from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  dueChanged,
  filtersReset,
  orderToggled,
  sortChanged,
  statusToggled,
  viewChanged,
} from "@/store/task-filters-slice";

export function TaskFilters({ total, shown }: { total: number; shown: number }) {
  const filters = useAppSelector((state) => state.taskFilters);
  const dispatch = useAppDispatch();

  const board = filters.view === "board";
  // In board view the status pills are hidden, so they do not narrow anything.
  const filtering = (!board && filters.status.length > 0) || filters.due !== null;
  const customised =
    filters.status.length > 0 ||
    filters.due !== null ||
    filters.sort !== "dueDate" ||
    filters.order !== "asc";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border bg-card px-4 py-3">
      <div className="flex items-center gap-1" role="group" aria-label="View">
        <Button
          size="xs"
          variant={board ? "default" : "outline"}
          aria-pressed={board}
          onClick={() => dispatch(viewChanged("board"))}
        >
          <SquareKanbanIcon data-icon="inline-start" />
          Board
        </Button>
        <Button
          size="xs"
          variant={board ? "outline" : "default"}
          aria-pressed={!board}
          onClick={() => dispatch(viewChanged("list"))}
        >
          <LayoutListIcon data-icon="inline-start" />
          List
        </Button>
      </div>

      <Separator orientation="vertical" className="hidden h-6 sm:block" />

      {/* On the board the columns are the statuses, so a status filter there
          would just blank out columns. */}
      {board ? null : (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-muted-foreground">Status</span>
            {TASK_STATUSES.map((status) => {
              const active = filters.status.includes(status);
              return (
                <Button
                  key={status}
                  type="button"
                  size="xs"
                  variant={active ? "default" : "outline"}
                  aria-pressed={active}
                  onClick={() => dispatch(statusToggled(status))}
                >
                  {TASK_STATUS_LABELS[status]}
                </Button>
              );
            })}
          </div>

          <Separator orientation="vertical" className="hidden h-6 sm:block" />
        </>
      )}

      {/* Due date is orthogonal to the columns, so it applies in both views. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-muted-foreground">Due</span>
        {DUE_FILTERS.map((due) => {
          const active = filters.due === due;
          return (
            <Button
              key={due}
              type="button"
              size="xs"
              variant={active ? "default" : "outline"}
              aria-pressed={active}
              onClick={() => dispatch(dueChanged(due))}
            >
              {DUE_FILTER_LABELS[due]}
            </Button>
          );
        })}
      </div>

      <Separator orientation="vertical" className="hidden h-6 sm:block" />

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {board ? "Order cards by" : "Sort by"}
        </span>
        <Select
          items={TASK_SORT_LABELS}
          value={filters.sort}
          onValueChange={(value) => {
            if (value) dispatch(sortChanged(value as TaskSortField));
          }}
        >
          <SelectTrigger size="sm" aria-label="Sort tasks by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_SORT_FIELDS.map((field) => (
              <SelectItem key={field} value={field}>
                {TASK_SORT_LABELS[field]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch(orderToggled())}
          aria-label={filters.order === "asc" ? "Sort ascending" : "Sort descending"}
        >
          {filters.order === "asc" ? (
            <ArrowUpNarrowWideIcon data-icon="inline-start" />
          ) : (
            <ArrowDownNarrowWideIcon data-icon="inline-start" />
          )}
          {filters.order === "asc" ? "Asc" : "Desc"}
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {filtering
            ? `${shown} of ${total}`
            : `${total} task${total === 1 ? "" : "s"}`}
        </span>
        {customised ? (
          <Button variant="ghost" size="sm" onClick={() => dispatch(filtersReset())}>
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}
