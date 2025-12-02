// app/api/thesis/[id]/comments/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Comment } from '@/lib/models/comment';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Notification } from '@/lib/models/Notification';
import { Thesis } from '@/lib/models/Thesis'; //

interface TokenPayload {
  id: string;
  role: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    await connectDatabase();
    const { id } = await params;

    const comments = await Comment.find({ thesis: id })
      .populate('user', 'firstName lastName role') 
      .sort({ createdAt: 1 }); 

    // Mark as read for comments NOT by current user
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
            await Comment.updateMany(
                { thesis: id, user: { $ne: decoded.id }, isRead: false },
                { isRead: true }
            );
        } catch (e) { /* ignore token error in GET */ }
    }

    return NextResponse.json({ success: true, comments });

  } catch (error: any) {
    console.error('Get Comments Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    const userId = decoded.id;

    await connectDatabase();
    const { id } = await params; 
    const { content } = await req.json(); 

    if (!content) {
        return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    const newComment = await Comment.create({
      user: userId,
      thesis: id,
      content: content
    });

    const thesisData = await Thesis.findById(id);

    if (thesisData) {
        if (decoded.role === 'advisor') {
            await Notification.create({
                recipient: thesisData.author, 
                title: "New Comment from Advisor",
                message: `Advisor commented: "${content.substring(0, 50)}..."`,
                link: `/dashboard/thesis/${id}#feedback`,
                type: "info"
            });
        }

        else if (decoded.role === 'student') {
             await Notification.create({
                recipient: thesisData.advisor, 
                title: "New Comment from Student",
                message: `Student commented: "${content.substring(0, 50)}..."`,
                link: `/dashboard/thesis/${id}#feedback`,
                type: "info"
            });
        }
    }

    return NextResponse.json({ success: true, comment: newComment });

  } catch (error: any) {
    console.error('Post Comment Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}