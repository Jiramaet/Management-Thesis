//api/profile/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { User } from '@/lib/models/Users';

export async function PUT(request: Request) {
    try{
        await connectDatabase();

        // รับข้อมูลจาก profile
        const body = await request.json();

        // 
        const { id, firstname, lastname, email ,department, user_id } = body;

        if(!id){
            return NextResponse.json({ success: false, message: 'User ID is required.' }, { status: 400 });
        }

        // คนหา user จาก id และ อัพเดทข้อมูล
        const updatedUser = await User.findByIdAndUpdate(id, {
            firstName : firstname,
            lastName : lastname,
            email : email,
            department : department,
            user_id : user_id
        }, { new: true });

        if(!updatedUser){
            return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
        }

        // ส่ง response กลับไป
        return NextResponse.json({
            success: true,
            message : 'Profile updated successfully',
            user : {
                id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                department: updatedUser.department,
                user_id: updatedUser.user_id
            }
        })

    }catch (error: any) {
        console.log('Profile update error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}