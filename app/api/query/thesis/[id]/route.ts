// // app/api/query/thesis/[id]/route.ts
// import { NextResponse } from 'next/server';
// import { connectDatabase } from '@/lib/databaseconnect';
// import { Thesis } from '@/lib/models/Thesis';
// import { User } from '@/lib/models/Users'; 

// export async function GET(request: Request, { params }: { params: { id: string } }) {
//   try {
//     await connectDatabase();
//     // const id = params.id;
//     const { id } = await params;

//     const thesis = await Thesis.findById(id)
//       .populate('author', 'firstName lastName email role department user_id')
//       .populate('advisor', 'firstName lastName email');

//     if (!thesis) {
//       return NextResponse.json({ success: false, error: 'Thesis not found' }, { status: 404 });
//     }

//     return NextResponse.json({ success: true, thesis });

//   } catch (error: any) {
//     console.error('Get Thesis Detail Error:', error);
//     return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
//   }
// }

// app/api/query/thesis/[id]/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Thesis } from '@/lib/models/Thesis';
import { User } from '@/lib/models/Users';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDatabase();
    const { id } = await params;

    // 1. ดึงข้อมูล Thesis ปัจจุบัน
    const thesis = await Thesis.findById(id)
      .populate('author', 'firstName lastName email role department user_id')
      .populate('advisor', 'firstName lastName email');

    if (!thesis) {
      return NextResponse.json({ success: false, error: 'Thesis not found' }, { status: 404 });
    }

    // 2. (เพิ่ม) ค้นหา "Versions" อื่นๆ (Thesis ที่มี thesis_id เดียวกัน)
    // เพื่อเอาไปทำ Dropdown เปลี่ยนเวอร์ชัน
    const versions = await Thesis.find({ thesis_id: thesis.thesis_id })
      .select('thesis_id version createdAt title status') // เลือกเฉพาะ field ที่จำเป็น
      .sort({ version: -1 }); // เรียง ใหม่ -> เก่า

    console.log("Fetched Thesis Data:", { 
        id: thesis._id, 
        score: thesis.similarityScore, 
        notes: thesis.privateNotes 
    }); // LOG FETCHED DATA

    return NextResponse.json({ success: true, thesis, versions });

  } catch (error: any) {
    console.error('Get Thesis Detail Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}