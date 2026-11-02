import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DueFilter, SortOrder, TaskSortField, TaskStatus } from "@/lib/types";

export type TaskViewMode = "board" | "list";

export type TaskFiltersState = {
  /** Empty means "every status". Only meaningful in list view. */
  status: TaskStatus[];
  /** null means "any due date". Applies to both views. */
  due: DueFilter | null;
  sort: TaskSortField;
  order: SortOrder;
  view: TaskViewMode;
};

const initialState: TaskFiltersState = {
  status: [],
  due: null,
  sort: "dueDate",
  order: "asc",
  view: "board",
};

const taskFiltersSlice = createSlice({
  name: "taskFilters",
  initialState,
  reducers: {
    statusToggled(state, action: PayloadAction<TaskStatus>) {
      state.status = state.status.includes(action.payload)
        ? state.status.filter((status) => status !== action.payload)
        : [...state.status, action.payload];
    },
    statusCleared(state) {
      state.status = [];
    },
    /** Single-select: clicking the active chip clears it. */
    dueChanged(state, action: PayloadAction<DueFilter>) {
      state.due = state.due === action.payload ? null : action.payload;
    },
    sortChanged(state, action: PayloadAction<TaskSortField>) {
      state.sort = action.payload;
    },
    orderToggled(state) {
      state.order = state.order === "asc" ? "desc" : "asc";
    },
    viewChanged(state, action: PayloadAction<TaskViewMode>) {
      state.view = action.payload;
      // The board shows every column, so a status filter would only empty
      // columns out and look like data loss.
      if (action.payload === "board") {
        state.status = [];
      }
    },
    filtersReset(state) {
      return { ...initialState, view: state.view };
    },
  },
});

export const {
  statusToggled,
  statusCleared,
  dueChanged,
  sortChanged,
  orderToggled,
  viewChanged,
  filtersReset,
} = taskFiltersSlice.actions;
export const taskFiltersReducer = taskFiltersSlice.reducer;
