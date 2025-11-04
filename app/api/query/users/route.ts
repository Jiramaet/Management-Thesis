import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { User } from '@/lib/models/Users';

// [GET] /api/users
export async function GET() {
    try {
        await connectDatabase();
        const users = await User.find();

        return NextResponse.json(users, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { message: 'Failed to fetch users', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        await connectDatabase();
        const body = await request.json();
        const newUser = await User.create(body);
        return NextResponse.json(newUser, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}
