import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { ActivityLog } from '@/lib/models/ActivityLog';
import { Comment } from '@/lib/models/comment';
import { Thesis } from '@/lib/models/Thesis';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDatabase();
    const { id } = await params;

    // 1. Fetch Activity Logs
    const logs = await ActivityLog.find({ thesis: id })
      .populate('user', 'firstName lastName role')
      .lean();

    // 2. Fetch Comments
    const comments = await Comment.find({ thesis: id })
      .populate('user', 'firstName lastName role')
      .lean();

    // 3. Fetch Thesis Versions (to show when versions were created)
    // Assuming versions are stored as separate Thesis documents with same thesis_id but different version numbers
    // OR if we want to show when THIS thesis was created/updated
    const thesis = await Thesis.findById(id);
    const versions = await Thesis.find({ thesis_id: thesis.thesis_id }).select('version createdAt').lean();

    // 4. Combine and Sort
    const timeline = [
      ...logs.map((l: any) => ({
        id: l._id,
        type: 'activity',
        action: l.action,
        details: l.details,
        user: l.user,
        date: l.createdAt
      })),
      ...comments.map((c: any) => ({
        id: c._id,
        type: 'comment',
        content: c.content,
        user: c.user,
        date: c.createdAt
      })),
      ...versions.map((v: any) => ({
        id: v._id,
        type: 'version',
        version: v.version,
        date: v.createdAt
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ success: true, timeline });

  } catch (error: any) {
    console.error('Timeline API Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
