// app/api/thesis/[id]/review/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Thesis } from '@/lib/models/Thesis';
import { Notification } from '@/lib/models/Notification';
import { ActivityLog } from '@/lib/models/ActivityLog';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  role: string;
}

export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDatabase();
    const { id } = await params;
    const body = await req.json();
    console.log("Review Update Body:", body);

    // 1. ตรวจสอบ Token & Role
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    if (decoded.role !== 'advisor') {
        return NextResponse.json({ success: false, error: 'Only advisors can review theses' }, { status: 403 });
    }

    // 2. ตรวจสอบความเป็นเจ้าของ
    const thesis = await Thesis.findById(id);
    if (!thesis) return NextResponse.json({ success: false, error: 'Thesis not found' }, { status: 404 });

    if (thesis.advisor.toString() !== decoded.id) {
        return NextResponse.json({ success: false, error: 'You are not the advisor of this thesis' }, { status: 403 });
    }

    // 3. เตรียมข้อมูลอัปเดต (แยกเคสกันชัดเจน)
    const updateData: any = {};
    
    // --- CASE A: อัปเดตสถานะ (Approve / Reject) ---
    if (body.status) {
        if (!['approved', 'rejected', 'pending'].includes(body.status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }
        updateData.status = body.status;
        
        // Log Activity
        await ActivityLog.create({
            thesis: id,
            user: decoded.id,
            action: 'status_change',
            details: `Changed status to ${body.status}`
        });

        // (แจ้งเตือนเรื่องสถานะ)
        const notiMessage = body.status === 'approved' 
            ? "Congratulations! Your thesis has been approved." 
            : "Your thesis status has been updated.";
        
        const notiType = body.status === 'approved' ? 'success' : 'warning';

        await Notification.create({
            recipient: thesis.author,
            title: `Thesis ${body.status === 'approved' ? 'Approved' : 'Updated'}`,
            message: notiMessage,
            link: `/dashboard/thesis/${id}`,
            type: notiType
        });
    }

    // --- CASE B: อัปเดตรายบท (Chapter Checkbox) ---
    if (body.chapterApproval) {
        updateData.chapterApproval = body.chapterApproval;
        
        // Log Activity
        await ActivityLog.create({
            thesis: id,
            user: decoded.id,
            action: 'chapter_update',
            details: `Updated chapter approval status`
        });

        // (แจ้งเตือนเรื่องความคืบหน้า)
        try {
            const passedChapters = Object.entries(body.chapterApproval)
                .filter(([_, passed]) => passed)
                .map(([key, _]) => key.replace('chapter', 'Chapter '))
                .join(', ');

            if (passedChapters) {
                await Notification.create({
                    recipient: thesis.author,
                    title: "Thesis Progress Updated",
                    message: `Advisor has updated your progress. Passed: ${passedChapters}`,
                    link: `/dashboard/thesis/${id}`,
                    type: "success"
                });
            }
        } catch (err) {
            console.error("Notification Error:", err);
        }
    }

    // --- CASE C: Similarity Score ---
    if (body.similarityScore !== undefined) {
        updateData.similarityScore = body.similarityScore;
        await ActivityLog.create({
            thesis: id,
            user: decoded.id,
            action: 'score_update',
            details: `Updated similarity score to ${body.similarityScore}%`
        });
    }

    // --- CASE D: Private Notes ---
    if (body.privateNotes !== undefined) {
        updateData.privateNotes = body.privateNotes;
        // No activity log needed for private notes (or maybe yes, but keep it private)
    }

    // --- CASE E: Public Status ---
    if (body.isPublic !== undefined) {
        updateData.isPublic = body.isPublic;
        await ActivityLog.create({
            thesis: id,
            user: decoded.id,
            action: 'public_update',
            details: body.isPublic ? 'Made thesis public' : 'Made thesis private'
        });
    }
    
    // 4. บันทึกการเปลี่ยนแปลง
    console.log("Update Data Payload:", updateData); // LOG PAYLOAD

    const updatedThesis = await Thesis.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
    );
    
    console.log("Updated Thesis Result:", updatedThesis); // LOG RESULT

    return NextResponse.json({ success: true, thesis: updatedThesis });

  } catch (error: any) {
    console.error('Review Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}