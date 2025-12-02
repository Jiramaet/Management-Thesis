import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Meeting } from '@/lib/models/Meeting';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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

    const meetings = await Meeting.find({ thesis: id })
      .populate('organizer', 'firstName lastName role')
      .sort({ date: -1 });

    return NextResponse.json({ success: true, meetings });

  } catch (error: any) {
    console.error('Get Meetings Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST: Create Meeting
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDatabase();
    const { id } = await params;
    const body = await req.json();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Create Meeting
    const meeting = await Meeting.create({
        thesis: id,
        organizer: decoded.id,
        date: body.date,
        title: body.title,
        notes: body.notes,
        url: body.url, // New field
        status: 'scheduled'
    });

    // Populate organizer for immediate UI update
    await meeting.populate('organizer', 'firstName lastName');

    return NextResponse.json({ success: true, meeting });

  } catch (error: any) {
    console.error('Create Meeting Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// PUT: Update Meeting
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDatabase();
    const body = await req.json();
    const { meetingId, ...updateData } = body;

    if (!meetingId) return NextResponse.json({ success: false, error: 'Meeting ID required' }, { status: 400 });

    const meeting = await Meeting.findByIdAndUpdate(meetingId, updateData, { new: true }).populate('organizer', 'firstName lastName');
    
    if (!meeting) return NextResponse.json({ success: false, error: 'Meeting not found' }, { status: 404 });

    return NextResponse.json({ success: true, meeting });

  } catch (error: any) {
    console.error('Update Meeting Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// DELETE: Delete Meeting
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDatabase();
    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');

    if (!meetingId) return NextResponse.json({ success: false, error: 'Meeting ID required' }, { status: 400 });

    await Meeting.findByIdAndDelete(meetingId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete Meeting Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
