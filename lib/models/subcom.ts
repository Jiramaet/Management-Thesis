import mongoose, { Schema, model, Document } from 'mongoose';

interface IComment extends Document {
  subcomment_id?: number;
  user_id: number;
  comment_id: number;
  content: string;
}

const commentSchema = new Schema<IComment>({
  subcomment_id: { type: Number, required: true },
  user_id: { type: Number, required: true },
  comment_id: { type: Number, required: true },
  content: { type: String, required: true },
});

export const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema)
