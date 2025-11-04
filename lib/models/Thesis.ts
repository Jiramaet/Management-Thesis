import mongoose, { Schema, model, Document } from 'mongoose';

interface IThesis extends Document {
  thesis_id?: number;
  user_id: number;
  title: string;
  status: string;
  upload_date: Date;
  file: string;
}

const ThesisSchema = new Schema<IThesis>({
  thesis_id: { type: Number, required: true, unique: true },
  user_id: { type: Number, required: true },
  title: { type: String, required: true },
  status: { type: String, required: true },
  upload_date: { type: Date, default: Date.now() },
  file: { type: String, required: true }

});

export const Thesis = mongoose.models.Thesis || mongoose.model('Thesis', ThesisSchema)
