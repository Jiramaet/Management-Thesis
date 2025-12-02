// app/api/thesis/me/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import  Jwt  from 'jsonwebtoken';
import { connectDatabase } from '@/lib/databaseconnect';
import { Thesis } from '@/lib/models/Thesis';
import { User } from '@/lib/models/Users';

interface TokenPayload  {
    id: string;
}

export async function GET() {
    try{
        //check for token in cookies
        const cookieStore = await cookies(); 
        const token = cookieStore.get('token')?.value;
        if(!token){
            return NextResponse.json({ success: false, error: 'Unauthorized'}, { status: 401 });
        }

        const decoded = Jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
        const secreUserId = decoded.id;

        await connectDatabase();

        const theses = await Thesis.find({ author : secreUserId })
        .populate('advisor', 'firstName lastName') 
        .sort({ createdAt: -1 }); 
        return NextResponse.json({ success: true, theses: theses }, { status: 200 });
        
    } catch (error : any) {
        console.error('API /mythesis error:', error.name, error.message);
        if(error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return NextResponse.json({ success : false, error: 'Invalid or expired token' }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
