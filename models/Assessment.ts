import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

const DamageSchema = new Schema(
  {
    type: { type: String, required: true },
    repairCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const AssessmentSchema = new Schema(
  {
    // Use string-based _id so you can pass values like "123" if desired
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toHexString(),
    },
    title: { type: String, required: true },
    beforeImageUrl: { type: String, required: true },
    afterImageUrl: { type: String, required: true },
    totalCost: { type: Number, required: true, min: 0 },
    damages: { type: [DamageSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  }
);

export type Assessment = InferSchemaType<typeof AssessmentSchema>;

export const AssessmentModel: Model<Assessment> =
  (mongoose.models.Assessment as Model<Assessment>) ||
  mongoose.model<Assessment>("Assessment", AssessmentSchema);

export default AssessmentModel;
