"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useDropzone } from "react-dropzone"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, X, CheckCircle, AlertCircle, File, Loader2 } from "lucide-react"

// (Interface User ถูกต้องแล้ว)
interface User {
  id: string
  firstname: string 
  lastname: string 
  email: string
  role: string
  department: string
}

interface UploadedFile {
  file: File
  id: string
  progress: number
  status: "pending" | "uploading" | "completed" | "error"
  error?: string
}

// 1. --- เพิ่ม Interface สำหรับ Advisor ---
interface Advisor {
  _id: string;
  firstName: string;
  lastName: string;
}
// ------------------------------------

export default function UploadPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // 2. --- เพิ่ม State สำหรับ Advisor List ---
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [advisorLoading, setAdvisorLoading] = useState(true);
  // ----------------------------------------
  
  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    keywords: "",
    category: "",
    advisor: "", // (นี่จะเป็น ID ของอาจารย์ที่เลือก)
    coAdvisor: "",
    year: new Date().getFullYear().toString(),
    accessLevel: "university",
    language: "english",
    department: "",
  })
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending" as const,
    }))
    setUploadedFiles(newFiles.slice(0, 1)); 
    setError(null);
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  })

  // (UseEffect นี้สำหรับโหลด User ที่ Login)
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setFormData(prev => ({ ...prev, department: parsedUser.department || "" }))
  }, [router])

  // 3. --- เพิ่ม UseEffect สำหรับดึงรายชื่อ Advisor ---
  useEffect(() => {
    async function fetchAdvisors() {
      setAdvisorLoading(true);
      try {
        const res = await fetch('/api/users/advisors');
        const data = await res.json();
        if (data.success) {
          setAdvisors(data.advisors);
        } else {
          console.error("Failed to fetch advisors:", data.error);
        }
      } catch (e) {
        console.error("Failed to fetch advisors", e);
      }
      setAdvisorLoading(false);
    }
    fetchAdvisors();
  }, []); // ( [] = รันครั้งเดียวตอนหน้าโหลด)
  // ------------------------------------------------

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // 4. --- อัปเกรด handleSubmit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || uploadedFiles.length === 0) {
      setError("Please select a file to upload.");
      return
    }
    
    // (เพิ่มการตรวจสอบ Advisor)
    if (formData.advisor === "") {
        setError("Please select a Primary Advisor.");
        return;
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const fileToUpload = uploadedFiles[0].file;
    
    const data = new FormData();
    data.append('file', fileToUpload);
    data.append('title', formData.title);
    data.append('abstract', formData.abstract);
    data.append('author', user.id); 
    
    // (ลบ Mock ID ออก และใช้ ID จริงจาก formData)
    data.append('advisor', formData.advisor); 
    
    data.append('keywords', formData.keywords);
    data.append('category', formData.category);
    data.append('year', formData.year);
    data.append('department', formData.department);

    try {
      const res = await fetch('/api/thesis/upload', {
        method: 'POST',
        body: data, 
      });

      const result = await res.json();

      if (result.success) {
        setSuccess("Thesis uploaded successfully!");
        setUploadedFiles([]);
        router.push('/dashboard/thesis'); 
      } else {
        setError(result.error || "Upload failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }

    setIsLoading(false)
  }
  // ------------------------------------

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return <FileText className="h-8 w-8 text-red-500" />
      case "doc":
      case "docx":
        return <FileText className="h-8 w-8 text-blue-500" />
      case "zip":
        return <File className="h-8 w-8 text-yellow-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  // (โค้ด Variants เหมือนเดิม)
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, }, }, };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }, };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DashboardLayout user={user}> 
      <div className="p-6">
        <motion.div className="max-w-4xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div className="mb-8" variants={itemVariants}>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Upload Thesis</h1>
            <p className="text-muted-foreground">Submit your thesis for review and publication</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Upload Section (เหมือนเดิม) */}
            <motion.div variants={itemVariants}>
              <motion.div
                whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                transition={{ duration: 0.2 }}
              >
                <Card className="rounded-2xl border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-heading">Upload Files</CardTitle>
                    <CardDescription>
                      Upload your thesis file (PDF or DOCX). Maximum file size: 50MB
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                        isDragActive
                          ? "border-primary bg-primary/5 scale-[1.02]"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <input {...getInputProps()} />
                      <motion.div animate={isDragActive ? { scale: 1.1 } : { scale: 1 }} transition={{ duration: 0.2 }}>
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      </motion.div>
                      {isDragActive ? (
                        <p className="text-lg font-medium text-primary">Drop the file here...</p>
                      ) : (
                        <div>
                          <p className="text-lg font-medium text-foreground mb-2">
                            Drag & drop one file here, or click to select
                          </p>
                          <p className="text-sm text-muted-foreground">Supported formats: PDF, DOCX</p>
                        </div>
                      )}
                    </motion.div>

                    {uploadedFiles.length > 0 && (
                      <motion.div
                        className="mt-6 space-y-3"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className="font-medium text-foreground">Selected File</h4>
                        {uploadedFiles.map((uploadFile, index) => (
                          <motion.div
                            key={uploadFile.id}
                            className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card/50"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
                          >
                            {getFileIcon(uploadFile.file.name)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{uploadFile.file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(uploadFile.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Thesis Metadata */}
            <motion.div variants={itemVariants}>
              <motion.div
                whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                transition={{ duration: 0.2 }}
              >
                <Card className="rounded-2xl border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-heading">Thesis Information</CardTitle>
                    <CardDescription>Provide details about your thesis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Thesis Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter your thesis title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="rounded-xl"
                      />
                    </div>

                    {/* Abstract */}
                    <div className="space-y-2">
                      <Label htmlFor="abstract">Abstract *</Label>
                      <Textarea
                        id="abstract"
                        placeholder="Provide a brief summary of your thesis..."
                        value={formData.abstract}
                        onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                        rows={4}
                        required
                        className="rounded-xl"
                      />
                    </div>

                    {/* Keywords */}
                    <div className="space-y-2">
                      <Label htmlFor="keywords">Keywords</Label>
                      <Input
                        id="keywords"
                        placeholder="machine learning, healthcare, AI (comma-separated)"
                        value={formData.keywords}
                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>

                    {/* Category and Year (เหมือนเดิม) */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* ... (Category) ... */}
                       <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                          required
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="computer-science">Computer Science</SelectItem>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* ... (Year) ... */}
                      <div className="space-y-2">
                        <Label htmlFor="year">Year *</Label>
                        <Input
                          id="year"
                          type="number"
                          min="2000"
                          max="2030"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                          required
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Advisors */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* --- 5. เปลี่ยน Input เป็น Select --- */}
                      <div className="space-y-2">
                        <Label htmlFor="advisor">Primary Advisor *</Label>
                        <Select
                          value={formData.advisor}
                          onValueChange={(value) => setFormData({ ...formData, advisor: value })}
                          disabled={advisorLoading} // (ปิดขณะโหลด)
                          required
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder={advisorLoading ? "Loading advisors..." : "Select advisor"} />
                          </SelectTrigger>
                          <SelectContent>
                            {!advisorLoading && advisors.length === 0 && (
                              <SelectItem value="none" disabled>No advisors found</SelectItem>
                            )}
                            {advisors.map((advisor) => (
                              <SelectItem key={advisor._id} value={advisor._id}>
                                {advisor.firstName} {advisor.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* ---------------------------------- */}

                      <div className="space-y-2">
                        <Label htmlFor="coAdvisor">Co-Advisor (Optional)</Label>
                        <Input
                          id="coAdvisor"
                          placeholder="Dr. John Johnson"
                          value={formData.coAdvisor}
                          onChange={(e) => setFormData({ ...formData, coAdvisor: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Language and Department (เหมือนเดิม) */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* ... (Language) ... */}
                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select
                          value={formData.language}
                          onValueChange={(value) => setFormData({ ...formData, language: value })}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* ... (Department) ... */}
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          required
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Access Control (เหมือนเดิม) */}
            <motion.div variants={itemVariants}>
              {/* ... (โค้ด Access Control) ... */}
            </motion.div>

            {/* Submit Button */}
            <motion.div className="flex justify-end gap-4" variants={itemVariants}>
              <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }} transition={{ duration: 0.2 }}>
                <Button type="button" variant="outline" className="rounded-xl bg-transparent">
                  Save as Draft
                </Button>
              </motion.div>
              <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }} transition={{ duration: 0.2 }}>
                <Button
                  type="submit"
                  disabled={uploadedFiles.length === 0 || !formData.title || !formData.abstract || isLoading || advisorLoading}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit for Review"
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}