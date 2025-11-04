import mongoose, { Schema, model, Document } from 'mongoose';

interface IDownload extends Document {
  dlog_id?: number;
  date: Date;
  user_id: number;
  thesis_id: number;
}

const userSchema = new Schema<IDownload>({
  dlog_id: { type: Number, required: true, unique: true },
  date: { type: Date, default: Date.now() },
  user_id: { type: Number, required: true },
  thesis_id: { type: Number, required: true },
});

export const Download = mongoose.models.Download || mongoose.model('Download', userSchema)
