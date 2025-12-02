import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Thesis } from '@/lib/models/Thesis';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDatabase();
    const { id } = await params;

    const thesis = await Thesis.findById(id);
    if (!thesis || !thesis.file_path) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    // Determine the absolute path
    // Assuming file_path is stored as absolute path or relative to project root
    // If it's stored as "/uploads/..." and the actual file is in "public/uploads/..." or just "/uploads/..." on disk
    
    let filePath = thesis.file_path;
    
    // Security check: ensure file is within allowed directories if needed
    // For now, we assume the path stored in DB is correct and safe-ish (internal app)

    // 1. Try absolute path (if stored as absolute)
    if (fs.existsSync(filePath)) {
        // It exists as is
    } else {
        // 2. Try relative to process.cwd() (e.g. /uploads/file.pdf -> /User/project/uploads/file.pdf)
        // Remove leading slash if present to ensure path.join works correctly as relative
        const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        const projectPath = path.join(process.cwd(), relativePath);
        
        if (fs.existsSync(projectPath)) {
            filePath = projectPath;
        } else {
            // 3. Try public folder (legacy/alternative)
            const publicPath = path.join(process.cwd(), 'public', filePath);
            if (fs.existsSync(publicPath)) {
                filePath = publicPath;
            } else {
                 console.error(`File not found at: ${filePath}, ${projectPath}, or ${publicPath}`);
                 return NextResponse.json({ success: false, error: 'File does not exist on server' }, { status: 404 });
            }
        }
    }

    const fileBuffer = fs.readFileSync(filePath);
    const stat = fs.statSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': stat.size.toString(),
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
      },
    });

  } catch (error) {
    console.error("File API Error:", error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
