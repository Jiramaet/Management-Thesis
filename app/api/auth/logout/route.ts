// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { serialize } from 'cookie'; 


export async function POST() {
  try {
  
    const serializedToken = serialize("token", "", { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(0), 
    });

    return new NextResponse(
      JSON.stringify({ success: true, message: "Logged out successfully" }),
      {
        status: 200,
        headers: { 'Set-Cookie': serializedToken },
      }
    );

  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}