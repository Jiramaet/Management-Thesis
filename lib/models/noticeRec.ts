import mongoose, { Schema, model, Document } from 'mongoose';

interface INoticeReceiver extends Document {
  receiver_id: number;
  user_id: number;
  notice_id: number;
}

const NoticeReceiverSchema = new Schema<INoticeReceiver>({
  receiver_id: { type: Number, required: true },
  user_id: { type: Number, required: true },
  notice_id: { type: Number, required: true },
});

export const NoticeReceiver = mongoose.models.NoticeReceiver || mongoose.model('NoticeReceiver', NoticeReceiverSchema);
