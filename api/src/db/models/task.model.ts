import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

export const TASK_STATUSES = ["todo", "in-progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: TASK_STATUSES,
      required: true,
      default: "todo",
    },
    dueDate: { type: Date, default: null },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    // Denormalised so every task query can be scoped to the caller without a
    // join back to projects.
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

taskSchema.index({ project: 1, status: 1, dueDate: 1 });

export type Task = InferSchemaType<typeof taskSchema> & {
  createdAt: Date;
  updatedAt: Date;
};
export type TaskDocument = HydratedDocument<Task>;

export const TaskModel = model<Task>("Task", taskSchema);
