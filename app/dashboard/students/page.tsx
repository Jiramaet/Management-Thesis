"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Search, Mail, FileText, Loader2, BookOpen } from "lucide-react"
import Link from "next/link"

// Interface ให้ตรงกับข้อมูลที่ API /api/thesis/advisor ส่งมา
interface IThesis {
  _id: string;
  title: string;
  status: string;
  updatedAt: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    user_id: string; // Student ID
    department: string;
  };
}

export default function StudentsPage() {
  const [students, setStudents] = useState<IThesis[]>([]); 
  const [filteredStudents, setFilteredStudents] = useState<IThesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // New error state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // New state
  const router = useRouter();

  // 1. ดึงข้อมูลจาก API Advisor
  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch('/api/thesis/advisor');
        if (!res.ok) {
           if (res.status === 401) {
             router.push('/login');
             return;
           }
           throw new Error(`Failed to fetch students: ${res.statusText}`);
        }
        const data = await res.json();
        if (data.success) {
          setStudents(data.theses);
          setFilteredStudents(data.theses);
        } else {
          throw new Error(data.error || "Unknown error occurred");
        }
      } catch (error: any) {
        console.error("Error fetching students:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [router]);

  // 2. ระบบค้นหา (Search Logic) + Filter
  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    let filtered = students.filter(item => 
      item.author.firstName.toLowerCase().includes(lowerQuery) ||
      item.author.lastName.toLowerCase().includes(lowerQuery) ||
      item.author.user_id.toLowerCase().includes(lowerQuery) ||
      item.title.toLowerCase().includes(lowerQuery)
    );

    // Filter by Status
    if (statusFilter !== 'all') {
        filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredStudents(filtered);
  }, [searchQuery, students, statusFilter]);

  // Helper to check inactivity
  const isInactive = (dateString: string) => {
      const lastUpdate = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays > 30;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Students</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">My Students</h1>
          <p className="text-muted-foreground">Manage and track your advised students</p>
        </div>
        <div className="relative w-full md:w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input 
              placeholder="Search name, ID, or thesis..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
      </div>

      {/* Status Filters */}
      <Tabs defaultValue="all" className="mb-6" onValueChange={setStatusFilter}>
        <TabsList>
            <TabsTrigger value="all">All Students</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((item) => {
          const inactive = isInactive(item.updatedAt);
          // Safety check for author
          const authorName = item.author ? `${item.author.firstName} ${item.author.lastName}` : "Unknown Student";
          const authorId = item.author?.user_id || "N/A";
          const authorEmail = item.author?.email || "No Email";
          const authorInitial = item.author?.firstName ? item.author.firstName.charAt(0) : "?";

          return (
          <Card key={item._id} className={`hover:shadow-md transition-shadow group ${inactive ? 'border-red-200 dark:border-red-900/50' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {authorInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">{authorName}</h3>
                    <p className="text-sm text-muted-foreground">{authorId}</p>
                  </div>
                </div>
                <Badge variant={item.status === 'approved' ? 'secondary' : 'outline'} className="capitalize">
                  {item.status}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="truncate">{authorEmail}</span>
                </div>

                <div className="p-4 bg-card border rounded-xl space-y-2 group-hover:border-primary/30 transition-colors">
                   <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wider">
                          <BookOpen className="h-3 w-3" /> Current Thesis
                       </div>
                       {/* Inactivity Alert */}
                       {inactive && (
                           <div className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                               <AlertCircle className="h-3 w-3" /> Inactive
                           </div>
                       )}
                   </div>
                   <p className="text-sm font-medium line-clamp-2 leading-snug">{item.title}</p>
                   <p className={`text-xs pt-1 ${inactive ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                       Last updated: {new Date(item.updatedAt).toLocaleDateString()}
                       {inactive && " (>30 days)"}
                   </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t flex gap-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" asChild>
                   <Link href={`/dashboard/thesis/${item._id}`}>
                      <FileText className="h-4 w-4 mr-2" /> View Progress
                   </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )})}

        {filteredStudents.length === 0 && (
           <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
              No students found matching your search.
           </div>
        )}
      </div>
    </div>
  )
}