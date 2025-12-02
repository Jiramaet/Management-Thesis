import mongoose, { Schema, model, Document, Types } from 'mongoose';

interface INotification extends Document {
  recipient: Types.ObjectId; // ส่งหาใคร
  title: string;             // หัวข้อ
  message: string;           // ข้อความ
  link: string;              // ลิงก์ไปหน้าไหน
  isRead: boolean;           // อ่านหรือยัง
  type: string;              // ประเภท (info, success, warning)
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '#' },
  isRead: { type: Boolean, default: false },
  type: { type: String, default: 'info' },
}, { timestamps: true });

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);