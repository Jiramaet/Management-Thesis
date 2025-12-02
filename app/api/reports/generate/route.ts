import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Thesis } from '@/lib/models/Thesis';
import { User } from '@/lib/models/Users';
import { ReportLog } from '@/lib/models/ReportLog';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  role: string;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    const userId = decoded.id;

    await connectDatabase();

    const body = await req.json();
    const { template, fields, dateRange, reportName } = body;

    let data: any[] = [];
    let csvContent = "";

    // 1. Fetch Data based on Template
    if (template.id === 'thesis-summary') {
      const query: any = {};
      
      if (dateRange?.from && dateRange?.to) {
        query.createdAt = { 
          $gte: new Date(dateRange.from), 
          $lte: new Date(dateRange.to) 
        };
      }

      const theses = await Thesis.find(query)
        .populate('author', 'firstName lastName')
        .populate('advisor', 'firstName lastName');

      data = theses.map((t: any) => {
        const row: any = {};
        if (fields.includes('title')) row.title = t.title;
        if (fields.includes('author')) row.author = `${t.author?.firstName} ${t.author?.lastName}`;
        if (fields.includes('advisor')) row.advisor = `${t.advisor?.firstName} ${t.advisor?.lastName}`;
        if (fields.includes('status')) row.status = t.status;
        if (fields.includes('submission_date')) row.submission_date = t.createdAt?.toISOString().split('T')[0];
        if (fields.includes('category')) row.category = t.category || '-';
        if (fields.includes('department')) row.department = t.department || '-';
        return row;
      });
    } else if (template.id === 'department-overview') {
       const matchStage: any = {};
       if (dateRange?.from && dateRange?.to) {
         matchStage.createdAt = { 
           $gte: new Date(dateRange.from), 
           $lte: new Date(dateRange.to) 
         };
       }

       const aggregation = await Thesis.aggregate([
         { $match: matchStage },
         {
           $group: {
             _id: { department: "$department", category: "$category" },
             thesis_count: { $sum: 1 },
             approved_count: { 
               $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
             },
             total_review_time: {
               $sum: {
                 $cond: [
                   { $in: ["$status", ["approved", "rejected"]] },
                   { $subtract: ["$updatedAt", "$createdAt"] },
                   0
                 ]
               }
             },
             reviewed_count: {
               $sum: { $cond: [{ $in: ["$status", ["approved", "rejected"]] }, 1, 0] }
             }
           }
         }
       ]);

       data = aggregation.map((item: any) => {
         const row: any = {};
         const dept = item._id.department || 'Unassigned';
         const cat = item._id.category || 'Uncategorized';
         
         if (fields.includes('department')) row.department = dept;
         if (fields.includes('category')) row.category = cat;
         if (fields.includes('thesis_count')) row.thesis_count = item.thesis_count;
         
         if (fields.includes('approval_rate')) {
           const rate = item.thesis_count > 0 ? (item.approved_count / item.thesis_count) * 100 : 0;
           row.approval_rate = `${rate.toFixed(1)}%`;
         }
         
         if (fields.includes('avg_review_time')) {
           const avgTimeMs = item.reviewed_count > 0 ? item.total_review_time / item.reviewed_count : 0;
           const avgDays = Math.round(avgTimeMs / (1000 * 60 * 60 * 24));
           row.avg_review_time = `${avgDays} days`;
         }
         
         return row;
       });
    } else if (template.id === 'download-stats') {
       const query: any = {};
       if (dateRange?.from && dateRange?.to) {
         query.createdAt = { 
           $gte: new Date(dateRange.from), 
           $lte: new Date(dateRange.to) 
         };
       }
       
       const theses = await Thesis.find(query)
         .sort({ downloadCount: -1 }) // Sort by most downloaded
         .populate('author', 'firstName lastName');

       data = theses.map((t: any) => {
         const row: any = {};
         if (fields.includes('thesis_title')) row.thesis_title = t.title;
         if (fields.includes('author')) row.author = `${t.author?.firstName} ${t.author?.lastName}`;
         if (fields.includes('download_count')) row.download_count = t.downloadCount || 0;
         if (fields.includes('category')) row.category = t.category || '-';
         if (fields.includes('publish_date')) row.publish_date = t.createdAt?.toISOString().split('T')[0];
         return row;
       });
    } else if (template.id === 'user-activity') {
       const users = await User.find({});
       
       // Import Comment model dynamically to avoid circular dependency issues if any
       const { Comment } = await import('@/lib/models/comment');

       data = await Promise.all(users.map(async (u: any) => {
         const row: any = {};
         
         if (fields.includes('user_name')) row.user_name = `${u.firstName} ${u.lastName}`;
         if (fields.includes('role')) row.role = u.role;
         if (fields.includes('department')) row.department = u.department || '-';
         
         if (fields.includes('last_login')) {
            row.last_login = u.lastLogin ? u.lastLogin.toISOString().split('T')[0] : '-';
         }

         if (fields.includes('thesis_count')) {
            let count = 0;
            if (u.role === 'student') {
                count = await Thesis.countDocuments({ author: u._id });
            } else if (u.role === 'advisor') {
                count = await Thesis.countDocuments({ advisor: u._id });
            }
            row.thesis_count = count;
         }

         if (fields.includes('review_count')) {
            // Count comments made by the user
            const count = await Comment.countDocuments({ user: u._id });
            row.review_count = count;
         }

         return row;
       }));
    } else if (template.id === 'advisor-workload') {
       const advisors = await User.find({ role: 'advisor' });

       data = await Promise.all(advisors.map(async (advisor: any) => {
         const row: any = {};
         const totalTheses = await Thesis.countDocuments({ advisor: advisor._id });
         const activeTheses = await Thesis.countDocuments({ advisor: advisor._id, status: { $in: ['pending', 'revision_requested', 'draft'] } });
         const completedTheses = await Thesis.countDocuments({ advisor: advisor._id, status: 'approved' });

         if (fields.includes('advisor_name')) row.advisor_name = `${advisor.firstName} ${advisor.lastName}`;
         if (fields.includes('department')) row.department = advisor.department || '-';
         if (fields.includes('total_students')) row.total_students = totalTheses;
         if (fields.includes('active_theses')) row.active_theses = activeTheses;
         if (fields.includes('completed_theses')) row.completed_theses = completedTheses;
         
         return row;
       }));

    } else if (template.id === 'at-risk-students') {
       // Find theses not updated in 30 days and not completed
       const thirtyDaysAgo = new Date();
       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

       const query: any = {
           status: { $nin: ['approved', 'rejected'] },
           updatedAt: { $lt: thirtyDaysAgo }
       };
       
       if (dateRange?.from && dateRange?.to) {
           // If date range is provided, maybe filter by creation date or last update within that range?
           // Usually "at risk" implies current state, so date range might be less relevant, but let's respect it if given for "last update"
           query.updatedAt = { 
               $lt: thirtyDaysAgo,
               $gte: new Date(dateRange.from), 
               $lte: new Date(dateRange.to) 
           };
       }

       const theses = await Thesis.find(query)
         .populate('author', 'firstName lastName email')
         .populate('advisor', 'firstName lastName');

       data = theses.map((t: any) => {
         const row: any = {};
         const lastUpdate = new Date(t.updatedAt);
         const now = new Date();
         const daysInactive = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

         if (fields.includes('student_name')) row.student_name = `${t.author?.firstName} ${t.author?.lastName}`;
         if (fields.includes('email')) row.email = t.author?.email || '-';
         if (fields.includes('thesis_title')) row.thesis_title = t.title;
         if (fields.includes('advisor')) row.advisor = `${t.advisor?.firstName} ${t.advisor?.lastName}`;
         if (fields.includes('last_update')) row.last_update = lastUpdate.toISOString().split('T')[0];
         if (fields.includes('days_inactive')) row.days_inactive = daysInactive;
         if (fields.includes('status')) row.status = t.status;

         return row;
       });
    }

    // 2. Convert to CSV
    if (data.length > 0) {
      const header = fields.join(',') + '\n';
      const rows = data.map((row: any) => 
        fields.map((field: string) => {
            const val = row[field] ? String(row[field]).replace(/,/g, ' ') : ''; // Escape commas
            return val;
        }).join(',')
      ).join('\n');
      csvContent = header + rows;
    } else {
        csvContent = fields.join(',') + '\n'; // Empty CSV with headers
    }

    // 3. Log Report Generation
    const fileSizeKB = (Buffer.byteLength(csvContent, 'utf8') / 1024).toFixed(2);
    
    await ReportLog.create({
      user: userId,
      reportName: reportName,
      template: template.name,
      format: 'CSV',
      fileSize: `${fileSizeKB} KB`,
      status: 'completed'
    });

    // 4. Return CSV File
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${reportName}.csv"`,
      },
    });

  } catch (error: any) {
    console.error('Report Generation Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
