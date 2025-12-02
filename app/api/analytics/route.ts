import { NextResponse } from 'next/server';
import { connectDatabase } from '@/lib/databaseconnect';
import { Thesis } from '@/lib/models/Thesis';
import { User } from '@/lib/models/Users';

export async function GET() {
  try {
    await connectDatabase();

    // 1. Key Metrics
    const totalTheses = await Thesis.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true }); // Assuming isActive field or just count all
    
    // Calculate total downloads
    const theses = await Thesis.find({}, 'downloadCount createdAt status category');
    const totalDownloads = theses.reduce((sum, t) => sum + (t.downloadCount || 0), 0);

    // Calculate avg uploads per month (simple approximation based on total / 12 or actual data)
    // Let's do actual last 6 months trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // 2. Upload Trends (Last 6 months)
    const uploadTrendsMap = new Map();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${months[d.getMonth()]}`;
        uploadTrendsMap.set(key, { month: key, uploads: 0, downloads: 0 });
    }

    theses.forEach(t => {
        const d = new Date(t.createdAt);
        if (d >= sixMonthsAgo) {
            const key = months[d.getMonth()];
            if (uploadTrendsMap.has(key)) {
                const entry = uploadTrendsMap.get(key);
                entry.uploads += 1;
                entry.downloads += (t.downloadCount || 0); // This is a bit rough, ideally we track download dates, but for now sum total downloads of theses created in that month
            }
        }
    });
    
    const uploadTrends = Array.from(uploadTrendsMap.values());
    const avgUploadsPerMonth = Math.round(uploadTrends.reduce((sum, t) => sum + t.uploads, 0) / 6);

    // 3. Category Distribution
    const categoryMap = new Map();
    theses.forEach(t => {
        const cat = t.category || 'Uncategorized';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    
    const categoryData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: `hsl(var(--chart-${(index % 5) + 1}))`
    }));

    // 4. Status Distribution
    const statusMap = new Map();
    theses.forEach(t => {
        const status = t.status || 'draft';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const statusData = Array.from(statusMap.entries()).map(([status, count], index) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        color: status === 'approved' ? 'hsl(var(--chart-2))' : status === 'rejected' ? 'hsl(var(--destructive))' : 'hsl(var(--chart-1))'
    }));

    // 5. Top Theses
    const topTheses = await Thesis.find({ status: 'approved' })
        .sort({ downloadCount: -1 })
        .limit(5)
        .populate('author', 'name') // Assuming author is a ref, if it's a string just use it
        .lean();

    const formattedTopTheses = topTheses.map((t: any) => ({
        title: t.title,
        author: t.author?.name || t.author || 'Unknown',
        downloads: t.downloadCount || 0,
        category: t.category
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalTheses,
        activeUsers,
        totalDownloads,
        avgUploadsPerMonth,
        uploadTrends,
        categoryData,
        statusData,
        topTheses: formattedTopTheses
      }
    });

  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 });
  }
}
