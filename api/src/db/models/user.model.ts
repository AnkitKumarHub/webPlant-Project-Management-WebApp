import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema> & {
  createdAt: Date;
  updatedAt: Date;
};
export type UserDocument = HydratedDocument<User>;

export const UserModel = model<User>("User", userSchema);
