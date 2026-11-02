import { Types } from "mongoose";
import { AppError } from "./errors.js";

/**
 * A malformed id is treated as "not found" rather than a validation error:
 * from the caller's point of view there is no such resource either way, and
 * it keeps us from leaking which ids are well-formed.
 */
export function toObjectId(value: string, resource = "Resource"): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw AppError.notFound(`${resource} not found.`);
  }
  return new Types.ObjectId(value);
}
