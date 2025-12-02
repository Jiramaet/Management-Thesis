// app/api/reports/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { User } from '@/lib/models/Users';
import { Thesis } from '@/lib/models/Thesis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDatabase();

    // Count documents
    const total = await Thesis.countDocuments();
    const approved = await Thesis.countDocuments({ status: 'approved' });
    const pending = await Thesis.countDocuments({ status: 'pending' });
    const rejected = await Thesis.countDocuments({ status: 'rejected' });
    
    const usersCount = await User.countDocuments();

    return NextResponse.json({ 
      success: true, 
      stats: { total, approved, pending, rejected, usersCount } 
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}