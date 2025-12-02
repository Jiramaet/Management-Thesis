// import { NextRequest, NextResponse } from 'next/server';
// import { promises as fs } from 'fs';
// import path from 'path';

// export async function POST(request: NextRequest) {
//   const { username, password } = await request.json();

//   // อ่าน users.json
//   const usersFile = path.join(process.cwd(), 'app/api/login/users.json');
//   const usersData = await fs.readFile(usersFile, 'utf-8');
//   const users = JSON.parse(usersData);

//   const foundUser = users.find((u: { username: string; password: string }) => u.username === username && u.password === password);

//   if (foundUser) {
//     // ตัวอย่าง: ส่ง token กลับ (จริงควรใช้ JWT)
//     return NextResponse.json({ success: true, token: 'mock-token' });
//   } else {
//     return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
//   }
// }
