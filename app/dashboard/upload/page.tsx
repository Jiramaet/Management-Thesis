"use client"

import type React from "react"
import { useState, useCallback, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { PanInfo } from "framer-motion"
import { Upload, FileText, X, CheckCircle, AlertCircle, File, Loader2, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface ExistingThesis {
  _id: string;
  title: string;
  thesis_id: string;
  version: number;
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UploadPageContent />
    </Suspense>
  )
}

function UploadPageContent() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const cloneId = searchParams.get('cloneId')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [advisorLoading, setAdvisorLoading] = useState(true);
  const [cloneLoading, setCloneLoading] = useState(false);

  // New State for Update Mode
  const [uploadMode, setUploadMode] = useState<"new" | "update">("new");
  const [myTheses, setMyTheses] = useState<ExistingThesis[]>([]);
  const [selectedThesisId, setSelectedThesisId] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("1");
  const [description, setDescription] = useState<string>("");


  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    keywords: "",
    category: "",
    advisor: "",
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
  }, []);

  // Fetch My Theses for Update Mode
  useEffect(() => {
    if (uploadMode === 'update') {
      async function fetchMyTheses() {
        try {
          const res = await fetch('/api/thesis/my');
          const data = await res.json();
          if (data.success) {
            setMyTheses(data.theses);
          }
        } catch (e) {
          console.error("Failed to fetch my theses", e);
        }
      }
      fetchMyTheses();
    }
  }, [uploadMode]);

  // 3. Fetch Clone Data (ถ้ามี cloneId)
  useEffect(() => {
    if (!cloneId) return;
    console.log("Clone ID detected:", cloneId);

    async function fetchCloneData() {
      try {
        const res = await fetch(`/api/query/thesis/${cloneId}`);
        const data = await res.json();
        console.log("Clone Data Fetched:", data);

        if (data.success && data.thesis) {
          const t = data.thesis;
          console.log("Thesis Data:", t);

          // ตรวจสอบ advisor ว่าเป็น object หรือ string
          let advisorId = "";
          if (t.advisor && typeof t.advisor === 'object' && '_id' in t.advisor) {
            advisorId = t.advisor._id;
          } else if (typeof t.advisor === 'string') {
            advisorId = t.advisor;
          }

          setFormData(prev => {
            const newData = {
              ...prev,
              title: t.title,
              abstract: t.abstract,
              keywords: t.keywords || "",
              category: t.category || "",
              advisor: advisorId,
              year: t.year || new Date().getFullYear().toString(),
              department: t.department || prev.department
            };
            console.log("Setting Form Data to:", newData);
            return newData;
          });
        }
      } catch (error) {
        console.error("Failed to load clone data:", error);
      } finally {
        setCloneLoading(false); // Set loading to false regardless of success or failure
      }
    }
    // รอให้ user load เสร็จก่อนค่อย fetch clone data เพื่อป้องกัน race condition
    // if (user) {
    fetchCloneData();
    // }
  }, [cloneId]); // เอา user ออกจาก dependency array เพื่อให้ทำงานทันทีที่มี cloneId


  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || uploadedFiles.length === 0) {
      setError("Please select a file to upload.");
      return
    }

    if (uploadMode === 'new') {
      if (formData.advisor === "") {
        setError("Please select a Primary Advisor.");
        return;
      }
    } else {
      if (!selectedThesisId) {
        setError("Please select a thesis to update.");
        return;
      }
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const fileToUpload = uploadedFiles[0].file;

    const data = new FormData();
    data.append('file', fileToUpload);
    
    console.log("Submitting form. Mode:", uploadMode);
    console.log("Description value:", description);

    if (uploadMode === 'update') {
      data.append('thesisId', selectedThesisId);
      data.append('chapterNumber', selectedChapter);
      data.append('description', description);
    } else {
      data.append('title', formData.title);
      data.append('abstract', formData.abstract);
      data.append('author', user.id);
      data.append('advisor', formData.advisor);
      data.append('keywords', formData.keywords);
      data.append('category', formData.category);
      data.append('year', formData.year);
      data.append('department', formData.department);
      data.append('description', description);
    }

    try {
      const res = await fetch('/api/thesis/upload', {
        method: 'POST',
        body: data,
      });

      let result;
      try {
        const text = await res.text(); // Read as text first
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON response:", text);
            throw new Error(`Server returned invalid response: ${res.status} ${res.statusText}`);
        }
      } catch (e: any) {
         throw new Error(e.message || "Network response was not ok");
      }

      if (result.success) {
        setSuccess("Thesis uploaded successfully!");
        setUploadedFiles([]);
        router.push('/dashboard/thesis');
      } else {
        setError(result.error || "Upload failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
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
    <div className="p-6">
      <motion.div className="max-w-4xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="mb-8" variants={itemVariants}>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Upload Thesis</h1>
          <p className="text-muted-foreground">Submit your thesis or update an existing one.</p>
        </motion.div>

        <Tabs defaultValue="new" className="mb-8" onValueChange={(v) => setUploadMode(v as "new" | "update")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">New Submission</TabsTrigger>
            <TabsTrigger value="update">Update Existing Thesis</TabsTrigger>
          </TabsList>
        </Tabs>

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

          {/* Update Mode Selection */}
          {uploadMode === 'update' && (
            <motion.div variants={itemVariants}>
              <Card className="rounded-2xl border-0 shadow-lg mb-6">
                <CardHeader>
                  <CardTitle className="font-heading">Select Thesis to Update</CardTitle>
                  <CardDescription>Choose an existing thesis and the chapter you want to upload.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="thesis-select">Select Thesis</Label>
                    <Select value={selectedThesisId} onValueChange={setSelectedThesisId}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select a thesis..." />
                      </SelectTrigger>
                      <SelectContent>
                        {myTheses.map((t) => (
                          <SelectItem key={t._id} value={t._id}>
                            {t.title} ({t.thesis_id}) - v{t.version}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chapter-select">Chapter Number</Label>
                    <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select chapter..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Chapter 1</SelectItem>
                        <SelectItem value="2">Chapter 2</SelectItem>
                        <SelectItem value="3">Chapter 3</SelectItem>
                        <SelectItem value="4">Chapter 4</SelectItem>
                        <SelectItem value="5">Chapter 5</SelectItem>
                        <SelectItem value="full">Full Thesis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Chapter Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="e.g., Fixed typos in introduction, Updated methodology section..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-xl"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

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
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive
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

          {/* Thesis Metadata - Only show if New Submission */}
          {uploadMode === 'new' && (
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

                    {/* Description (Optional) */}
                    <div className="space-y-2">
                      <Label htmlFor="new-description">Version Description (Optional)</Label>
                      <Textarea
                        id="new-description"
                        placeholder="e.g., Initial submission, First draft..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
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
                            <SelectItem value="information-technology">Information Technology</SelectItem>
                            <SelectItem value="business-administration">Business Administration</SelectItem>
                            <SelectItem value="social-sciences">Social Sciences</SelectItem>
                            <SelectItem value="humanities">Humanities</SelectItem>
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
          )}

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
                disabled={uploadedFiles.length === 0 || (uploadMode === 'new' && (!formData.title || !formData.abstract)) || isLoading || advisorLoading}
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
  )
}