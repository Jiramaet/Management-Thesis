import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Meeting } from '@/lib/models/Meeting';
import { Thesis } from '@/lib/models/Thesis';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  role: string;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    await connectDatabase();

    let query: any = {
      date: { $gte: new Date() }, // Future meetings only
      status: { $ne: 'cancelled' }
    };

    if (decoded.role === 'student') {
      // Find student's thesis first
      const myThesis = await Thesis.findOne({ author: decoded.id });
      if (!myThesis) {
         return NextResponse.json({ success: true, meetings: [] });
      }
      query.thesis = myThesis._id;

    } else if (decoded.role === 'advisor') {
      // Find all theses advised by this advisor
      const advisedTheses = await Thesis.find({ advisor: decoded.id }).select('_id');
      const thesisIds = advisedTheses.map(t => t._id);
      
      query.thesis = { $in: thesisIds };
    }

    const meetings = await Meeting.find(query)
      .sort({ date: 1 }) // Nearest first
      .limit(5)
      .populate('thesis', 'title') // Get thesis title to show context
      .lean();

    return NextResponse.json({ success: true, meetings });

  } catch (error: any) {
    console.error('Get Upcoming Meetings Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
