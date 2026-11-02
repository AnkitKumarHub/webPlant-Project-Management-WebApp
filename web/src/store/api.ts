import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type {
  Credentials,
  DueFilter,
  Project,
  SortOrder,
  Task,
  TaskSortField,
  TaskStatus,
  User,
} from "@/lib/types";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

const rawBaseQuery = fetchBaseQuery({ baseUrl, credentials: "include" });

/** Endpoints that must never trigger a refresh attempt, or we would loop. */
const NO_RETRY = ["/auth/refresh", "/auth/login", "/auth/signup", "/auth/logout"];

function requestUrl(args: string | FetchArgs): string {
  return typeof args === "string" ? args : args.url;
}

let refreshInFlight: ReturnType<typeof rawBaseQuery> | null = null;

/**
 * Access tokens live 15 minutes. When one expires mid-session we spend the
 * refresh cookie once and replay the original request, so the user never sees
 * a spurious logout.
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401 || NO_RETRY.includes(requestUrl(args))) {
    return result;
  }

  if (!refreshInFlight) {
    refreshInFlight = rawBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions,
    );
  }

  let refreshed;
  try {
    refreshed = await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }

  if (refreshed.error) {
    return result;
  }
  return rawBaseQuery(args, api, extraOptions);
};

type Envelope<T> = { data: T };

const unwrap = <T,>(response: Envelope<T>): T => response.data;

export type TaskListArgs = {
  projectId: string;
  status?: TaskStatus[];
  due?: DueFilter;
  /** The caller's calendar date, so `due` presets mean the user's today. */
  today?: string;
  sort: TaskSortField;
  order: SortOrder;
};

export type CreateTaskArgs = {
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string | null;
};

export type UpdateTaskArgs = {
  id: string;
  projectId: string;
  patch: Partial<Omit<CreateTaskArgs, "projectId">> & { position?: number };
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "Project", "Task"],
  endpoints: (builder) => ({
    me: builder.query<User, void>({
      query: () => "/auth/me",
      transformResponse: unwrap<User>,
      providesTags: ["Auth"],
    }),
    signup: builder.mutation<User, Credentials>({
      query: (body) => ({ url: "/auth/signup", method: "POST", body }),
      transformResponse: unwrap<User>,
      invalidatesTags: ["Auth", "Project", "Task"],
    }),
    login: builder.mutation<User, Credentials>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: unwrap<User>,
      invalidatesTags: ["Auth", "Project", "Task"],
    }),
    logout: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      transformResponse: unwrap<{ ok: boolean }>,
      invalidatesTags: ["Auth", "Project", "Task"],
    }),

    listProjects: builder.query<Project[], void>({
      query: () => "/projects",
      transformResponse: unwrap<Project[]>,
      providesTags: (result) => [
        { type: "Project" as const, id: "LIST" },
        ...(result ?? []).map((project) => ({ type: "Project" as const, id: project.id })),
      ],
    }),
    getProject: builder.query<Project, string>({
      query: (id) => `/projects/${id}`,
      transformResponse: unwrap<Project>,
      providesTags: (_result, _error, id) => [{ type: "Project", id }],
    }),
    createProject: builder.mutation<Project, { title: string; description: string }>({
      query: (body) => ({ url: "/projects", method: "POST", body }),
      transformResponse: unwrap<Project>,
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),
    updateProject: builder.mutation<
      Project,
      { id: string; patch: { title?: string; description?: string } }
    >({
      query: ({ id, patch }) => ({ url: `/projects/${id}`, method: "PATCH", body: patch }),
      transformResponse: unwrap<Project>,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: "LIST" },
      ],
    }),
    deleteProject: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/projects/${id}`, method: "DELETE" }),
      transformResponse: unwrap<{ ok: boolean }>,
      invalidatesTags: (_result, _error, id) => [
        { type: "Project", id },
        { type: "Project", id: "LIST" },
        { type: "Task", id: "LIST" },
      ],
    }),

    listTasks: builder.query<Task[], TaskListArgs>({
      query: ({ projectId, status, due, today, sort, order }) => ({
        url: `/projects/${projectId}/tasks`,
        params: {
          sort,
          order,
          ...(status && status.length > 0 ? { status: status.join(",") } : {}),
          ...(due ? { due, ...(today ? { today } : {}) } : {}),
        },
      }),
      transformResponse: unwrap<Task[]>,
      providesTags: (result) => [
        { type: "Task" as const, id: "LIST" },
        ...(result ?? []).map((task) => ({ type: "Task" as const, id: task.id })),
      ],
    }),
    createTask: builder.mutation<Task, CreateTaskArgs>({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/tasks`,
        method: "POST",
        body,
      }),
      transformResponse: unwrap<Task>,
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Task", id: "LIST" },
        { type: "Project", id: projectId },
        { type: "Project", id: "LIST" },
      ],
    }),
    updateTask: builder.mutation<Task, UpdateTaskArgs>({
      query: ({ id, patch }) => ({ url: `/tasks/${id}`, method: "PATCH", body: patch }),
      transformResponse: unwrap<Task>,
      invalidatesTags: (_result, _error, { id, projectId }) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
        { type: "Project", id: projectId },
        { type: "Project", id: "LIST" },
      ],
    }),
    deleteTask: builder.mutation<{ ok: boolean }, { id: string; projectId: string }>({
      query: ({ id }) => ({ url: `/tasks/${id}`, method: "DELETE" }),
      transformResponse: unwrap<{ ok: boolean }>,
      invalidatesTags: (_result, _error, { id, projectId }) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
        { type: "Project", id: projectId },
        { type: "Project", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useMeQuery,
  useSignupMutation,
  useLoginMutation,
  useLogoutMutation,
  useListProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useListTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = api;
