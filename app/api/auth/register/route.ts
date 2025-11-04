import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { User } from '@/lib/models/Users';

export async function POST(req: Request) {
  try {
    await connectDatabase();
    const body = await req.json();
    console.log(body);

    // หา user ตาม email
    const checkEmail = await User.exists({ email: body.email });

    if (checkEmail) {
      return NextResponse.json({ success: false, message: 'Email already exists.' }, { status: 409 });
    } 
    
    if (body.password != body.confirmPassword) {
      return NextResponse.json({ success: false, message: "Password and confirm password is not match."})
    }

    const newUser = await User.create(body);

    return NextResponse.json({
      success: true,
      message: 'Register successful',
      newUser
    }) 
    // return NextResponse.redirect("/");
  } catch (error: any) {
    console.log('Register error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}