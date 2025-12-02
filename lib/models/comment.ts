// lib/models/comment.ts
import mongoose, { Schema, model, Document, Types } from 'mongoose';
interface IComment extends Document {
  user: Types.ObjectId;   
  thesis: Types.ObjectId; 
  content: string;        
  isRead: boolean;
  createdAt: Date; 
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  thesis: { type: Schema.Types.ObjectId, ref: 'Thesis', required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { 
  timestamps: true 
});

export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema);