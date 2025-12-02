// app/dashboard/thesis/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, MessageSquare, UploadCloud, Download, Edit, AlertCircle, Trash2 } from "lucide-react"
import Link from "next/link"

interface IThesis {
  _id: string;
  thesis_id: string;
  title: string;
  status: string;
  file_path: string;
  advisor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  chapterApproval?: {
    chapter1: boolean;
    chapter2: boolean;
    chapter3: boolean;
    chapter4: boolean;
    chapter5: boolean;
  };
}

export default function MyThesisPage() {
  const [theses, setTheses] = useState<IThesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMyTheses() {
      try {
        const res = await fetch('/api/thesis/my');
        if (!res.ok) {
          throw new Error('Failed to fetch data');
        }
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data.success) {
            setTheses(data.theses);
          } else {
            throw new Error(data.error || 'Failed to fetch theses');
          }
        } catch (e) {
          console.error("JSON Parse Error. Response text:", text);
          setError(`Invalid server response: ${text.substring(0, 200)}`);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMyTheses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this thesis? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);

    try {
      const res = await fetch(`/api/thesis/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {

        setTheses(prev => prev.filter(t => t._id !== id));
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting.");
    } finally {
      setDeletingId(null);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } } // Animation ตอนลบ
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h2 className="text-xl font-bold text-destructive">Failed to load theses</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">My Thesis</h1>
            <p className="text-muted-foreground">Here is a list of all your thesis submissions and their status.</p>
          </div>
          {/* ปุ่ม Upload มุมขวาบน (เผื่ออยากเพิ่มงาน) */}
          {theses.length > 0 && (
            <Button asChild className="bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-md">
              <Link href="/dashboard/upload">
                <UploadCloud className="h-4 w-4 mr-2" /> New Submission
              </Link>
            </Button>
          )}
        </div>
      </motion.div>

      {theses.length === 0 ? (
        <motion.div
          className="text-center p-16 bg-muted/20 rounded-3xl border-2 border-dashed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Thesis Found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You haven't uploaded any thesis yet. Start by submitting your research proposal or draft.
          </p>
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/dashboard/upload">Start Uploading</Link>
          </Button>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {theses.map((thesis) => (
              <motion.div key={thesis._id} variants={itemVariants} layout exit="exit">
                <Card className="rounded-2xl border-0 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Badge variant="outline" className="bg-background text-muted-foreground">
                          {thesis.thesis_id}
                        </Badge>
                        {getStatusBadge(thesis.status)}
                      </div>
                      <CardTitle className="font-heading text-xl text-primary">
                        <Link href={`/dashboard/thesis/${thesis._id}`} className="hover:underline decoration-2 underline-offset-4">
                          {thesis.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        Advisor: <span className="font-medium text-foreground">{thesis.advisor ? `${thesis.advisor.firstName} ${thesis.advisor.lastName}` : 'Unknown Advisor'}</span>
                        <span className="text-muted-foreground/50">•</span>
                        Submitted: {new Date(thesis.createdAt).toLocaleDateString()}
                      </CardDescription>
                      
                      {/* Progress Bar */}
                      <div className="w-full max-w-md mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                           <span>Progress</span>
                           <span>
                             {(() => {
                               if (thesis.status === 'approved') return "100%";
                               if (!thesis.chapterApproval) return "0%";
                               const passed = Object.values(thesis.chapterApproval).filter(Boolean).length;
                               return `${Math.round((passed / 5) * 100)}%`;
                             })()}
                           </span>
                        </div>
                        <Progress value={(() => {
                             if (thesis.status === 'approved') return 100;
                             if (!thesis.chapterApproval) return 0;
                             const passed = Object.values(thesis.chapterApproval).filter(Boolean).length;
                             return (passed / 5) * 100;
                        })()} className="h-2" />
                      </div>
                    </div>

                    {/* ปุ่ม Action Group */}
                    <div className="flex gap-2 self-start">
                      {/* ปุ่ม Delete (เพิ่มใหม่) */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(thesis._id)}
                        disabled={deletingId === thesis._id}
                        className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 border hover:border-red-300 shadow-none"
                      >
                        {deletingId === thesis._id ? (
                          <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3">
                      <Button variant="default" size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                        <Link href={`/dashboard/thesis/${thesis._id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="hover:bg-muted">
                        <Link href={`/dashboard/thesis/${thesis._id}#feedback`}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Feedback
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="hover:bg-muted">
                        <a href={thesis.file_path} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </a>
                      </Button>
                      {/* <Button variant="secondary" size="sm" asChild>
                       <Link href="/dashboard/upload">
                         <UploadCloud className="h-4 w-4 mr-2" />
                         New Version
                       </Link>
                    </Button> 
                    */}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}