import type { ZodType } from "zod";
import { AppError } from "./errors.js";

/** Turns a Zod failure into the `{ error: { fields } }` envelope the web app renders inline. */
export function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return parsed.data;
  }

  const fields: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in fields)) {
      fields[key] = issue.message;
    }
  }
  throw AppError.validation("Please correct the highlighted fields.", fields);
}

/** `req.params` is loosely typed; this narrows a route param to a present string. */
export function requireParam(
  params: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const value = params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw AppError.notFound("Not found.");
  }
  return value;
}
