import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { User } from '@/lib/models/Users';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    await connectDatabase();
    const { email, password } = await req.json();

    // หา user ตาม email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Email not found' }, { status: 404 });
    }

    // ตรวจสอบ password
    // console.log("Password : ", password);
    // console.log("User Password : ", user.password);
    // const isMatch = await password === user.password;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
    }

    // (ขั้นต่อไปอาจสร้าง JWT token แต่ตอนนี้ตอบกลับง่ายๆ ก่อน)
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        user_id: user.user_id,
      },
    }) 
    // return NextResponse.redirect("/");
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}