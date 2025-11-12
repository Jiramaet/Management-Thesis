// // lib/models/Thesis.ts
import mongoose, { Schema, model, Document, Types } from 'mongoose';

interface IThesis extends Document {
  thesis_id: string;      // (แก้เป็น String สำหรับ 'TH001')
  title: string;
  abstract: string;     // (เพิ่มที่ขาดไป)
  author: Types.ObjectId; // (แก้จาก user_id เป็น 'author' และลิงก์ไปที่ 'User')
  advisor: Types.ObjectId;// (เพิ่ม 'advisor' และลิงก์ไปที่ 'User')
  
  file_path: string;    // (แก้จาก 'file' เป็น 'file_path')
  status: string;
  isPublic: boolean;    // (เพิ่มที่ขาดไป)
  
  keywords?: string;    // (เพิ่ม field ที่มีในฟอร์ม)
  category?: string;    // (เพิ่ม field ที่มีในฟอร์ม)
  year?: string;        // (เพิ่ม field ที่มีในฟอร์ม)
  department?: string;  // (เพิ่ม field ที่มีในฟอร์ม)
  
  createdAt: Date;
  updatedAt: Date;
}

const ThesisSchema = new Schema<IThesis>({
  thesis_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  abstract: { type: String, required: true },
  
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  advisor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  file_path: { type: String, required: true },
  status: { type: String, required: true, default: 'pending' },
  isPublic: { type: Boolean, default: false },

  keywords: { type: String },
  category: { type: String },
  year: { type: String },
  department: { type: String },
  
}, { timestamps: true }); // (timestamps: true จะสร้าง createdAt และ updatedAt ให้อัตโนมัติ)

export const Thesis = mongoose.models.Thesis || mongoose.model<IThesis>('Thesis', ThesisSchema);