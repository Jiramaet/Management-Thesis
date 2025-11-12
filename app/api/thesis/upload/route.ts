// // app/api/thesis/upload/route.ts
// import { NextResponse } from 'next/server';
// import { connectDatabase } from '@/lib/databaseconnect';
// import { Thesis } from '@/lib/models/Thesis';
// import multer from 'multer';
// import { createRouter } from 'next-connect'; // (ต้องเป็น createRouter)
// import path from 'path';
// import fs from 'fs';

// // (ส่วน Multer/Storage เหมือนเดิม)
// const uploadDir = path.join(process.cwd(), 'uploads');
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, uploadDir),
//   filename: (_req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const name = `${Date.now()}-${file.originalname.replace(ext, "")}${ext}`;
//     cb(null, name);
//   }
// });

// const upload = multer({
//   storage,
//   fileFilter: (_req, file, cb) => {
//     if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
//       cb(null, true);
//     } else {
//       cb(new Error('Only .pdf or .docx files are allowed'));
//     }
//   }
// });

// // (ใช้ createRouter)
// const handler = createRouter<any, any>({
//   onError(error : any, _req : any, res : any) {
//     return NextResponse.json({ success: false, error: `Upload failed: ${error.message}` }, { status: 500 });
//   },
//   onNoMatch(_req : any, res : any) {
//     return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
//   }
// });


// handler.use(upload.single('file'));

// // (handler.post ต้อง return NextResponse)
// handler.post(async (req: any, res: any) => {
//   await connectDatabase();

//   const { 
//     author, 
//     advisor, 
//     title, 
//     abstract, 
//     keywords, 
//     category, 
//     year, 
//     department 
//   } = req.body;
  
//   if (!req.file) {
//     return NextResponse.json({ success: false, error: "File is required." }, { status: 400 });
//   }
//   if (!author || !advisor || !title || !abstract) {
//     return NextResponse.json({ success: false, error: "Missing required fields (author, advisor, title, abstract)." }, { status: 400 });
//   }

//   const filePath = `/uploads/${req.file.filename}`;

//   const lastThesis = await Thesis.findOne().sort({ createdAt: -1 }); 
//   let nextIdNumber = 1;
//   if (lastThesis && lastThesis.thesis_id) {
//     const lastNum = parseInt(lastThesis.thesis_id.replace("TH", ""), 10);
//     if (!isNaN(lastNum)) {
//       nextIdNumber = lastNum + 1;
//     }
//   }
//   const newThesisId = `TH${String(nextIdNumber).padStart(3, '0')}`;

//   const thesis = await Thesis.create({
//     thesis_id: newThesisId, 
//     title: title,
//     abstract: abstract,
//     author: author,
//     advisor: advisor,
//     file_path: filePath,
//     status: 'pending',
//     isPublic: false,
//     keywords: keywords,
//     category: category,
//     year: year,
//     department: department,
//   });

//   return NextResponse.json({ success: true, thesis: thesis }, { status: 201 });
// });

// // (ใช้ handler.run)
// export const POST = async (req: Request, ctx: any) => {
//   return handler.run(req, ctx);
// };

// app/api/thesis/upload/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Thesis } from '@/lib/models/Thesis';
import path from 'path';
import fs from 'fs/promises'; // (ใช้ fs/promises สำหรับ async/await)

// (Upload directory setup)
const uploadDir = path.join(process.cwd(), 'uploads');

// --- 1. สร้าง Helper function สำหรับ "บันทึกไฟล์" ---
async function saveFile(file: File) {
  // (สร้างโฟลเดอร์ถ้ายังไม่มี)
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (e) {
    console.error("Failed to create upload dir", e);
    throw new Error("Failed to create storage directory.");
  }

  // (อ่านไฟล์เป็น buffer)
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name);
  const filename = `${Date.now()}-${file.name.replace(ext, "")}${ext}`;
  const filePath = path.join(uploadDir, filename);

  // (เขียนไฟล์ลง disk)
  await fs.writeFile(filePath, buffer);
  return `/uploads/${filename}`; // (ส่ง Path ที่จะเก็บใน DB กลับไป)
}
// ---------------------------------------------

// --- 2. นี่คือ POST Handler (ตัวใหม่) ---
export async function POST(req: Request) {
  try {
    await connectDatabase();

    // 1. อ่าน FormData (นี่คือวิธีของ App Router)
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    
    // 2. ดึงข้อมูล Text fields
    const author = data.get('author') as string;
    const advisor = data.get('advisor') as string;
    const title = data.get('title') as string;
    const abstract = data.get('abstract') as string;
    const keywords = data.get('keywords') as string;
    const category = data.get('category') as string;
    const year = data.get('year') as string;
    const department = data.get('department') as string;

    // 3. ตรวจสอบข้อมูล (Validation)
    if (!file) {
      // (นี่คือ Error ที่คุณเจอ)
      return NextResponse.json({ success: false, error: "File is required." }, { status: 400 });
    }
    if (!author || !advisor || !title || !abstract) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }
    
    // (ตรวจสอบประเภทไฟล์)
    if (file.type !== 'application/pdf' && file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return NextResponse.json({ success: false, error: "Only .pdf or .docx files are allowed" }, { status: 400 });
    }

    // 4. บันทึกไฟล์ (เรียกใช้ Helper)
    const filePath = await saveFile(file);

    // 5. สร้าง Thesis ID (Logic เดิมของคุณถูกต้อง)
    const lastThesis = await Thesis.findOne().sort({ createdAt: -1 }); 
    let nextIdNumber = 1;
    if (lastThesis && lastThesis.thesis_id) {
      const lastNum = parseInt(lastThesis.thesis_id.replace("TH", ""), 10);
      if (!isNaN(lastNum)) {
        nextIdNumber = lastNum + 1;
      }
    }
    const newThesisId = `TH${String(nextIdNumber).padStart(3, '0')}`;

    // 6. บันทึกข้อมูลลง Database
    const thesis = await Thesis.create({
      thesis_id: newThesisId, 
      title: title,
      abstract: abstract,
      author: author,
      advisor: advisor,
      file_path: filePath, // (ใช้ Path ที่ได้จากการบันทึก)
      status: 'pending',
      isPublic: false,
      keywords: keywords,
      category: category,
      year: year,
      department: department,
    });

    return NextResponse.json({ success: true, thesis: thesis }, { status: 201 });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}