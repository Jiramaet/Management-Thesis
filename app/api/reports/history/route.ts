import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { ReportLog } from '@/lib/models/ReportLog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDatabase();

    const history = await ReportLog.find({})
      .sort({ createdAt: -1 })
      .limit(10); // Get last 10 reports

    return NextResponse.json({ 
      success: true, 
      history 
    });

  } catch (error) {
    console.error("Fetch History Error:", error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
