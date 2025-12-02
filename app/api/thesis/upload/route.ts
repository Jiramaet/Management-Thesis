// // app/api/thesis/upload/route.ts
// import { NextResponse } from 'next/server';
// import { connectDatabase } from '@/lib/databaseconnect';
// import { Thesis } from '@/lib/models/Thesis';
// import path from 'path';
// import fs from 'fs/promises'; 
// import { cookies } from 'next/headers'; 
// import jwt from 'jsonwebtoken';       
// interface TokenPayload {
//   id: string;
//   role: string;
// }


// const uploadDir = path.join(process.cwd(), 'uploads');
// async function saveFile(file: File) {
//   try {
//     await fs.mkdir(uploadDir, { recursive: true });
//   } catch (e) {
//     console.error("Failed to create upload dir", e);
//     throw new Error("Failed to create storage directory.");
//   }
//   const buffer = Buffer.from(await file.arrayBuffer());
//   const ext = path.extname(file.name);
//   const filename = `${Date.now()}-${file.name.replace(ext, "")}${ext}`;
//   const filePath = path.join(uploadDir, filename);
//   await fs.writeFile(filePath, buffer);
//   return `/uploads/${filename}`;
// }


// export async function POST(req: Request) {
//   try {

//     const cookieStore = await cookies();
//     const token = cookieStore.get('token')?.value;

//     if (!token) {
//       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
//     const secureAuthorId = decoded.id; 

//     await connectDatabase();

//     const data = await req.formData();
//     const file: File | null = data.get('file') as unknown as File;

//     const advisor = data.get('advisor') as string;
//     const title = data.get('title') as string;
//     const abstract = data.get('abstract') as string;
//     const keywords = data.get('keywords') as string;
//     const category = data.get('category') as string;
//     const year = data.get('year') as string;
//     const department = data.get('department') as string;

//     if (!file) {

//       return NextResponse.json({ success: false, error: "File is required." }, { status: 400 });
//     }
//     if (!advisor || !title || !abstract) {
//       return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
//     }
//     if (file.type !== 'application/pdf' && file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
//       return NextResponse.json({ success: false, error: "Only .pdf or .docx files are allowed" }, { status: 400 });
//     }

//     const filePath = await saveFile(file);

//     const lastThesis = await Thesis.findOne().sort({ createdAt: -1 }); 
//     let nextIdNumber = 1;
//     if (lastThesis && lastThesis.thesis_id) {
//       const lastNum = parseInt(lastThesis.thesis_id.replace("TH", ""), 10);
//       if (!isNaN(lastNum)) {
//         nextIdNumber = lastNum + 1;
//       }
//     }
//     const newThesisId = `TH${String(nextIdNumber).padStart(3, '0')}`;

//     const thesis = await Thesis.create({
//       thesis_id: newThesisId, 
//       title: title,
//       abstract: abstract,
//       author: secureAuthorId, 
//       advisor: advisor,
//       file_path: filePath, 
//       status: 'pending',
//       isPublic: false,
//       keywords: keywords,
//       category: category,
//       year: year,
//       department: department,
//     });

//     return NextResponse.json({ success: true, thesis: thesis }, { status: 201 });

//   } catch (error: any) {
//     console.error('Upload error:', error);
//     if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
//       return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
//     }
//     return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
//   }
// }

// app/api/thesis/upload/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Thesis } from '@/lib/models/Thesis';
import path from 'path';
import fs from 'fs/promises';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  role: string;
}

const uploadDir = path.join(process.cwd(), 'uploads');
async function saveFile(file: File) {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (e) {
    console.error("Failed to create upload dir", e);
    throw new Error("Failed to create storage directory.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name);
  const filename = `${Date.now()}-${file.name.replace(ext, "")}${ext}`;
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);
  return `/uploads/${filename}`;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    const secureAuthorId = decoded.id;

    await connectDatabase();

    const data = await req.formData();
    console.log("Upload request received. Keys:", Array.from(data.keys()));
    
    const file: File | null = data.get('file') as unknown as File;

    // Optional fields for update
    const thesisId = data.get('thesisId') as string;
    const chapterNumber = data.get('chapterNumber') as string;
    const description = data.get('description') as string;
    
    console.log("Backend received description:", description);

    // Required fields for new thesis
    const advisor = data.get('advisor') as string;
    const title = data.get('title') as string;
    const abstract = data.get('abstract') as string;
    const keywords = data.get('keywords') as string;
    const category = data.get('category') as string;
    const year = data.get('year') as string;
    const department = data.get('department') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: "File is required." }, { status: 400 });
    }

    const filePath = await saveFile(file);

    // --- CASE 1: UPDATE EXISTING THESIS (APPEND CHAPTER) ---
    if (thesisId) {
      const thesis = await Thesis.findById(thesisId);
      if (!thesis) {
        return NextResponse.json({ success: false, error: "Thesis not found." }, { status: 404 });
      }
      if (thesis.author.toString() !== secureAuthorId) {
        return NextResponse.json({ success: false, error: "Unauthorized to update this thesis." }, { status: 403 });
      }

      // Prepare chapter object
      let parsedChapterNumber = 0;
      if (chapterNumber === 'full') {
        parsedChapterNumber = 0; // 0 represents Full Thesis
      } else {
        parsedChapterNumber = parseInt(chapterNumber || "1", 10);
      }

      const newChapter = {
        chapterNumber: parsedChapterNumber,
        title: chapterNumber === 'full' ? "Full Thesis" : `Chapter ${chapterNumber || "1"}`,
        file_path: filePath,
        uploadedAt: new Date(),
        description: description || ""
      };

      // Ensure chapters array exists (for legacy documents)
      if (!thesis.chapters) {
        thesis.chapters = [];
      }

      // Check if chapter already exists, replace it if so, otherwise push
      const existingChapterIndex = thesis.chapters.findIndex((c: any) => c.chapterNumber === newChapter.chapterNumber);

      if (existingChapterIndex > -1) {
        thesis.chapters[existingChapterIndex] = newChapter;
      } else {
        thesis.chapters.push(newChapter);
      }

      // Update main file_path to the latest uploaded file (optional, but good for "Download PDF" button)
      thesis.file_path = filePath;

      await thesis.save();

      return NextResponse.json({ success: true, thesis: thesis, message: "Chapter updated successfully" }, { status: 200 });
    }

    // --- CASE 2: CREATE NEW THESIS ---
    if (!advisor || !title || !abstract) {
      return NextResponse.json({ success: false, error: "Missing required fields for new thesis." }, { status: 400 });
    }

    // --- Logic ตรวจสอบว่ามี Thesis ชื่อนี้อยู่แล้วหรือไม่ (เพื่อทำ Versioning) ---
    const existingThesis = await Thesis.findOne({
      author: secureAuthorId,
      title: title
    }).sort({ version: -1 }); // เอาเวอร์ชันล่าสุด

    let finalThesisId = "";
    let finalVersion = 1;

    if (existingThesis) {
      // กรณีมีอยู่แล้ว -> ใช้ ID เดิม, เพิ่ม Version
      finalThesisId = existingThesis.thesis_id;
      finalVersion = existingThesis.version + 1;
    } else {
      // กรณีไม่มี -> สร้าง ID ใหม่ (THxxx)
      const lastThesisAnyUser = await Thesis.findOne({}).sort({ createdAt: -1 });
      let nextIdNumber = 1;
      if (lastThesisAnyUser && lastThesisAnyUser.thesis_id) {
        const match = lastThesisAnyUser.thesis_id.match(/\d+/);
        if (match) {
          nextIdNumber = parseInt(match[0], 10);
          nextIdNumber += 1;
        }
      }
      finalThesisId = `TH${String(nextIdNumber).padStart(3, '0')}`;
      finalVersion = 1;
    }
    // --------------------------------

    // Initialize chapters with the first file
    const initialChapter = {
      chapterNumber: 1, // Default to Chapter 1 for new uploads
      title: "Full Thesis / Chapter 1",
      file_path: filePath,
      uploadedAt: new Date(),
      description: description || "" // Use the extracted description
    };

    console.log("Creating new thesis:", { finalThesisId, title, author: secureAuthorId });

    const thesis = await Thesis.create({
      thesis_id: finalThesisId,
      title: title,
      abstract: abstract,
      author: secureAuthorId,
      advisor: advisor,
      file_path: filePath,
      status: 'pending',
      isPublic: false,
      keywords: keywords,
      category: category,
      year: year,
      department: department,
      version: finalVersion,
      chapters: [initialChapter] // Add chapters
    });

    console.log("Thesis created successfully:", thesis._id);

    return NextResponse.json({ success: true, thesis: thesis }, { status: 201 });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}