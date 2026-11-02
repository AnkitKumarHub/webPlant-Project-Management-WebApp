import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import type { ApiErrorBody } from "./types";

type UnknownError = FetchBaseQueryError | SerializedError | undefined;

function apiBody(error: UnknownError): ApiErrorBody | undefined {
  if (!error || !("status" in error)) return undefined;
  const data = (error as FetchBaseQueryError & { data?: unknown }).data;
  if (typeof data !== "object" || data === null) return undefined;
  const body = (data as { error?: unknown }).error;
  if (typeof body !== "object" || body === null) return undefined;
  return body as ApiErrorBody;
}

/** A sentence safe to show the user, whatever shape the failure arrived in. */
export function errorMessage(error: UnknownError, fallback = "Something went wrong."): string {
  if (!error) return fallback;

  const body = apiBody(error);
  if (body?.message) return body.message;

  if ("status" in error && error.status === "FETCH_ERROR") {
    return "Could not reach the API. Is the server running?";
  }
  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

/** Per-field messages from a 400, for rendering next to the inputs. */
export function errorFields(error: UnknownError): Record<string, string> {
  return apiBody(error)?.fields ?? {};
}

export function isUnauthenticated(error: UnknownError): boolean {
  return Boolean(error && "status" in error && error.status === 401);
}
