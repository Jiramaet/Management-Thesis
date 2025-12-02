"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Clock, CheckCircle, XCircle, Eye, MessageSquare, Calendar, User, FileText, Loader2, ExternalLink, Search, Percent } from "lucide-react" // (เพิ่ม ExternalLink)
import Link from "next/link" // (เพิ่ม Link)

interface IThesis {
  _id: string;
  thesis_id: string;
  title: string;
  abstract: string;
  category: string;
  status: string;
  file_path: string;
  createdAt: string;
  updatedAt: string;
  author: {
    firstName: string;
    lastName: string;
    email: string;
    department: string;
  };
  chapterApproval: {
    chapter1: boolean;
    chapter2: boolean;
    chapter3: boolean;
    chapter4: boolean;
    chapter5: boolean;
  };
  similarityScore?: number;
  unreadCommentsCount?: number;
}

export default function ReviewsPage() {
  const [theses, setTheses] = useState<IThesis[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [selectedThesis, setSelectedThesis] = useState<IThesis | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewDecision, setReviewDecision] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const resUser = await fetch('/api/auth/me');
        if (!resUser.ok) throw new Error('Not authenticated');
        const dataUser = await resUser.json();
        
        if (dataUser.success && dataUser.user.role === 'advisor') {
            const resThesis = await fetch('/api/thesis/advisor');
            const dataThesis = await resThesis.json();
            if (dataThesis.success) {
              setTheses(dataThesis.theses);
            }
        } else {
             router.push('/dashboard');
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const handleReviewSubmit = async () => {
    if (!selectedThesis || !reviewDecision) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/thesis/${selectedThesis._id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            status: reviewDecision, 
            comment: reviewFeedback 
        })
      });

      const data = await res.json();

      if (data.success) {
        setTheses(prev => prev.map(t => 
            t._id === selectedThesis._id ? { ...t, status: reviewDecision, updatedAt: new Date().toISOString() } : t
        ));
        setIsReviewDialogOpen(false);
        setReviewFeedback("");
        setReviewDecision("");
        setSelectedThesis(null);
      } else {
        alert(data.error || "Review failed");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
      case "rejected": return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
      default: return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const getStatusBorderColor = (status: string) => {
      switch (status) {
          case "pending": return "border-l-amber-400";
          case "approved": return "border-l-emerald-500";
          case "rejected": return "border-l-rose-500";
          default: return "border-l-slate-300";
      }
  }

  const getScoreColor = (score: number) => {
      if (score < 20) return "text-emerald-600 bg-emerald-50 border-emerald-100";
      if (score < 50) return "text-amber-600 bg-amber-50 border-amber-100";
      return "text-rose-600 bg-rose-50 border-rose-100";
  }

  const getApprovedChaptersCount = (chapters: any) => {
      if (!chapters) return 0;
      return Object.values(chapters).filter((status: any) => status === true).length;
  }

  const getDaysUntilDeadline = (createdAt: string) => {
    const created = new Date(createdAt);
    const deadline = new Date(created);
    deadline.setDate(created.getDate() + 30);
    const today = new Date();
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  // Filter & Sort Logic
  const filteredTheses = theses.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.author?.firstName + ' ' + t.author?.lastName).toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
  }).sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortOption === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return 0;
  });

  const pendingReviews = filteredTheses.filter(t => t.status === 'pending');
  const completedReviews = filteredTheses.filter(t => t.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-screen"> 
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Thesis Reviews</h1>
            <p className="text-slate-500 mt-1">Manage and track student thesis submissions</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border shadow-sm">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Search..." 
                    className="pl-9 border-0 bg-transparent focus-visible:ring-0 placeholder:text-slate-400 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[140px] border-0 bg-transparent focus:ring-0 h-9 text-slate-600 font-medium">
                    <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent align="end">
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-8">
        <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-slate-100/80 backdrop-blur rounded-xl">
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium transition-all">
              Pending ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium transition-all">
              Completed ({completedReviews.length})
          </TabsTrigger>
        </TabsList>

        {/* --- Tab: Pending --- */}
        <TabsContent value="pending" className="space-y-6">
          {pendingReviews.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-slate-500">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
                <p className="text-sm">No pending reviews at the moment.</p>
             </div>
          ) : (
             <div className="grid gap-4">
              {pendingReviews.map((thesis) => (
                <Card key={thesis._id} className={`group hover:shadow-lg transition-all duration-300 border-l-4 ${getStatusBorderColor(thesis.status)} overflow-hidden bg-white/50 hover:bg-white backdrop-blur-sm`}>
                  {/* Unread Indicator */}
                  {thesis.unreadCommentsCount && thesis.unreadCommentsCount > 0 ? (
                      <div className="absolute top-3 right-3 z-10">
                          <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                          </span>
                      </div>
                  ) : null}

                  <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                      {/* Header Section */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-50 border-slate-200">
                                      {thesis.category || "Thesis"}
                                  </Badge>
                                  <span className="text-xs text-slate-400">•</span>
                                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(thesis.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                              </div>
                              <Link href={`/dashboard/thesis/${thesis._id}`} className="block group-hover:text-primary transition-colors">
                                 <h3 className="text-xl font-heading font-bold text-slate-900 leading-tight">
                                     {thesis.title}
                                 </h3>
                              </Link>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                  <User className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-medium text-slate-700">
                                  {thesis.author ? `${thesis.author.firstName} ${thesis.author.lastName}` : 'Unknown Student'}
                              </span>
                            </div>
                            <div className={`flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-md ${getDaysUntilDeadline(thesis.createdAt) < 7 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                              <Clock className="h-3.5 w-3.5" />
                              {getDaysUntilDeadline(thesis.createdAt)} days left
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <Badge className={`${getStatusColor(thesis.status)} px-3 py-1 text-xs font-semibold shadow-sm`} variant="outline">
                            {thesis.status}
                          </Badge>
                          <div className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-sm ${getScoreColor(thesis.similarityScore || 0)}`}>
                              <Percent className="h-3.5 w-3.5" />
                              {thesis.similarityScore ?? 0}% Similarity
                          </div>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
                          <div className="flex justify-between items-end">
                              <div className="space-y-1">
                                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</span>
                                  <div className="flex items-baseline gap-1">
                                      <span className="text-2xl font-bold text-slate-900">{getApprovedChaptersCount(thesis.chapterApproval)}</span>
                                      <span className="text-sm font-medium text-slate-400">/ 5 Chapters</span>
                                  </div>
                              </div>
                              <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                                  {Math.round((getApprovedChaptersCount(thesis.chapterApproval) / 5) * 100)}% Complete
                              </span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                  className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${getApprovedChaptersCount(thesis.chapterApproval) === 5 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}
                                  style={{ width: `${(getApprovedChaptersCount(thesis.chapterApproval) / 5) * 100}%` }}
                              />
                          </div>
                      </div>

                      {/* Abstract */}
                      <div className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                          {thesis.abstract}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-3">
                          <Button variant="default" size="sm" asChild className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow transition-all rounded-lg px-4">
                            <Link href={`/dashboard/thesis/${thesis._id}`}>
                                <FileText className="h-4 w-4 mr-2" />
                                Review Details
                            </Link>
                          </Button>
                          
                          <Button variant="outline" size="sm" asChild className="border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg">
                            <a href={thesis.file_path} download target="_blank">
                                <Eye className="h-4 w-4 mr-2" />
                                View File
                            </a>
                          </Button>
                        </div>

                        <Dialog open={isReviewDialogOpen && selectedThesis?._id === thesis._id} onOpenChange={(open) => {
                              setIsReviewDialogOpen(open);
                              if(!open) setSelectedThesis(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => setSelectedThesis(thesis)} className="text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Quick Decision
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Review Decision</DialogTitle>
                                <DialogDescription>Make a decision for "{selectedThesis?.title}"</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Decision</Label>
                                  <Select value={reviewDecision} onValueChange={setReviewDecision}>
                                    <SelectTrigger><SelectValue placeholder="Select decision" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="approved">Approve</SelectItem>
                                      <SelectItem value="rejected">Reject</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Quick Note (Optional)</Label>
                                  <Textarea 
                                    value={reviewFeedback} 
                                    onChange={(e) => setReviewFeedback(e.target.value)} 
                                    placeholder="Add a short note..."
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleReviewSubmit} disabled={!reviewDecision || isSubmitting}>
                                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
             </div>
          )}
        </TabsContent>

        {/* --- Tab: Completed --- */}
        <TabsContent value="completed" className="space-y-6">
          <div className="grid gap-4">
            {completedReviews.map((thesis) => (
              <Card key={thesis._id} className={`group hover:shadow-md transition-all duration-300 border-l-4 ${getStatusBorderColor(thesis.status)} bg-slate-50/50`}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                             <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider text-slate-400 border-slate-200">
                                  {thesis.category || "Thesis"}
                             </Badge>
                        </div>
                        <h3 className="text-lg font-heading font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                            {thesis.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                           <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {thesis.author ? `${thesis.author.firstName} ${thesis.author.lastName}` : 'Unknown'}</span>
                           <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Reviewed {new Date(thesis.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                          <Badge className={getStatusColor(thesis.status)} variant="outline">{thesis.status}</Badge>
                          <div className={`text-xs font-medium px-2 py-1 rounded-lg border flex items-center gap-1 ${getScoreColor(thesis.similarityScore || 0)} opacity-80`}>
                              <Percent className="h-3 w-3" />
                              {thesis.similarityScore ?? 0}% Similarity
                          </div>
                      </div>
                    </div>

                    {/* Progress Bar (Compact) */}
                    <div className="space-y-1.5 opacity-75">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Final Progress</span>
                            <span>{getApprovedChaptersCount(thesis.chapterApproval)}/5 Chapters</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${getApprovedChaptersCount(thesis.chapterApproval) === 5 ? "bg-emerald-400" : "bg-slate-400"}`}
                                style={{ width: `${(getApprovedChaptersCount(thesis.chapterApproval) / 5) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-primary hover:bg-slate-100 -ml-2">
                            <Link href={`/dashboard/thesis/${thesis._id}`}>
                                <ExternalLink className="h-4 w-4 mr-2" /> View History
                            </Link>
                        </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}