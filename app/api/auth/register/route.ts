// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { User } from '@/lib/models/Users';
import bcrypt from 'bcrypt'; 

export async function POST(req: Request) {
  try {
    await connectDatabase();
    const body = await req.json();

    if (body.role === 'advisor') {
      const secret = process.env.ADVISOR_SECRET;
      if (body.advisorCode !== secret) {
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid Advisor Secret Code. You are not authorized.' 
        }, { status: 403 });
      }
    }

    const userIdToSave = body.role === 'student' ? body.user_id : body.email;

    if (!userIdToSave) {
      return NextResponse.json({ success: false, message: 'User ID or Email is required.' }, { status: 400 });
    }
 
    const checkEmail = await User.exists({ email: body.email });
    if (checkEmail) {
      return NextResponse.json({ success: false, message: 'Email already exists.' }, { status: 409 });
    }

    const checkUserId = await User.exists({ user_id: userIdToSave });
    if (checkUserId) {
      return NextResponse.json({ success: false, message: 'User ID or Email already registered.' }, { status: 409 });
    }
    
    if (body.password !== body.confirmPassword) {
      return NextResponse.json({ success: false, message: "Password and confirm password do not match."})
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);
    

    const newUser = await User.create({
      user_id: userIdToSave, 
      firstName: body.firstName, 
      lastName: body.lastName,   
      email: body.email,
      role: body.role,
      password: hashedPassword, 
      department: body.department,
      bio: body.bio 
    });

    return NextResponse.json({
      success: true,
      message: 'Register successful',
      newUser
    }) 

  } catch (error: any) {
    console.log('Register error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}