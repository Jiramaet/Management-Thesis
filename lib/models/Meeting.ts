import mongoose, { Schema, Document, Types } from 'mongoose';

interface IMeeting extends Document {
  thesis: Types.ObjectId;
  organizer: Types.ObjectId; // Usually the one who requested/created
  date: Date;
  title: string;
  notes?: string;
  url?: string; // New field
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>({
  thesis: { type: Schema.Types.ObjectId, ref: 'Thesis', required: true },
  organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  title: { type: String, required: true },
  notes: { type: String },
  url: { type: String }, // New field
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
}, { timestamps: true });

export const Meeting = mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);
