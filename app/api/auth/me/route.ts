// app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; 
import jwt from 'jsonwebtoken';
import { connectDatabase } from '@/lib/databaseconnect';
import { User } from '@/lib/models/Users';


interface TokenPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export async function GET() {
  try {
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    await connectDatabase();
    const user = await User.findById(decoded.id)
      .select('-password');

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        user_id: user.user_id 
      },
    });

  } catch (error: any) {
    console.error('API /me Error:', error.name, error.message);
    
    // ถ้า jwt.verify ล้มเหลว 
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }    
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}