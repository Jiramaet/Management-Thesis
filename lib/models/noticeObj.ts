import mongoose, { Schema, model, Document } from 'mongoose';

interface INoticeObject extends Document {
  notice_obj_id?: number;
  notice_type: string;
  content: string;
}

const NoticeObjectSchema = new Schema<INoticeObject>({
  notice_obj_id: { type: Number, required: true, unique: true },
  notice_type: { type: String, required: true },
  content: { type: String, required: true },
});

export const NoticeObject = mongoose.models.NoticeObject || mongoose.model('NoticeObject', NoticeObjectSchema);
