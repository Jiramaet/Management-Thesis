import mongoose, { Schema, model, Document } from 'mongoose';

interface IComment extends Document {
  comment_id?: number;
  user_id: number;
  thesis_id: number;
  content: string;
}

const commentSchema = new Schema<IComment>({
  comment_id: { type: Number, required: true },
  user_id: { type: Number, required: true },
  thesis_id: { type: Number, required: true },
  content: { type: String, required: true },
});

export const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema)
