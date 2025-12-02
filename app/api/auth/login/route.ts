// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { User } from '@/lib/models/Users';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie'; 

export async function POST(req: Request) { 
  try {
    await connectDatabase();   
    const body = await req.json(); 
    const { email, password } = body;

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department,
        firstName: user.firstName,
        lastName: user.lastName,
        user_id: user.user_id,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    const serialized = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, 
      path: '/',
    });

    return new Response(
      JSON.stringify({ success: true, message: "Login successful" }), 
      {
        status: 200,
        headers: { 'Set-Cookie': serialized },
      }
    );

  } catch (error: any) {
    console.error("Login POST Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}