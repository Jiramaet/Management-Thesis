import mongoose, { Schema, Document, Types } from 'mongoose';

interface IActivityLog extends Document {
  thesis: Types.ObjectId;
  user: Types.ObjectId; // Who performed the action
  action: string;       // e.g., "uploaded_chapter", "status_change", "commented"
  details: string;      // Description of the action
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  thesis: { type: Schema.Types.ObjectId, ref: 'Thesis', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
