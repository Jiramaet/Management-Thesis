// app/api/thesis/my/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDatabase } from '@/lib/databaseconnect';
import { Thesis } from '@/lib/models/Thesis';
import { User } from '@/lib/models/Users'; // (จำเป็นสำหรับการ populate)

interface TokenPayload {
  id: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    const userId = decoded.id;

    await connectDatabase();

    const allTheses = await Thesis.find({ author: userId })
      .populate('advisor', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Filter เอาเฉพาะ Version ล่าสุดของแต่ละ thesis_id
    const latestThesesMap = new Map();
    allTheses.forEach((t: any) => {
      if (!latestThesesMap.has(t.thesis_id)) {
        latestThesesMap.set(t.thesis_id, t);
      } else {
        const current = latestThesesMap.get(t.thesis_id);
        if (t.version > current.version) {
          latestThesesMap.set(t.thesis_id, t);
        }
      }
    });
    const theses = Array.from(latestThesesMap.values());

    return NextResponse.json({ success: true, theses });

  } catch (error: any) {
    console.error('API /thesis/my Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}