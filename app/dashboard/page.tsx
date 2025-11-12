"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp, Download, Users, BookOpen } from "lucide-react"

interface User {
  id: string
  firstname: string
  lastname: string
  email: string
  role: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(userData))
  }, [router])

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const renderStudentDashboard = () => (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Welcome back, {user.firstname}</h1>
        <p className="text-muted-foreground">Track your thesis progress and manage submissions</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={itemVariants}>
        {[
          { title: "Current Thesis", value: "1", subtitle: "In Progress", icon: FileText },
          { title: "Progress", value: "75%", subtitle: "Completion", icon: TrendingUp },
          { title: "Pending Reviews", value: "2", subtitle: "Awaiting feedback", icon: Clock },
          { title: "Deadline", value: "45", subtitle: "Days remaining", icon: AlertCircle },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={index}
              whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.2 }}
            >
              <Card className="rounded-2xl border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Current Thesis Status */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={itemVariants}>
        <motion.div
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          transition={{ duration: 0.2 }}
        >
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-heading">Current Thesis</CardTitle>
              <CardDescription>Machine Learning Applications in Healthcare</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">75%</span>
              </div>
              <Progress value={75} className="w-full" />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Literature Review</span>
                  <Badge variant="secondary">Complete</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Methodology</span>
                  <Badge variant="secondary">Complete</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Implementation</span>
                  <Badge>In Progress</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Results & Analysis</span>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          transition={{ duration: 0.2 }}
        >
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-heading">Recent Activity</CardTitle>
              <CardDescription>Your latest thesis updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-secondary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Chapter 3 submitted for review</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Advisor feedback received</p>
                    <p className="text-xs text-muted-foreground">5 days ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Meeting scheduled with advisor</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <motion.div
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          transition={{ duration: 0.2 }}
        >
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-heading">Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }} transition={{ duration: 0.2 }}>
                  <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                    Upload New Chapter
                  </Button>
                </motion.div>
                <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }} transition={{ duration: 0.2 }}>
                  <Button variant="outline">Schedule Meeting</Button>
                </motion.div>
                <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }} transition={{ duration: 0.2 }}>
                  <Button variant="outline">View Feedback</Button>
                </motion.div>
                <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }} transition={{ duration: 0.2 }}>
                  <Button variant="outline">Download Thesis</Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  )

  const renderAdvisorDashboard = () => (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Advisor Dashboard</h1>
        <p className="text-muted-foreground">Manage student theses and provide guidance</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={itemVariants}>
        {[
          { title: "Active Students", value: "12", subtitle: "Under supervision", icon: Users },
          { title: "Pending Reviews", value: "8", subtitle: "Awaiting review", icon: Clock },
          { title: "Completed This Month", value: "3", subtitle: "Theses approved", icon: CheckCircle },
          { title: "Upcoming Meetings", value: "5", subtitle: "This week", icon: AlertCircle },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={index}
              whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.2 }}
            >
              <Card className="rounded-2xl border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Recent Submissions */}
      <motion.div variants={itemVariants}>
        <motion.div
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          transition={{ duration: 0.2 }}
        >
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-heading">Recent Submissions</CardTitle>
              <CardDescription>Latest thesis submissions requiring your review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    student: "Alice Johnson",
                    title: "AI in Medical Diagnosis",
                    submitted: "2 hours ago",
                    status: "pending",
                  },
                  { student: "Bob Smith", title: "Blockchain Security", submitted: "1 day ago", status: "pending" },
                  {
                    student: "Carol Davis",
                    title: "IoT Network Optimization",
                    submitted: "3 days ago",
                    status: "reviewed",
                  },
                ].map((submission, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                    whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{submission.title}</p>
                      <p className="text-sm text-muted-foreground">
                        by {submission.student} • {submission.submitted}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={submission.status === "pending" ? "default" : "secondary"}>
                        {submission.status}
                      </Badge>
                      <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }} transition={{ duration: 0.2 }}>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  )

  const renderAdminDashboard = () => (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management tools</p>
      </motion.div>

      {/* System Stats */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={itemVariants}>
        {[
          { title: "Total Theses", value: "1,234", subtitle: "+12% from last month", icon: BookOpen },
          { title: "Active Users", value: "456", subtitle: "Students & Advisors", icon: Users },
          { title: "Downloads", value: "8,901", subtitle: "This month", icon: Download },
          { title: "Storage Used", value: "2.4TB", subtitle: "of 10TB capacity", icon: TrendingUp },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={index}
              whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.2 }}
            >
              <Card className="rounded-2xl border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* System Overview */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={itemVariants}>
        <motion.div
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          transition={{ duration: 0.2 }}
        >
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-heading">Recent Activity</CardTitle>
              <CardDescription>Latest system events and user actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-secondary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">New thesis approved by Dr. Smith</p>
                    <p className="text-xs text-muted-foreground">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">5 new user registrations</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Download className="h-4 w-4 text-accent mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Thesis downloaded 50 times today</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          transition={{ duration: 0.2 }}
        >
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-heading">System Health</CardTitle>
              <CardDescription>Current system status and performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Server Status</span>
                  <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storage</span>
                  <Badge variant="outline">24% Used</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Backup Status</span>
                  <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                    Up to date
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  )

  const renderDashboardContent = () => {
    switch (user.role) {
      case "student":
        return renderStudentDashboard()
      case "advisor":
        return renderAdvisorDashboard()
      case "admin":
        return renderAdminDashboard()
      default:
        return renderStudentDashboard()
    }
  }

  const dashboardUser = {
    id: "1",
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    role: user.role as "student" | "advisor" | "admin",
    department: "Computer Science",
  }

  return (
    <DashboardLayout user={dashboardUser}>
      <div className="container mx-auto px-4 py-8">{renderDashboardContent()}</div>
    </DashboardLayout>
  )
}
