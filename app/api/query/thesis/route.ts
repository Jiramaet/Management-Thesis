// app/api/query/thesis/route.ts
import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Thesis } from '@/lib/models/Thesis';
import multer from 'multer';
import nextConnect from 'next-connect';
import path from 'path';
import fs from 'fs';

// ตั้งค่า storage
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${file.originalname}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only .pdf files allowed'));
    } else {
      cb(null, true);
    }
  }
});

// NextConnect handler (รองรับ multipart)
const handler = nextConnect({
  onError(error : any, _req : any, res : any) {
    res.status(500).json({ error: `Upload failed: ${error.message}` });
  },
  onNoMatch(_req : any, res : any) {
    res.status(405).json({ error: 'Method not allowed' });
  }
});

// รองรับ POST /api/query/thesis
handler.use(upload.single('file'));

handler.post(async (req: any, res: any) => {
  await connectDatabase();

  const { user_id, title, status } = req.body;
  const filePath = `/uploads/${req.file.filename}`;

  // หา thesis_id ล่าสุด เพื่อ auto increment
  const last = await Thesis.findOne().sort({ thesis_id: -1 });
  const nextId = last ? last.thesis_id + 1 : 1;

  const thesis = await Thesis.create({
    thesis_id: nextId,
    user_id,
    title,
    file_path: filePath,
    status: status || 'pending'
  });

  res.status(201).json(thesis);
});

// แปลง handler เป็น Request handler ของ Next
export const POST = async (req: Request) => {
  const res: any = await new Promise((resolve, reject) => {
    const httpRes = {
      status: (code: number) => ({
        json: (data: any) => resolve(new Response(JSON.stringify(data), { status: code }))
      })
    };
    const httpReq = (req as any).body;
    handler(req as any, httpRes, (err: any) => {
      if (err) reject(err);
    });
  });

  return res;
};
