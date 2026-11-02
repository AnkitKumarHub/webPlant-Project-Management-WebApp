import type { ErrorRequestHandler, Request, Response } from "express";
import { AppError } from "./errors.js";
import { sendError } from "./envelope.js";

export function notFoundHandler(_req: Request, res: Response) {
  return sendError(res, 404, "NOT_FOUND", "Not found.");
}

/**
 * `express.json()` rejects a bad body by throwing, and those failures are the
 * caller's fault, not ours — without this they would all surface as a 500.
 */
function fromBodyParser(err: unknown): AppError | undefined {
  if (!(err instanceof Error)) return undefined;

  switch ((err as Error & { type?: string }).type) {
    case "entity.parse.failed":
      return AppError.badRequest("Request body is not valid JSON.");
    case "entity.too.large":
      return new AppError(413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
    case "encoding.unsupported":
      return AppError.badRequest("Unsupported content encoding.");
    default:
      return undefined;
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const known = err instanceof AppError ? err : fromBodyParser(err);
  if (known) {
    sendError(res, known.statusCode, known.code, known.message, known.fields);
    return;
  }

  console.error(err);
  sendError(
    res,
    500,
    "INTERNAL",
    "Something went wrong. Please try again later.",
  );
};
