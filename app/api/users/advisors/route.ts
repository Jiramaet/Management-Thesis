// app/api/users/advisors/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { User } from '@/lib/models/Users'; // (Import Model User)

// นี่คือ GET (การดึงข้อมูล)
export async function GET() {
  try {
    await connectDatabase();

    // 1. ค้นหา User ทั้งหมดที่มี role 'advisor'
    const advisors = await User.find({ role: 'advisor' })
      .select('firstName lastName _id') // (เลือกเฉพาะ field ที่เราต้องการ)
      .sort({ firstName: 1 }); // (เรียงตามชื่อ A-Z)

    // 2. ส่งรายชื่อกลับไปให้ Frontend
    return NextResponse.json({ success: true, advisors: advisors });

  } catch (error: any) {
    console.error('Failed to fetch advisors:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}