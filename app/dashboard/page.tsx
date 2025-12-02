"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp, Download, Users, BookOpen, MessageSquare, UploadCloud, ChevronDown, Calendar as CalendarIcon, Mail, Zap, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface User {
  id: string
  firstname: string 
  lastname: string  
  email: string
  role: string
  department: string 
  user_id: string    
}

interface IThesis {
  _id: string;
  thesis_id: string;
  title: string;
  abstract: string;
  status: string;
  file_path: string;
  keywords: string[];
  category: string;
  author?: {
    firstName: string;
    lastName: string;
    email: string;
    user_id: string;
    department: string;
  };
  advisor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  chapterApproval?: {
    chapter1: boolean;
    chapter2: boolean;
    chapter3: boolean;
    chapter4: boolean;
    chapter5: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface IMeeting {
  _id: string;
  title: string;
  date: string;
  status: string;
  thesis?: {
    title: string;
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [theses, setTheses] = useState<IThesis[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<IMeeting[]>([]); // New state
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [selectedThesisId, setSelectedThesisId] = useState<string>("");

  const router = useRouter()

  const [latestFeedback, setLatestFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoadingUser(true);
      try {
        const resUser = await fetch('/api/auth/me'); 
        if (!resUser.ok) throw new Error('Not authenticated');
        const dataUser = await resUser.json();
        
        if (dataUser.success) {
          setUser(dataUser.user);
          
          // Fetch Upcoming Meetings
          const resMeetings = await fetch('/api/meetings/upcoming');
          const dataMeetings = await resMeetings.json();
          if (dataMeetings.success) {
             setUpcomingEvents(dataMeetings.meetings);
          }

          if (dataUser.user.role === 'student') {
            const resThesis = await fetch('/api/thesis/my');
            const dataThesis = await resThesis.json();
            if (dataThesis.success) {
              setTheses(dataThesis.theses);
              if (dataThesis.theses.length > 0) {
                setSelectedThesisId(dataThesis.theses[0]._id);
              }
            }
          } else if (dataUser.user.role === 'advisor') {
            const resThesis = await fetch('/api/thesis/advisor');
            const dataThesis = await resThesis.json();
            if (dataThesis.success) {
              setTheses(dataThesis.theses);
            }
          }
        } else {
          throw new Error(dataUser.error);
        }
      } catch (error) {
        console.error("Auth Error:", error);
        router.push('/login');
      } finally {
        setLoadingUser(false);
      }
    }
    fetchData();
  }, [router])

  // Fetch latest feedback when selectedThesisId changes
  useEffect(() => {
    if (!selectedThesisId) {
      setLatestFeedback(null);
      return;
    }

    async function fetchFeedback() {
      try {
        const res = await fetch(`/api/thesis/${selectedThesisId}/comments`);
        const data = await res.json();
        if (data.success && data.comments.length > 0) {
          // Filter for advisor comments and get the last one
          const advisorComments = data.comments.filter((c: any) => c.user.role === 'advisor');
          if (advisorComments.length > 0) {
            setLatestFeedback(advisorComments[advisorComments.length - 1].content);
          } else {
            setLatestFeedback(null);
          }
        } else {
          setLatestFeedback(null);
        }
      } catch (error) {
        console.error("Failed to fetch feedback:", error);
        setLatestFeedback(null);
      }
    }

    fetchFeedback();
  }, [selectedThesisId]);

  if (loadingUser || !user) { 
    return (
      <div className="flex items-center justify-center p-8"> 
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  const activeThesis = theses.find(t => t._id === selectedThesisId) || null;

  // Logic คำนวณ Progress
  let progressValue = 0;
  let progressText = "Not Started";
  let passedChaptersCount = 0;

  if (activeThesis) {
      if (activeThesis.status.toLowerCase() === 'approved') {
          progressValue = 100;
          progressText = "Completed";
          passedChaptersCount = 5;
      } else if (activeThesis.chapterApproval) {
          const chapters = Object.values(activeThesis.chapterApproval);
          passedChaptersCount = chapters.filter(c => c === true).length;
          progressValue = (passedChaptersCount / 5) * 100;
          
          if (progressValue === 0) progressText = "Started";
          else if (progressValue < 50) progressText = "In Progress";
          else if (progressValue < 100) progressText = "Near Completion";
          else progressText = "Waiting Approval";
      }
  }

  // --- Quick Actions Component ---
  const QuickActions = () => (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {user.role === 'student' ? (
        <>
          <Button variant="outline" className="gap-2 whitespace-nowrap" asChild>
            <Link href="/dashboard/upload">
              <UploadCloud className="h-4 w-4 text-blue-500" /> Upload New Version
            </Link>
          </Button>
          <Button variant="outline" className="gap-2 whitespace-nowrap" asChild>
            <Link href={`/dashboard/thesis/${selectedThesisId}#feedback`}>
              <MessageSquare className="h-4 w-4 text-green-500" /> View Feedback
            </Link>
          </Button>
          <Button variant="outline" className="gap-2 whitespace-nowrap">
             <Mail className="h-4 w-4 text-orange-500" /> Contact Advisor
          </Button>
        </>
      ) : (
        <>
          <Button variant="outline" className="gap-2 whitespace-nowrap" asChild>
             <Link href="/dashboard/approvals">
               <CheckCircle className="h-4 w-4 text-green-500" /> Review Pending
             </Link>
          </Button>
          <Button variant="outline" className="gap-2 whitespace-nowrap" asChild>
             <Link href="/dashboard/students">
               <Users className="h-4 w-4 text-blue-500" /> My Students
             </Link>
          </Button>
          <Button variant="outline" className="gap-2 whitespace-nowrap">
             <Mail className="h-4 w-4 text-orange-500" /> Email All
          </Button>
        </>
      )}
    </div>
  );

  // --- Timeline Component ---
  const ActivityTimeline = () => (
    <Card className="rounded-2xl border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-l-2 border-muted ml-3 space-y-6 pb-2">
          {/* Mock Timeline Items based on thesis updates */}
          {theses.slice(0, 3).map((thesis, index) => (
            <div key={index} className="mb-6 ml-6 relative group">
              <span className="absolute -left-[31px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-primary group-hover:scale-110 transition-transform">
                 {index === 0 ? <Zap className="h-3 w-3 text-primary" /> : <FileText className="h-3 w-3 text-muted-foreground" />}
              </span>
              <h4 className="text-sm font-semibold">{thesis.title}</h4>
              <p className="text-xs text-muted-foreground mb-1">
                {index === 0 ? "Updated recently" : "Submitted"} • {new Date(thesis.updatedAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Status changed to <span className="font-medium text-foreground">{thesis.status}</span>
              </p>
            </div>
          ))}
          {theses.length === 0 && <p className="ml-6 text-sm text-muted-foreground">No recent activity.</p>}
        </div>
      </CardContent>
    </Card>
  );

  // --- Calendar Component ---
  const UpcomingEvents = () => (
    <Card className="rounded-2xl border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
           <CalendarIcon className="h-5 w-5 text-red-500" /> Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
         {upcomingEvents.length > 0 ? (
           upcomingEvents.map((event) => (
             <div key={event._id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 w-12 text-center bg-background rounded-lg border p-1">
                   <div className="text-[10px] text-red-500 font-bold uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</div>
                   <div className="text-lg font-bold leading-none">{new Date(event.date).getDate()}</div>
                </div>
                <div className="overflow-hidden">
                   <p className="font-medium text-sm truncate">{event.title}</p>
                   <p className="text-xs text-muted-foreground truncate">
                      {event.thesis?.title || "Meeting"}
                   </p>
                </div>
             </div>
           ))
         ) : (
           <div className="text-center py-6 text-muted-foreground text-sm">
              No upcoming events.
           </div>
         )}
      </CardContent>
    </Card>
  );

  const renderStudentDashboard = () => {
    // Data for Bar Chart
    const chartData = [
      { name: 'Ch 1', completed: activeThesis?.chapterApproval?.chapter1 ? 100 : 0 },
      { name: 'Ch 2', completed: activeThesis?.chapterApproval?.chapter2 ? 100 : 0 },
      { name: 'Ch 3', completed: activeThesis?.chapterApproval?.chapter3 ? 100 : 0 },
      { name: 'Ch 4', completed: activeThesis?.chapterApproval?.chapter4 ? 100 : 0 },
      { name: 'Ch 5', completed: activeThesis?.chapterApproval?.chapter5 ? 100 : 0 },
    ];

    return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      
      {/* Header & Quick Actions */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-1">Welcome back, {user.firstname}</h1>
            <p className="text-muted-foreground">Here's what's happening with your thesis today.</p>
          </div>
          {theses.length > 0 && (
            <div className="min-w-[250px]">
              <Select value={selectedThesisId} onValueChange={setSelectedThesisId}>
                <SelectTrigger className="w-full h-12 rounded-xl border-2 bg-background/50 backdrop-blur-sm hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium truncate max-w-[180px]">
                            {activeThesis ? activeThesis.title : "Select Thesis"}
                      </span>
                  </div>
                </SelectTrigger>
                <SelectContent align="end" className="w-[300px]">
                   {theses.map((thesis) => (
                      <SelectItem key={thesis._id} value={thesis._id} className="py-3 cursor-pointer">
                         <div className="flex flex-col gap-1">
                            <span className="font-medium truncate">{thesis.title}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                               <span className="bg-muted px-1.5 py-0.5 rounded">{thesis.thesis_id}</span>
                               <span>v{thesis.thesis_id.split('-')[1] || '1'}</span>
                            </div>
                         </div>
                      </SelectItem>
                   ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <QuickActions />
      </motion.div>

      {/* Stats Grid */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={itemVariants}>
        {[
          { title: "Thesis ID", value: activeThesis ? activeThesis.thesis_id : "-", subtitle: "Current Selection", icon: FileText },
          { title: "Overall Progress", value: `${progressValue}%`, subtitle: progressText, icon: TrendingUp },
          { title: "Chapters Passed", value: `${passedChaptersCount}/5`, subtitle: "Milestones", icon: CheckCircle },
          { title: "Status", value: activeThesis ? activeThesis.status : "-", subtitle: "Current State", icon: AlertCircle }, 
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div key={index} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Card className="rounded-2xl border-0 shadow-lg h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Main Content Grid */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6" variants={itemVariants}>
        
        {/* Left Column: Charts & Details */}
        <div className="lg:col-span-2 space-y-6">
           {/* Chart Section */}
           <Card className="rounded-2xl border-0 shadow-lg">
             <CardHeader>
               <CardTitle className="font-heading">Chapter Progress</CardTitle>
               <CardDescription>Visual breakdown of your thesis chapters</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="space-y-6">
                  {/* Thesis Details */}
                  <div>
                      <h3 className="font-semibold text-lg leading-tight mb-2">{activeThesis?.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {activeThesis?.abstract || "No abstract available."}
                      </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Overall Completion</span>
                        <span className="text-muted-foreground">{Math.round(progressValue)}%</span>
                    </div>
                    <Progress value={progressValue} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {[1,2,3,4,5].map(num => {
                        const key = `chapter${num}` as keyof typeof activeThesis.chapterApproval;
                        const isPassed = activeThesis?.chapterApproval?.[key];
                        return (
                            <div key={num} className={`flex flex-col items-center p-2 rounded-lg border ${isPassed ? 'bg-green-50 border-green-200' : 'bg-muted/20'}`}>
                                <span className="text-xs font-medium mb-1">Ch.{num}</span>
                                {isPassed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <div className="h-4 w-4 rounded-full border-2 border-muted" />}
                            </div>
                        )
                    })}
                  </div>
                </div>
             </CardContent>
           </Card>

           {/* Feedback Section */}
           <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                   <MessageSquare className="h-5 w-5 text-primary" />
                   Latest Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                 {activeThesis ? (
                   <div className="bg-muted/20 p-6 rounded-xl border border-muted/50">
                      <h4 className="font-medium text-foreground mb-2">
                        {latestFeedback ? "Advisor commented:" : "No new feedback"}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {latestFeedback || "Your advisor hasn't left any comments on this version yet."}
                      </p>
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/dashboard/thesis/${activeThesis._id}#feedback`}>View Full Discussion</Link>
                      </Button>
                   </div>
                 ) : (
                   <div className="text-center text-muted-foreground py-4">No thesis selected.</div>
                 )}
              </CardContent>
           </Card>
        </div>

        {/* Right Column: Timeline & Calendar */}
        <div className="space-y-6">
           <UpcomingEvents />
           <ActivityTimeline />
        </div>

      </motion.div>
    </motion.div>
  )}

  const renderAdvisorDashboard = () => {
    const uniqueStudents = new Set(theses.map(t => t.author?.user_id)).size;
    const pendingReviews = theses.filter(t => t.status.toLowerCase() === 'pending');
    const approvedCount = theses.filter(t => t.status.toLowerCase() === 'approved').length;
    const rejectedCount = theses.filter(t => t.status.toLowerCase() === 'rejected').length;

    // Data for Pie Chart
    const pieData = [
      { name: 'Approved', value: approvedCount, color: '#22c55e' }, // Green
      { name: 'Pending', value: pendingReviews.length, color: '#eab308' }, // Yellow
      { name: 'Rejected', value: rejectedCount, color: '#ef4444' }, // Red
    ].filter(d => d.value > 0);

    return (
      <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="space-y-4">
          <div>
             <h1 className="text-3xl font-heading font-bold text-foreground mb-1">Welcome back, {user.firstname}</h1>
             <p className="text-muted-foreground">Overview of your students' progress and pending tasks.</p>
          </div>
          <QuickActions />
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={itemVariants}>
          <Card className="rounded-2xl border-0 shadow-lg">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
               <Users className="h-4 w-4 text-blue-500" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{uniqueStudents}</div>
               <p className="text-xs text-muted-foreground">Under supervision</p>
             </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-lg border-l-4 border-l-yellow-400">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
               <AlertCircle className="h-4 w-4 text-yellow-500" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{pendingReviews.length}</div>
               <p className="text-xs text-muted-foreground">Need attention</p>
             </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-lg">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Approved Theses</CardTitle>
               <CheckCircle className="h-4 w-4 text-green-500" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{approvedCount}</div>
               <p className="text-xs text-muted-foreground">Completed</p>
             </CardContent>
          </Card>
        </motion.div>

        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6" variants={itemVariants}>
           {/* Left: Charts */}
           <div className="lg:col-span-2">
              <Card className="rounded-2xl border-0 shadow-lg h-full">
                 <CardHeader>
                    <CardTitle className="font-heading">Thesis Status Distribution</CardTitle>
                    <CardDescription>Overview of all student thesis statuses</CardDescription>
                 </CardHeader>
                 <CardContent className="h-[300px] flex items-center justify-center">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-muted-foreground">No data available</div>
                    )}
                 </CardContent>
              </Card>
           </div>

           {/* Right: Calendar */}
           <div>
              <UpcomingEvents />
           </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
           <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
             <Clock className="h-5 w-5 text-yellow-500" /> Pending Reviews
           </h2>
           {pendingReviews.length === 0 ? (
              <Card className="p-8 text-center border-dashed bg-muted/10 rounded-2xl">
                <p className="text-muted-foreground">No pending reviews. You're all caught up!</p>
              </Card>
           ) : (
             <div className="grid gap-4">
               {pendingReviews.map((thesis) => (
                 <Card key={thesis._id} className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-400">
                   <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                         <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{thesis.thesis_id}</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(thesis.createdAt).toLocaleDateString()}</span>
                         </div>
                         <h3 className="text-lg font-bold text-foreground hover:text-primary cursor-pointer">
                            <Link href={`/dashboard/thesis/${thesis._id}`}>{thesis.title}</Link>
                         </h3>
                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            Student: <span className="font-medium text-foreground">{thesis.author ? `${thesis.author.firstName} ${thesis.author.lastName}` : "Unknown"}</span>
                            <span className="px-1">•</span>
                            ID: {thesis.author?.user_id}
                         </div>
                      </div>
                      <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm">
                         <Link href={`/dashboard/thesis/${thesis._id}`}>Review Thesis</Link>
                      </Button>
                   </CardContent>
                 </Card>
               ))}
             </div>
           )}
        </motion.div>

      </motion.div>
    )
  }

  const renderAdminDashboard = () => (
     <div className="p-12 text-center bg-muted/20 rounded-2xl border-2 border-dashed"><h2 className="text-2xl font-bold text-muted-foreground">Admin Dashboard Component</h2></div>
  )

  const renderDashboardContent = () => {
    switch (user.role) {
      case "student": return renderStudentDashboard();
      case "advisor": return renderAdvisorDashboard();
      case "admin": return renderAdminDashboard();
      default: return renderStudentDashboard();
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">{renderDashboardContent()}</div>
  )
}