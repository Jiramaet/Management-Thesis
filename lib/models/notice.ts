import mongoose, { Schema, model, Document } from 'mongoose';

interface INotice extends Document {
  notice_id?: number;
  user_id: number;
  notice_obj_id: number;
}

const NoticeSchema = new Schema<INotice>({
  notice_id: { type: Number, required: true, unique: true },
  user_id: { type: Number, required: true },
  notice_obj_id: { type: Number, required: true },
});

export const notice = mongoose.models.notice || mongoose.model('notice', NoticeSchema)
