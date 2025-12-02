// app/api/users/advisors/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { User } from '@/lib/models/Users'; 


export async function GET() {
  try {
    await connectDatabase();

    const advisors = await User.find({ role: 'advisor' })
      .select('firstName lastName _id') 
      .sort({ firstName: 1 }); 

    return NextResponse.json({ success: true, advisors: advisors });

  } catch (error: any) {
    console.error('Failed to fetch advisors:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}