// lib/models/Thesis.ts
import mongoose, { Schema, model, Document, Types } from 'mongoose';
interface IThesis extends Document {
  thesis_id: string;
  title: string;
  abstract: string;
  author: Types.ObjectId;
  advisor: Types.ObjectId;
  file_path: string;
  status: string; // เพิ่ม status
  isPublic: boolean;
  downloadCount: number;
  similarityScore?: number;
  privateNotes?: string;
  keywords?: string;
  category?: string;
  year?: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;

  version: number;

  chapterApproval: {
    chapter1: boolean;
    chapter2: boolean;
    chapter3: boolean;
    chapter4: boolean;
    chapter5: boolean;
  };

  chapters: {
    chapterNumber: number;
    title: string;
    file_path: string;
    uploadedAt: Date;
    description?: string;
  }[];

}


const ThesisSchema = new Schema<IThesis>({
  thesis_id: { type: String, required: true }, // เอา unique: true ออก
  title: { type: String, required: true },
  abstract: { type: String, required: true },

  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  advisor: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  file_path: { type: String, required: true },
  status: { type: String, required: true, default: 'pending' },
  isPublic: { type: Boolean, default: false },
  downloadCount: { type: Number, default: 0 },
  similarityScore: { type: Number },
  privateNotes: { type: String },

  keywords: { type: String },
  category: { type: String },
  year: { type: String },
  department: { type: String },

  version: { type: Number, default: 1 },

  chapterApproval: {
    chapter1: { type: Boolean, default: true },
    chapter2: { type: Boolean, default: false },
    chapter3: { type: Boolean, default: false },
    chapter4: { type: Boolean, default: false },
    chapter5: { type: Boolean, default: false },
  },

  chapters: [{
    chapterNumber: { type: Number, required: true },
    title: { type: String, required: true },
    file_path: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    description: { type: String }
  }],

}, { timestamps: true }); // (timestamps: true จะสร้าง createdAt และ updatedAt ให้อัตโนมัติ)

// เพิ่ม Compound Index เพื่อให้ (thesis_id + version) ไม่ซ้ำกัน
ThesisSchema.index({ thesis_id: 1, version: 1 }, { unique: true });

export const Thesis = mongoose.models.Thesis || mongoose.model<IThesis>('Thesis', ThesisSchema);