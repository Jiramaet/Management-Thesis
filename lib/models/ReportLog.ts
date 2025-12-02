import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReportLog extends Document {
  user: Types.ObjectId;
  reportName: string;
  template: string;
  format: string;
  fileSize: string;
  status: 'completed' | 'failed';
  createdAt: Date;
}

const ReportLogSchema = new Schema<IReportLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportName: { type: String, required: true },
  template: { type: String, required: true },
  format: { type: String, required: true },
  fileSize: { type: String, required: true },
  status: { type: String, enum: ['completed', 'failed'], default: 'completed' },
}, { timestamps: true });

export const ReportLog = mongoose.models.ReportLog || mongoose.model<IReportLog>('ReportLog', ReportLogSchema);
