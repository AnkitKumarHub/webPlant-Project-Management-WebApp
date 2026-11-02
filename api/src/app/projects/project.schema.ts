import { z } from "zod";

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required.")
  .max(200, "Title must be at most 200 characters.");

const descriptionSchema = z
  .string()
  .trim()
  .max(5000, "Description must be at most 5000 characters.");

export const createProjectSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.default(""),
});

/**
 * Deliberately not `createProjectSchema.partial()`: `.partial()` leaves the
 * `.default("")` in place, so an omitted description would parse as an empty
 * string and a `PATCH {}` would silently wipe it.
 */
export const updateProjectSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
