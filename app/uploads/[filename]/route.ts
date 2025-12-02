import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDatabase } from '@/lib/databaseconnect';
import { Thesis } from '@/lib/models/Thesis';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // 1. Security Check (Optional but recommended): Verify Token
    // If you want files to be public, remove this block.
    // If you want only logged-in users to download, keep it.
    /*
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    try {
        jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
        return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    */

    // 2. Locate the file
    const uploadDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadDir, filename);

    // 3. Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    // 3.5 Increment Download Count
    try {
      await connectDatabase();
      // Try to find thesis by file_path (exact match or ending with filename)
      // Note: This is a best-effort match since we only have the filename here
      await Thesis.findOneAndUpdate(
        { 
          $or: [
            { file_path: { $regex: filename + '$' } },
            { 'chapters.file_path': { $regex: filename + '$' } }
          ]
        },
        { $inc: { downloadCount: 1 } }
      );
    } catch (dbError) {
      console.error('Failed to update download count:', dbError);
      // Don't block download if DB update fails
    }

    // 4. Read file (Streaming)
    // Using a stream is more memory efficient and standard for file downloads
    const fileStream = await fs.open(filePath, 'r');
    const stat = await fileStream.stat();
    
    // Create a ReadableStream from the file handle
    // We need to convert the Node.js stream to a Web Stream for NextResponse
    const stream = new ReadableStream({
      async start(controller) {
        const buffer = Buffer.alloc(64 * 1024); // 64KB buffer
        try {
          let bytesRead = 0;
          while (true) {
            const { bytesRead: n, buffer: buf } = await fileStream.read(buffer, 0, buffer.length, null);
            if (n === 0) {
              break;
            }
            controller.enqueue(new Uint8Array(buf.buffer, buf.byteOffset, n));
            bytesRead += n;
          }
          controller.close();
          await fileStream.close();
        } catch (err) {
          console.error('Stream error:', err);
          controller.error(err);
          await fileStream.close();
        }
      }
    });

    // 5. Determine Content-Type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.doc') contentType = 'application/msword';
    else if (ext === '.zip') contentType = 'application/zip';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    console.log(`Serving file: ${filename}, Size: ${stat.size}, Type: ${contentType}`);

    // 6. Return response
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': stat.size.toString(),
      },
    });

  } catch (error) {
    console.error('Download error details:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
