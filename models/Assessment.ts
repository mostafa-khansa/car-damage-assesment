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
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toHexString(),
    },
    assessmentId: { type: String, required: true, unique: true },
    beforeImageUrl: { type: String, required: true },
    afterImageUrl: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['processing', 'completed', 'failed'], 
      default: 'processing' 
    },
    // Store the full n8n webhook response
    analysisResult: { type: Schema.Types.Mixed, default: null },
    // Legacy fields for backward compatibility
    title: { type: String },
    totalCost: { type: Number, min: 0 },
    damages: { type: [DamageSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
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
