// app/api/thesis/[id]/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Thesis } from '@/lib/models/Thesis';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

interface TokenPayload {
  id: string;
  role: string;
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {

    const { id } = await params; 

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    const userId = decoded.id; 

    await connectDatabase();

    const thesis = await Thesis.findById(id);

    if (!thesis) {
      return NextResponse.json({ success: false, error: 'Thesis not found' }, { status: 404 });
    }

    if (thesis.author.toString() !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden: You are not the owner of this thesis' }, { status: 403 });
    }

    try {
        const fileName = thesis.file_path.split('/').pop(); 
        if (fileName) {
            const filePath = path.join(process.cwd(), 'uploads', fileName);
            await fs.unlink(filePath); 
        }
    } catch (err) {
        console.error("Failed to delete file:", err);
    }

    await Thesis.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Deleted successfully' });

  } catch (error: any) {
    console.error('Delete Thesis Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}