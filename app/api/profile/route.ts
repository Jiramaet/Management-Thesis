// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { User } from '@/lib/models/Users';
import { cookies } from 'next/headers'; 
import jwt from 'jsonwebtoken';     
import { Thesis } from '@/lib/models/Thesis';
import { Comment } from '@/lib/models/comment';

interface TokenPayload {
  id: string;
  role: string;
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    const userId = decoded.id;

    await connectDatabase();

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let stats = {
      stat1: 0, 
      stat2: 0, 
      stat3: 0  
    };

    if (user.role === 'student') {
      // 1. Submissions: Total theses authored
      const submissions = await Thesis.countDocuments({ author: userId });
      
      // 2. Approved: Theses with 'approved' status
      const approved = await Thesis.countDocuments({ author: userId, status: 'approved' });
      
      // 3. Feedback: Total comments received on their theses
      const myTheses = await Thesis.find({ author: userId }).select('_id');
      const thesisIds = myTheses.map((t: any) => t._id);
      const feedback = await Comment.countDocuments({ thesis: { $in: thesisIds } });

      stats = { stat1: submissions, stat2: approved, stat3: feedback };

    } else if (user.role === 'advisor') {
      // 1. Students: Count of unique students supervised
      const distinctStudents = await Thesis.distinct('author', { advisor: userId });
      const studentsCount = distinctStudents.length;

      // 2. Completed: Theses supervised with 'approved' status
      const completed = await Thesis.countDocuments({ advisor: userId, status: 'approved' });

      // 3. Feedback: Comments made by the advisor in the current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const feedbackMonth = await Comment.countDocuments({ 
        user: userId, 
        createdAt: { $gte: startOfMonth } 
      });

      stats = { stat1: studentsCount, stat2: completed, stat3: feedbackMonth };
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
        user_id: user.user_id,
        bio: user.bio,
      },
      stats
    });

  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    const secureUserId = decoded.id; 
   

    await connectDatabase();
    
   
    const body = await req.json();
    const { firstname, lastname, email, department, user_id, bio } = body;

    
    const updatedUser = await User.findByIdAndUpdate(
      secureUserId, 
      {
        firstName: firstname,
        lastName: lastname,
        email: email,
        department: department,
        user_id: user_id, 
        bio: bio
      },
      { new: true } 
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        firstname: updatedUser.firstName,
        lastname: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        user_id: updatedUser.user_id
      },
    });

  } catch (error: any) {
    console.error('Profile update error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}