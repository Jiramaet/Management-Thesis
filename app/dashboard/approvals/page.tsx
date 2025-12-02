"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  CheckCircle, XCircle, Clock, FileText, User, Loader2, AlertCircle, 
  Eye, MessageSquare, Search, Filter, ArrowUpDown, MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface IThesis {
  _id: string;
  thesis_id: string;
  title: string;
  abstract: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  file_path: string;
  isPublic?: boolean;
  author: {
    firstName: string;
    lastName: string;
    user_id: string;
    department: string;
  };
  chapterApproval?: {
    chapter1: boolean;
    chapter2: boolean;
    chapter3: boolean;
    chapter4: boolean;
    chapter5: boolean;
  };
  unreadCommentsCount?: number;
}

export default function ApprovalsPage() {
  const [theses, setTheses] = useState<IThesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null); 
  const router = useRouter();

  // New State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [selectedTheses, setSelectedTheses] = useState<string[]>([]);
  const [previewThesis, setPreviewThesis] = useState<IThesis | null>(null);
  const [rejectThesisId, setRejectThesisId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Confirmation Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
      type: 'approve' | 'reject' | 'public';
      title: string;
      description: string;
      actionLabel: string;
      actionClass?: string;
      data: string; // thesisId
  } | null>(null);

  // Filter & Sort Logic
  const filteredTheses = useMemo(() => {
    let result = [...theses]; // Clone array

    // Search
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(lower) || 
        t.thesis_id.toLowerCase().includes(lower) ||
        t.author.firstName.toLowerCase().includes(lower) ||
        t.author.lastName.toLowerCase().includes(lower)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === 'id') return a.thesis_id.localeCompare(b.thesis_id);
      return 0;
    });

    // Filter out public theses (they should disappear from this page)
    result = result.filter(t => !t.isPublic);

    return result;
  }, [theses, searchQuery, sortBy]);

  // 1. ดึงข้อมูล Thesis ของ Advisor คนนี้
  useEffect(() => {
    async function fetchAdvisorTheses() {
      try {
        const res = await fetch('/api/thesis/advisor'); // (ใช้ API เดิมที่ดึงงานของ Advisor)
        const data = await res.json();
        
        if (data.success) {
          setTheses(data.theses);
        } else {
          console.error("Failed to fetch:", data.error);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAdvisorTheses();
  }, []);

  // Bulk Actions
  const handleBulkApprove = async () => {
    if (!confirm(`Approve ${selectedTheses.length} selected theses?`)) return;
    // setLoading(true); // Don't block whole UI, maybe just show loading on button
    try {
        await Promise.all(selectedTheses.map(id => 
            fetch(`/api/thesis/${id}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved' })
            })
        ));
        // Refresh data
        const res = await fetch('/api/thesis/advisor');
        const data = await res.json();
        if (data.success) setTheses(data.theses);
        setSelectedTheses([]);
    } catch (error) {
        console.error("Bulk approve error:", error);
        alert("Some items failed to update");
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedTheses(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  const toggleSelectAll = () => {
    if (selectedTheses.length === pendingTheses.length) {
        setSelectedTheses([]);
    } else {
        setSelectedTheses(pendingTheses.map(t => t._id));
    }
  }

  // 2. ฟังก์ชันกด Approve / Reject
  const handleReviewClick = (thesisId: string, status: 'approved' | 'rejected') => {
      if (status === 'rejected') {
          setRejectThesisId(thesisId);
          return;
      }
      
      setConfirmConfig({
          type: 'approve',
          title: "Approve Thesis",
          description: "Are you sure you want to approve this thesis? It will be moved to the History tab.",
          actionLabel: "Approve",
          actionClass: "bg-green-600 hover:bg-green-700",
          data: thesisId
      });
      setConfirmOpen(true);
  }

  const executeReview = async (thesisId: string, status: 'approved' | 'rejected') => {
    setProcessingId(thesisId);
    try {
        const res = await fetch(`/api/thesis/${thesisId}/review`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await res.json();

        if (data.success) {
            setTheses(prev => prev.map(t => 
                t._id === thesisId ? { ...t, status: status } : t
            ));
        } else {
            alert(data.error || "Action failed");
        }
    } catch (error) {
        console.error("Review error:", error);
        alert("An error occurred");
    } finally {
        setProcessingId(null);
        setConfirmOpen(false);
    }
  }

  const handleRejectSubmit = async () => {
      if (!rejectThesisId || !rejectReason.trim()) return;
      setProcessingId(rejectThesisId);
      
      try {
          // 1. Update Status
          const res = await fetch(`/api/thesis/${rejectThesisId}/review`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'rejected' })
          });
          
          // 2. Post Comment (Reason)
          await fetch(`/api/thesis/${rejectThesisId}/comments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: `[REJECTED]: ${rejectReason}` })
          });

          const data = await res.json();
          if (data.success) {
              setTheses(prev => prev.map(t => 
                  t._id === rejectThesisId ? { ...t, status: 'rejected' } : t
              ));
              setRejectThesisId(null);
              setRejectReason("");
          }
      } catch (error) {
          console.error("Reject error:", error);
      } finally {
          setProcessingId(null);
      }
  }

  const handleMakePublicClick = (thesisId: string) => {
      setConfirmConfig({
          type: 'public',
          title: "Make Thesis Public",
          description: "Are you sure you want to make this thesis public? It will be visible to everyone and removed from the approvals list.",
          actionLabel: "Make Public",
          actionClass: "bg-blue-600 hover:bg-blue-700",
          data: thesisId
      });
      setConfirmOpen(true);
  }

  const executeMakePublic = async (thesisId: string) => {
    setProcessingId(thesisId);
    try {
        // First ensure it's approved (redundant check but safe)
        await fetch(`/api/thesis/${thesisId}/review`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' })
        });

        // Then make public
        const res = await fetch(`/api/thesis/${thesisId}/review`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPublic: true })
        });

        const data = await res.json();
        if (data.success) {
            // Remove from list locally
            setTheses(prev => prev.map((t: IThesis) => 
                t._id === thesisId ? { ...t, status: 'approved', isPublic: true } : t
            ));
        } else {
            alert(data.error || "Action failed");
        }
    } catch (error) {
        console.error("Make public error:", error);
    } finally {
        setProcessingId(null);
        setConfirmOpen(false);
    }
  }

  const handleConfirmAction = () => {
      if (!confirmConfig) return;
      if (confirmConfig.type === 'approve') {
          executeReview(confirmConfig.data, 'approved');
      } else if (confirmConfig.type === 'public') {
          executeMakePublic(confirmConfig.data);
      }
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  // แยกข้อมูลตามสถานะจาก filteredTheses
  const pendingTheses = filteredTheses.filter(t => t.status === 'pending');
  const historyTheses = filteredTheses.filter(t => t.status !== 'pending');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Approvals</h1>
            <p className="text-muted-foreground">Manage and review thesis approval requests</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-[250px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search thesis, student..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        <SelectValue />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="latest">Latest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="id">ID</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="pending">Pending ({pendingTheses.length})</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            {selectedTheses.length > 0 && (
                <Button onClick={handleBulkApprove} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                    <CheckCircle className="h-4 w-4" /> Approve Selected ({selectedTheses.length})
                </Button>
            )}
        </div>

        {/* --- Tab: Pending --- */}
        <TabsContent value="pending" className="space-y-4">
          {pendingTheses.length > 0 && (
              <div className="flex items-center gap-2 mb-2 px-2">
                  <Checkbox 
                    checked={selectedTheses.length === pendingTheses.length && pendingTheses.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
              </div>
          )}

          {pendingTheses.length === 0 ? (
             <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500/50" />
                <p>No pending requests. You're all caught up!</p>
             </div>
          ) : (
            pendingTheses.map((thesis) => (
                <Card key={thesis._id} className={`hover:shadow-md transition-shadow ${selectedTheses.includes(thesis._id) ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        <Checkbox 
                            checked={selectedTheses.includes(thesis._id)}
                            onCheckedChange={() => toggleSelect(thesis._id)}
                            className="mt-1"
                        />
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{thesis.thesis_id}</Badge>
                                <span className="text-xs text-muted-foreground">{new Date(thesis.createdAt).toLocaleDateString()}</span>
                                {thesis.unreadCommentsCount && thesis.unreadCommentsCount > 0 ? (
                                    <Badge variant="secondary" className="bg-red-100 text-red-600 hover:bg-red-100 gap-1 h-5">
                                        <MessageSquare className="h-3 w-3" /> {thesis.unreadCommentsCount}
                                    </Badge>
                                ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/dashboard/thesis/${thesis._id}`} className="block group">
                                    <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">{thesis.title}</h4>
                                </Link>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setPreviewThesis(thesis)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            {/* Chapter Progress */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Progress:</span>
                                <div className="flex gap-1">
                                    {[1,2,3,4,5].map(num => {
                                        const key = `chapter${num}` as keyof typeof thesis.chapterApproval;
                                        const isPassed = thesis.chapterApproval?.[key];
                                        return (
                                            <div key={num} className={`h-2 w-2 rounded-full ${isPassed ? 'bg-green-500' : 'bg-gray-200'}`} title={`Chapter ${num}`} />
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <User className="h-4 w-4" /> {thesis.author ? `${thesis.author.firstName} ${thesis.author.lastName}` : 'Unknown'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" /> {thesis.author?.department || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto pl-8 md:pl-0">
                        <Button 
                            onClick={() => handleReviewClick(thesis._id, 'approved')}
                            disabled={processingId === thesis._id}
                            className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white"
                        >
                            {processingId === thesis._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Approve
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={() => handleReviewClick(thesis._id, 'rejected')}
                            disabled={processingId === thesis._id}
                            className="flex-1 md:flex-none"
                        >
                             {processingId === thesis._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                            Reject
                        </Button>
                    </div>
                </CardContent>
                </Card>
            ))
          )}
        </TabsContent>
        
        {/* --- Tab: History --- */}
        <TabsContent value="history" className="space-y-4">
          {historyTheses.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">No history found.</div>
          ) : (
             historyTheses.map((thesis) => (
                <Card key={thesis._id} className="opacity-80 hover:opacity-100 transition-opacity">
                  <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                         <Badge variant={thesis.status === 'approved' ? 'secondary' : 'destructive'} className="capitalize">
                            {thesis.status}
                         </Badge>
                         <span className="text-xs text-muted-foreground">Updated: {new Date(thesis.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-semibold text-lg text-muted-foreground">{thesis.title}</h4>
                      <p className="text-sm text-muted-foreground">
                         Student: {thesis.author ? `${thesis.author.firstName} ${thesis.author.lastName}` : 'Unknown'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                        {thesis.status === 'approved' && !thesis.isPublic && (
                            <Button 
                                onClick={() => handleMakePublicClick(thesis._id)}
                                disabled={processingId === thesis._id}
                                variant="outline"
                                size="sm"
                                className="border-green-600 text-green-600 hover:bg-green-50"
                            >
                                {processingId === thesis._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                                Make Public
                            </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/thesis/${thesis._id}`}>View Details</Link>
                        </Button>
                    </div>
                  </CardContent>
                </Card>
             ))
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Preview Dialog */}
      <Dialog open={!!previewThesis} onOpenChange={(open) => !open && setPreviewThesis(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{previewThesis?.thesis_id}</Badge>
                    <Badge className={previewThesis?.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {previewThesis?.status}
                    </Badge>
                </div>
                <DialogTitle className="text-2xl font-heading leading-tight">{previewThesis?.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1"><User className="h-4 w-4" /> {previewThesis?.author.firstName} {previewThesis?.author.lastName}</span>
                    <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> {previewThesis?.author.department}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {previewThesis && new Date(previewThesis.updatedAt).toLocaleDateString()}</span>
                </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="files">Files & Progress</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500" /> Abstract
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {previewThesis?.abstract || "No abstract available."}
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="files" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" /> Chapter Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 gap-2">
                                {[1,2,3,4,5].map(num => {
                                    const key = `chapter${num}` as keyof typeof previewThesis.chapterApproval;
                                    const isPassed = previewThesis?.chapterApproval?.[key];
                                    return (
                                        <div key={num} className={`flex flex-col items-center justify-center p-2 rounded-lg border ${isPassed ? 'bg-green-50 border-green-200' : 'bg-muted/20'}`}>
                                            <span className="text-xs font-medium mb-1">Ch.{num}</span>
                                            {isPassed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <div className="h-4 w-4 rounded-full border-2 border-muted" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4 text-orange-500" /> Current File
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg"><FileText className="h-5 w-5 text-red-500" /></div>
                                    <div className="overflow-hidden">
                                        <p className="font-medium text-sm truncate max-w-[200px]">{previewThesis?.file_path?.split('/').pop() || "No file"}</p>
                                        <p className="text-xs text-muted-foreground">Latest Version</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <a href={previewThesis?.file_path} download target="_blank">Download</a>
                                </Button>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setPreviewThesis(null)}>Close</Button>
                <Button asChild>
                    <Link href={`/dashboard/thesis/${previewThesis?._id}`}>Open Full Details</Link>
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={!!rejectThesisId} onOpenChange={(open) => !open && setRejectThesisId(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reject Thesis</DialogTitle>
                <DialogDescription>
                    Please provide a reason for rejection. This will be sent to the student.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Textarea 
                    placeholder="Reason for rejection..." 
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="min-h-[100px]"
                />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setRejectThesisId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleRejectSubmit} disabled={!rejectReason.trim() || !!processingId}>
                    {processingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirm Reject
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmConfig?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmConfig?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleConfirmAction}
                className={confirmConfig?.actionClass}
            >
                {confirmConfig?.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}