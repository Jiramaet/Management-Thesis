"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, Edit, Eye, Clock, CheckCircle, AlertCircle, MessageSquare, Calendar } from "lucide-react"

// Mock user data
const mockUser = {
  id: "1",
  name: "John Doe",
  email: "john.doe@university.edu",
  role: "student" as const,
  department: "Computer Science",
}

export async function GET() {
  return Response.json({ message: "TEST TEST OMG"})
}

// Mock thesis data
const mockThesis = {
  id: "thesis-001",
  title: "Machine Learning Applications in Healthcare Diagnosis",
  abstract:
    "This thesis explores the application of machine learning algorithms in medical diagnosis, focusing on image recognition and pattern analysis for early disease detection. The research demonstrates significant improvements in diagnostic accuracy through the implementation of deep learning models.",
  status: "in-review",
  progress: 75,
  submittedDate: "2024-01-15",
  lastUpdated: "2024-01-20",
  advisor: "Dr. Jane Smith",
  coAdvisor: "Dr. Michael Johnson",
  category: "Computer Science",
  keywords: ["machine learning", "healthcare", "medical diagnosis", "deep learning"],
  files: [
    { name: "thesis-final.pdf", size: "2.4 MB", type: "pdf", uploadDate: "2024-01-15" },
    { name: "source-code.zip", size: "15.2 MB", type: "zip", uploadDate: "2024-01-15" },
    { name: "presentation.pptx", size: "8.7 MB", type: "pptx", uploadDate: "2024-01-20" },
  ],
  feedback: [
    {
      id: "1",
      reviewer: "Dr. Jane Smith",
      date: "2024-01-18",
      type: "advisor",
      comment:
        "Excellent work on the methodology section. Please consider adding more discussion on the limitations of the current approach.",
      status: "pending",
    },
    {
      id: "2",
      reviewer: "Dr. Michael Johnson",
      date: "2024-01-17",
      type: "co-advisor",
      comment:
        "The results section is comprehensive. I suggest including a comparison with traditional diagnostic methods.",
      status: "addressed",
    },
  ],
}

export default function ThesisPage() {
  const [user] = useState(mockUser)
  const [thesis] = useState(mockThesis)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "in-review":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-review":
        return <Clock className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground mb-2">My Thesis</h1>
              <p className="text-muted-foreground">Manage and track your thesis progress</p>
            </div>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Thesis
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thesis Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="font-heading text-xl">{thesis.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(thesis.status)}>
                        {getStatusIcon(thesis.status)}
                        <span className="ml-1 capitalize">{thesis.status.replace("-", " ")}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Last updated: {new Date(thesis.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Abstract</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{thesis.abstract}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Advisor</h4>
                    <p className="text-sm text-muted-foreground">{thesis.advisor}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Co-Advisor</h4>
                    <p className="text-sm text-muted-foreground">{thesis.coAdvisor}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {thesis.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for detailed information */}
            <Tabs defaultValue="files" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="files" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Uploaded Files</CardTitle>
                    <CardDescription>All files associated with your thesis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {thesis.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {file.size} • Uploaded {new Date(file.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="feedback" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Advisor Feedback</CardTitle>
                    <CardDescription>Comments and suggestions from your advisors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {thesis.feedback.map((feedback) => (
                        <div key={feedback.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-primary" />
                              <span className="font-medium">{feedback.reviewer}</span>
                              <Badge variant={feedback.status === "addressed" ? "secondary" : "outline"}>
                                {feedback.status}
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(feedback.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{feedback.comment}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Thesis History</CardTitle>
                    <CardDescription>Timeline of your thesis progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-primary mt-1" />
                        <div>
                          <p className="font-medium">Thesis submitted for review</p>
                          <p className="text-sm text-muted-foreground">January 15, 2024</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-4 w-4 text-secondary mt-1" />
                        <div>
                          <p className="font-medium">Feedback received from Dr. Jane Smith</p>
                          <p className="text-sm text-muted-foreground">January 18, 2024</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-accent mt-1" />
                        <div>
                          <p className="font-medium">Presentation slides uploaded</p>
                          <p className="text-sm text-muted-foreground">January 20, 2024</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Progress</CardTitle>
                <CardDescription>Overall completion status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completion</span>
                    <span>{thesis.progress}%</span>
                  </div>
                  <Progress value={thesis.progress} />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Literature Review</span>
                    <CheckCircle className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex justify-between">
                    <span>Methodology</span>
                    <CheckCircle className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex justify-between">
                    <span>Implementation</span>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="flex justify-between">
                    <span>Results & Analysis</span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Upload New Version
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Download All Files
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
