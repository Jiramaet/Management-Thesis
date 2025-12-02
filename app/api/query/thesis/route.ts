// app/api/query/thesis/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Thesis } from '@/lib/models/Thesis';
import { User } from '@/lib/models/Users';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDatabase();

    // 1. ดึงทั้งหมดมา (เรียงใหม่ -> เก่า) เฉพาะที่ Approved แล้ว
    const Theses = await Thesis.find({ status: 'approved' })
      .populate('author', 'firstName lastName')
      .populate('advisor', 'firstName lastName')
      .sort({ createdAt: -1 });

    // 2. กรองเอาเฉพาะ "เวอร์ชันล่าสุด" ของแต่ละ Author (Unique Author)
    // const latestMap = new Map();
    // const filteredTheses = [];

    // for (const thesis of allTheses) {
    //     if (thesis.author && thesis.author._id) {
    //         const authorId = thesis.author._id.toString();
    //         if (!latestMap.has(authorId)) {
    //             latestMap.set(authorId, true);
    //             filteredTheses.push(thesis); // เก็บตัวแรกที่เจอ (ซึ่งคือตัวล่าสุด)
    //         }
    //     }
    // }

    return NextResponse.json({ success: true, theses: Theses });

  } catch (error: any) {
    console.error('Query Thesis Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}