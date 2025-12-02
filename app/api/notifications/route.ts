import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Notification } from '@/lib/models/Notification';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface TokenPayload { id: string; }

// 1. ดึงแจ้งเตือนของฉัน
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ success: false }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    await connectDatabase();

    const notifications = await Notification.find({ recipient: decoded.id })
      .sort({ createdAt: -1 }) // ใหม่สุดขึ้นก่อน
      .limit(20); // เอาแค่ 20 อันล่าสุด

    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// 2. กด "อ่านแล้ว"
export async function PUT(req: Request) {
  try {
    const { id } = await req.json(); // รับ ID ของแจ้งเตือน
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ success: false }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    await connectDatabase();
    
    if (id === 'all') {
       // Mark all as read for this user
       await Notification.updateMany({ recipient: decoded.id, isRead: false }, { isRead: true });
    } else {
       await Notification.findByIdAndUpdate(id, { isRead: true });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// 3. ลบแจ้งเตือน
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ success: false }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    await connectDatabase();

    if (id === 'all') {
        // Delete all notifications for this user
        await Notification.deleteMany({ recipient: decoded.id });
    } else {
        // Delete specific notification (ensure ownership)
        await Notification.findOneAndDelete({ _id: id, recipient: decoded.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
      console.error("Delete Notification Error:", error);
      return NextResponse.json({ success: false }, { status: 500 });
  }
}