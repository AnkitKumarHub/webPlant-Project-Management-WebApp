import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

projectSchema.index({ owner: 1, createdAt: -1 });

export type Project = InferSchemaType<typeof projectSchema> & {
  createdAt: Date;
  updatedAt: Date;
};
export type ProjectDocument = HydratedDocument<Project>;

export const ProjectModel = model<Project>("Project", projectSchema);
