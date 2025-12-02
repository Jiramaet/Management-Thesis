"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { format } from "date-fns"
import { Download, FileText, BarChart3, CalendarIcon, Users, BookOpen, TrendingUp, Clock, CheckCircle, AlertCircle, ChevronRight } from "lucide-react"

const mockUser = {
  id: "1",
  name: "Dr. Admin",
  email: "admin@university.edu",
  role: "admin" as const,
  department: "Administration",
}

const reportTemplates = [
  {
    id: "thesis-summary",
    name: "Thesis Summary Report",
    description: "Overview of all thesis submissions, approvals, and rejections",
    category: "Academic",
    icon: <FileText className="h-6 w-6" />,
    color: "text-blue-500 bg-blue-50",
    fields: ["title", "author", "advisor", "status", "submission_date", "approval_date", "category"],
  },
  {
    id: "user-activity",
    name: "User Activity Report",
    description: "User engagement and activity statistics",
    category: "Analytics",
    icon: <Users className="h-6 w-6" />,
    color: "text-purple-500 bg-purple-50",
    fields: ["user_name", "role", "last_login", "thesis_count", "review_count"],
  },
  {
    id: "download-stats",
    name: "Download Statistics",
    description: "Most downloaded theses and download trends",
    category: "Analytics",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "text-green-500 bg-green-50",
    fields: ["thesis_title", "author", "download_count", "category", "publish_date"],
  },
  {
    id: "department-overview",
    name: "Department Overview",
    description: "Thesis statistics by department and category",
    category: "Academic",
    icon: <BarChart3 className="h-6 w-6" />,
    color: "text-orange-500 bg-orange-50",
    fields: ["department", "category", "thesis_count", "approval_rate", "avg_review_time"],
  },
  {
    id: "advisor-workload",
    name: "Advisor Workload Report",
    description: "Track student supervision and thesis progress per advisor",
    category: "Management",
    icon: <Users className="h-6 w-6" />,
    color: "text-indigo-500 bg-indigo-50",
    fields: ["advisor_name", "department", "total_students", "active_theses", "completed_theses"],
  },
  {
    id: "at-risk-students",
    name: "At-Risk Students Report",
    description: "Identify students with no thesis updates for >30 days",
    category: "Management",
    icon: <AlertCircle className="h-6 w-6" />,
    color: "text-red-500 bg-red-50",
    fields: ["student_name", "email", "thesis_title", "advisor", "last_update", "days_inactive", "status"],
  },
]

export default function ReportsPage() {
  const [user] = useState(mockUser)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [reportName, setReportName] = useState("")
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [reportFormat, setReportFormat] = useState("csv")
  const [filterCategory, setFilterCategory] = useState("all")
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    usersCount: 0
  });
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/reports');
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch report stats:", error);
      }
    }
    fetchStats();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/reports/history');
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template)
    setReportName(`${template.name} - ${format(new Date(), "MMMM yyyy")}`)
    setSelectedFields(template.fields.slice(0, 5))
    setIsSheetOpen(true)
  }

  const handleFieldToggle = (field: string, checked: boolean) => {
    if (checked) {
      setSelectedFields([...selectedFields, field])
    } else {
      setSelectedFields(selectedFields.filter((f) => f !== field))
    }
  }

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate,
          fields: selectedFields,
          dateRange,
          reportName
        })
      });

      if (response.ok) {
        // Download File
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportName}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        
        // Refresh History & Close Sheet
        fetchHistory();
        setIsSheetOpen(false);
      } else {
        console.error("Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
    }
  }

  const filteredTemplates = reportTemplates.filter((template) =>
    filterCategory === "all" ? true : template.category.toLowerCase() === filterCategory,
  )

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate comprehensive reports and export data</p>
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="management">Management</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Total Theses</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <BookOpen className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                        <p className="text-2xl font-bold">{stats.usersCount}</p>
                    </div>
                    <div className="p-3 bg-secondary/10 rounded-full text-secondary">
                        <Users className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Approved</p>
                        <p className="text-2xl font-bold">{stats.approved}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                        <CheckCircle className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold">{stats.pending}</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                        <Clock className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>
        </div>

        <Separator />

        {/* Report Templates Grid */}
        <div>
            <h2 className="text-xl font-heading font-semibold mb-4">Available Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                <Card
                    key={template.id}
                    className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-transparent hover:border-primary/20"
                    onClick={() => handleTemplateSelect(template)}
                >
                    <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${template.color}`}>
                            {template.icon}
                        </div>
                        <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                            {template.category}
                        </Badge>
                    </div>
                    <h3 className="font-heading font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {template.description}
                    </p>
                    <div className="flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                        Configure Report <ChevronRight className="ml-1 h-4 w-4" />
                    </div>
                    </CardContent>
                </Card>
                ))}
            </div>
        </div>

        {/* Recent Reports */}
        <Card>
            <CardHeader>
            <CardTitle className="font-heading">Recent Reports</CardTitle>
            <CardDescription>History of generated reports</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {history.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No reports generated yet</p>
                </div>
                ) : (
                <div className="divide-y divide-border">
                    {history.map((report) => (
                    <div
                        key={report._id}
                        className="flex items-center justify-between py-4 hover:bg-muted/50 px-2 rounded-md transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-muted rounded-md">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground">{report.reportName}</h4>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    {report.template} 
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                    {new Date(report.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground font-mono">{report.fileSize}</span>
                            <Badge variant={report.status === 'completed' ? 'default' : 'destructive'}>
                                {report.status}
                            </Badge>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>
            </CardContent>
        </Card>

        {/* Configuration Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="sm:max-w-md overflow-y-auto p-0">
                <SheetHeader className="px-6 pt-6">
                    <SheetTitle>Configure Report</SheetTitle>
                    <SheetDescription>
                        Customize settings for <strong>{selectedTemplate?.name}</strong>
                    </SheetDescription>
                </SheetHeader>
                
                {selectedTemplate && (
                    <div className="space-y-6 px-6 py-6">
                         {/* Report Name */}
                        <div className="space-y-2">
                            <Label htmlFor="report-name">Report Name</Label>
                            <Input
                                id="report-name"
                                value={reportName}
                                onChange={(e) => setReportName(e.target.value)}
                                placeholder="Enter report name"
                            />
                        </div>

                        {/* Date Range */}
                        <div className="space-y-2">
                            <Label>Date Range</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button variant="outline" className="justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.from ? format(dateRange.from, "PPP") : "From"}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.from}
                                        onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button variant="outline" className="justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.to ? format(dateRange.to, "PPP") : "To"}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.to}
                                        onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Fields Selection */}
                        <div className="space-y-2">
                            <Label>Include Fields</Label>
                            <div className="border rounded-md p-4 space-y-3 max-h-[300px] overflow-y-auto bg-muted/10">
                                {selectedTemplate.fields.map((field: string) => (
                                <div key={field} className="flex items-center space-x-2">
                                    <Checkbox
                                    id={`field-${field}`}
                                    checked={selectedFields.includes(field)}
                                    onCheckedChange={(checked) => handleFieldToggle(field, checked as boolean)}
                                    />
                                    <Label htmlFor={`field-${field}`} className="text-sm capitalize cursor-pointer">
                                    {field.replace("_", " ")}
                                    </Label>
                                </div>
                                ))}
                            </div>
                        </div>

                        {/* Format Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="format">Export Format</Label>
                            <Select value={reportFormat} onValueChange={setReportFormat}>
                                <SelectTrigger>
                                <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <SheetFooter className="px-6 pb-6 sm:justify-between">
                    <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                    <Button onClick={handleGenerateReport} disabled={!reportName || selectedFields.length === 0}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
      </div>
  )
}
