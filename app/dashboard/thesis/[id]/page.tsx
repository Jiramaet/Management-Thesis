"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  FileText, User, BookOpen, Calendar, Download, ArrowLeft, 
  MessageSquare, Send, Loader2, CheckCircle, XCircle, AlertTriangle, History,
  Activity, Users, Lock, Percent, PlusCircle, UploadCloud
} from "lucide-react"
import { DateTimePicker } from "@/components/ui/date-time-picker"
// ... (other imports)



interface IThesisDetail {
  _id: string;
  thesis_id: string;
  title: string;
  abstract: string;
  category: string;
  keywords: string;
  status: string;
  file_path: string;
  createdAt: string;
  updatedAt: string;
  author: {
    firstName: string;
    lastName: string;
    email: string;
    user_id: string;
    department: string;
  };
  advisor: {
    firstName: string;
    lastName: string;
    email: string;
  };
  chapterApproval: {
    chapter1: boolean;
    chapter2: boolean;
    chapter3: boolean;
    chapter4: boolean;
    chapter5: boolean;
  };
  chapters: {
      chapterNumber: number;
      title: string;
      file_path: string;
      uploadedAt: string;
      description?: string;
  }[];
  similarityScore?: number;
  privateNotes?: string;
}

interface IVersion {
    _id: string;
    thesis_id: string;
    createdAt: string;
    status: string;
    version: number;
}

interface IComment {
  _id: string;
  content: string;
  createdAt: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface ITimelineItem {
    id: string;
    type: 'activity' | 'comment' | 'version';
    action?: string;
    details?: string;
    content?: string; // for comment
    version?: number; // for version
    user?: {
        firstName: string;
        lastName: string;
        role: string;
    };
    date: string;
}

interface IMeeting {
    _id: string;
    date: string;
    title: string;
    notes?: string;
    url?: string;
    status: string;
    organizer: {
        firstName: string;
        lastName: string;
    };
}

export default function ThesisDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [thesis, setThesis] = useState<IThesisDetail | null>(null);
  const [versions, setVersions] = useState<IVersion[]>([]);
  const [comments, setComments] = useState<IComment[]>([]);
  const [timeline, setTimeline] = useState<ITimelineItem[]>([]);
  const [meetings, setMeetings] = useState<IMeeting[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // New State for Inputs
  const [similarityScore, setSimilarityScore] = useState<number | string>("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  // Meeting Dialog State
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");

  // Confirmation Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
      type: 'approve' | 'reject' | 'revision' | 'delete_meeting';
      title: string;
      description: string;
      actionLabel: string;
      actionClass?: string;
      data?: any;
  } | null>(null);

  // State Checkbox
  const [chapters, setChapters] = useState({
      chapter1: false, chapter2: false, chapter3: false, chapter4: false, chapter5: false
  });

  const router = useRouter();

  // 1. Fetch Data
  useEffect(() => {
    if (!id) return;
    async function fetchAllData() {
        try {
            const resMe = await fetch('/api/auth/me');
            if (resMe.ok) {
                const dataMe = await resMe.json();
                setCurrentUser(dataMe.user);
            }

            const resThesis = await fetch(`/api/query/thesis/${id}`, { cache: 'no-store' });
            const dataThesis = await resThesis.json();

            if (dataThesis.success) {
                console.log("Frontend Received Thesis:", dataThesis.thesis); // LOG FRONTEND RECEIVE
                setThesis(dataThesis.thesis);
                setVersions(dataThesis.versions || []);
                setSimilarityScore(dataThesis.thesis.similarityScore ?? "");
                setPrivateNotes(dataThesis.thesis.privateNotes || "");

                if (dataThesis.thesis.chapterApproval) {
                    setChapters(dataThesis.thesis.chapterApproval);
                }
            }

            // Fetch Timeline
            const resTimeline = await fetch(`/api/thesis/${id}/timeline`);
            const dataTimeline = await resTimeline.json();
            if (dataTimeline.success) setTimeline(dataTimeline.timeline);

            // Fetch Meetings
            const resMeetings = await fetch(`/api/thesis/${id}/meetings`);
            const dataMeetings = await resMeetings.json();
            if (dataMeetings.success) setMeetings(dataMeetings.meetings);

            // Fetch Comments
            const resComments = await fetch(`/api/thesis/${id}/comments`);
            const dataComments = await resComments.json();
            if (dataComments.success) setComments(dataComments.comments);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }
    fetchAllData();
  }, [id]);

  // 2. Handle Checkbox Change
  const handleChapterChange = async (chapterKey: string, checked: boolean) => {
      const newChapters = { ...chapters, [chapterKey]: checked };
      setChapters(newChapters);

      try {
          await fetch(`/api/thesis/${id}/review`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chapterApproval: newChapters })
          });
      } catch (error) {
          console.error("Failed to update chapter:", error);
      }
  }

  const handleSaveScore = async () => {
      setIsSavingScore(true);
      try {
          const res = await fetch(`/api/thesis/${id}/review`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ similarityScore: Number(similarityScore) })
          });
          const data = await res.json();
          if (data.success) {
              // Update local thesis state to match
              setThesis(prev => prev ? { ...prev, similarityScore: Number(similarityScore) } : null);
              
              // Refresh timeline
              const resTimeline = await fetch(`/api/thesis/${id}/timeline`);
              const dataTimeline = await resTimeline.json();
              if (dataTimeline.success) setTimeline(dataTimeline.timeline);
          }
      } catch (error) {
          console.error("Failed to save score:", error);
      } finally {
          setIsSavingScore(false);
      }
  }

  const handleSaveNotes = async () => {
      setIsSavingNotes(true);
      try {
          const res = await fetch(`/api/thesis/${id}/review`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ privateNotes })
          });
          const data = await res.json();
          if (data.success) {
               setThesis(prev => prev ? { ...prev, privateNotes: privateNotes } : null);
          }
      } catch (error) {
          console.error("Failed to save notes:", error);
      } finally {
          setIsSavingNotes(false);
      }
  }

  const handleCreateOrUpdateMeeting = async () => {
      if (!meetingDate || !meetingTitle) return;
      try {
          const method = editingMeetingId ? 'PUT' : 'POST';
          const body = {
              meetingId: editingMeetingId,
              date: meetingDate,
              title: meetingTitle,
              notes: meetingNotes,
              url: meetingUrl
          };

          const res = await fetch(`/api/thesis/${id}/meetings`, {
              method: method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
          });

          const data = await res.json();
          if (data.success) {
              if (editingMeetingId) {
                  setMeetings(meetings.map(m => m._id === editingMeetingId ? data.meeting : m));
              } else {
                  setMeetings([data.meeting, ...meetings]);
              }
              closeMeetingDialog();
          }
      } catch (error) {
          console.error("Failed to save meeting:", error);
      }
  }

  const handleDeleteMeeting = (meetingId: string) => {
      setConfirmConfig({
          type: 'delete_meeting',
          title: "Delete Meeting",
          description: "Are you sure you want to delete this meeting? This action cannot be undone.",
          actionLabel: "Delete",
          actionClass: "bg-red-600 hover:bg-red-700",
          data: meetingId
      });
      setConfirmOpen(true);
  }

  const executeDeleteMeeting = async (meetingId: string) => {
      try {
          const res = await fetch(`/api/thesis/${id}/meetings?meetingId=${meetingId}`, {
              method: 'DELETE'
          });
          const data = await res.json();
          if (data.success) {
              setMeetings(meetings.filter(m => m._id !== meetingId));
          }
      } catch (error) {
          console.error("Failed to delete meeting:", error);
      } finally {
          setConfirmOpen(false);
      }
  }

  const openCreateMeeting = () => {
      setEditingMeetingId(null);
      setMeetingDate("");
      setMeetingTitle("");
      setMeetingNotes("");
      setMeetingUrl("");
      setIsMeetingOpen(true);
  }

  const openEditMeeting = (meeting: IMeeting) => {
      setEditingMeetingId(meeting._id);
      setMeetingDate(new Date(meeting.date).toISOString().slice(0, 16));
      setMeetingTitle(meeting.title);
      setMeetingNotes(meeting.notes || "");
      setMeetingUrl(meeting.url || "");
      setIsMeetingOpen(true);
  }

  const closeMeetingDialog = () => {
      setIsMeetingOpen(false);
      setEditingMeetingId(null);
      setMeetingDate("");
      setMeetingTitle("");
      setMeetingNotes("");
      setMeetingUrl("");
  }

  const handlePostComment = async () => {
      if (!newComment.trim()) return;
      setSubmitting(true);
      try {
          const res = await fetch(`/api/thesis/${id}/comments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: newComment })
          });
          const data = await res.json();
          if (data.success) {
              const newTimelineItem: ITimelineItem = {
                  id: data.comment._id,
                  type: 'comment',
                  content: newComment,
                  user: {
                      firstName: currentUser.firstname,
                      lastName: currentUser.lastname,
                      role: currentUser.role
                  },
                  date: new Date().toISOString()
              };
              setTimeline([newTimelineItem, ...timeline]);
              setNewComment("");
          }
      } catch (error) {
          console.error("Comment error:", error);
      } finally {
          setSubmitting(false);
      }
  }

  const handleReviewAction = (status: string) => {
      let config: any = {
          type: status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'revision',
          data: status
      };

      if (status === 'approved') {
          config.title = "Approve Thesis";
          config.description = "Are you sure you want to approve this thesis? This action cannot be easily undone.";
          config.actionLabel = "Approve";
          config.actionClass = "bg-green-600 hover:bg-green-700";
      } else if (status === 'rejected') {
          config.title = "Reject Thesis";
          config.description = "Are you sure you want to reject this thesis? The student will be notified.";
          config.actionLabel = "Reject";
          config.actionClass = "bg-red-600 hover:bg-red-700";
      } else {
          config.title = "Request Revision";
          config.description = "Are you sure you want to request a revision? The status will be set to Pending.";
          config.actionLabel = "Request Revision";
          config.actionClass = "bg-yellow-600 hover:bg-yellow-700";
      }

      setConfirmConfig(config);
      setConfirmOpen(true);
  }

  const executeReviewAction = async (status: string) => {
      setProcessingAction(true);
      try {
          const res = await fetch(`/api/thesis/${id}/review`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: status })
          });
          const data = await res.json();
          if (data.success) {
              setThesis(prev => prev ? { ...prev, status: status } : null);
              // Refresh timeline
              const resTimeline = await fetch(`/api/thesis/${id}/timeline`);
              const dataTimeline = await resTimeline.json();
              if (dataTimeline.success) setTimeline(dataTimeline.timeline);
          } else {
              alert(data.error || "Action failed");
          }
      } catch (error) {
          alert("Failed to update status");
      } finally {
          setProcessingAction(false);
          setConfirmOpen(false);
      }
  }

  const handleConfirmAction = () => {
      if (!confirmConfig) return;
      if (confirmConfig.type === 'delete_meeting') {
          executeDeleteMeeting(confirmConfig.data);
      } else {
          executeReviewAction(confirmConfig.data);
      }
  }

  const handleVersionChange = (versionId: string) => {
      router.push(`/dashboard/thesis/${versionId}`);
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!thesis) return <div className="text-center p-12">Thesis not found</div>;

  const isAdvisor = currentUser?.role === 'advisor';
  const isAuthor = currentUser?.id === thesis.author.user_id;

  const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
          case 'approved': return 'bg-green-100 text-green-800';
          case 'pending': return 'bg-yellow-100 text-yellow-800';
          case 'rejected': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  }

  const getScoreColor = (score: number) => {
      if (score < 20) return "text-green-600";
      if (score < 50) return "text-yellow-600";
      return "text-red-600";
  }

  const getScoreBg = (score: number) => {
      if (score < 20) return "bg-green-100";
      if (score < 50) return "bg-yellow-100";
      return "bg-red-100";
  }

  return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <Button variant="ghost" onClick={() => router.back()} className="pl-0 hover:pl-2 transition-all">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                      <History className="h-4 w-4" /> Version History:
                  </span>
                  <Select value={thesis._id} onValueChange={handleVersionChange}>
                      <SelectTrigger className="w-[250px] h-9 bg-background">
                          <SelectValue placeholder="Select version" />
                      </SelectTrigger>
                      <SelectContent align="end">
                          {versions.map((v, index) => (
                              <SelectItem key={v._id} value={v._id}>
                                  v{versions.length - index} - {new Date(v.createdAt).toLocaleDateString()} 
                                  {v._id === thesis._id && " (Current)"}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              <div className="lg:col-span-2 space-y-6">
                  <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-4 mb-4">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="timeline">Timeline</TabsTrigger>
                          <TabsTrigger value="meetings">Meetings</TabsTrigger>
                          <TabsTrigger value="feedback">Feedback</TabsTrigger>
                      </TabsList>

                      <TabsContent value="feedback" className="space-y-6">
                           <Card className="border-0 shadow-md">
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                      <MessageSquare className="h-5 w-5" /> Feedback & Discussion
                                  </CardTitle>
                              </CardHeader>
                              <CardContent>
                                  <ScrollArea className="h-[500px] pr-4">
                                      <div className="space-y-6">
                                          {timeline.filter(t => t.type === 'comment').length === 0 ? (
                                              <p className="text-center text-muted-foreground py-8">No comments yet.</p>
                                          ) : (
                                              timeline.filter(t => t.type === 'comment').map((item) => (
                                                  <div key={item.id} className="flex gap-3">
                                                      <Avatar className="h-8 w-8 mt-1">
                                                          <AvatarFallback>{item.user?.firstName?.charAt(0) || "U"}</AvatarFallback>
                                                      </Avatar>
                                                      <div className="flex-1 space-y-1">
                                                          <div className="flex items-center justify-between">
                                                              <div className="flex items-center gap-2">
                                                                  <span className="font-semibold text-sm">{item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown'}</span>
                                                                  <Badge variant="outline" className="text-[10px] h-5">{item.user?.role}</Badge>
                                                              </div>
                                                              <span className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</span>
                                                          </div>
                                                          <div className="p-3 bg-muted/30 rounded-lg text-sm border border-border/50">
                                                              {item.content}
                                                          </div>
                                                      </div>
                                                  </div>
                                              ))
                                          )}
                                      </div>
                                  </ScrollArea>
                                  
                                  <div className="mt-6 pt-6 border-t">
                                      <h4 className="font-semibold mb-3 text-sm">Leave a Comment</h4>
                                      <div className="flex gap-3">
                                          <Avatar className="h-8 w-8"><AvatarFallback>{currentUser?.firstname?.charAt(0) || "U"}</AvatarFallback></Avatar>
                                          <div className="flex-1 gap-2 flex flex-col">
                                              <Textarea 
                                                  placeholder="Type your feedback or question here..." 
                                                  value={newComment} 
                                                  onChange={(e) => setNewComment(e.target.value)} 
                                                  className="min-h-[100px]" 
                                              />
                                              <div className="flex justify-end">
                                                  <Button onClick={handlePostComment} disabled={submitting || !newComment.trim()}>
                                                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Post Comment
                                                  </Button>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </CardContent>
                           </Card>
                      </TabsContent>

                      <TabsContent value="overview" className="space-y-6">
                          <Card className="border-0 shadow-md overflow-hidden">
                              <CardHeader className="bg-muted/10 pb-6">
                                  <div className="flex justify-between items-start gap-4">
                                      <div className="space-y-1">
                                          <Badge variant="outline" className="mb-2 border-primary/20 text-primary bg-primary/5">{thesis.thesis_id}</Badge>
                                          <CardTitle className="text-2xl font-heading font-bold leading-tight text-foreground">{thesis.title}</CardTitle>
                                      </div>
                                      <Badge className={`capitalize px-3 py-1 ${getStatusColor(thesis.status)}`}>{thesis.status}</Badge>
                                  </div>
                              </CardHeader>
                              <CardContent className="pt-6 space-y-6">
                                  <div>
                                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                          <FileText className="h-5 w-5 text-blue-500" /> Abstract
                                      </h3>
                                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{thesis.abstract}</p>
                                  </div>
                                  <Separator />
                                  <div className="flex flex-wrap gap-2">
                                      {thesis.keywords?.split(',').map((tag, i) => (
                                          <Badge key={i} variant="secondary" className="text-xs text-muted-foreground"># {tag.trim()}</Badge>
                                      ))}
                                  </div>
                              </CardContent>
                          </Card>

                          <Card className="border-0 shadow-md">
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                      <CheckCircle className="h-5 w-5 text-green-600" /> Chapter Progress
                                  </CardTitle>
                                  <CardDescription>Track the approval status of each chapter.</CardDescription>
                              </CardHeader>
                              <CardContent>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                      {[1, 2, 3, 4, 5].map((num) => {
                                          const key = `chapter${num}` as keyof typeof chapters;
                                          return (
                                              <div key={num} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${chapters[key] ? 'bg-green-50 border-green-200' : 'bg-card'}`}>
                                                  <Checkbox 
                                                      id={key} 
                                                      checked={chapters[key]}
                                                      disabled={!isAdvisor} 
                                                      onCheckedChange={(checked) => handleChapterChange(key, checked as boolean)}
                                                  />
                                                  <Label htmlFor={key} className={`text-sm font-medium cursor-pointer ${chapters[key] ? 'text-green-700' : 'text-foreground'}`}>
                                                      Chapter {num} {chapters[key] && "(Passed)"}
                                                  </Label>
                                              </div>
                                          )
                                      })}
                                  </div>
                              </CardContent>
                          </Card>

                          {isAdvisor && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <Card className="border-0 shadow-md">
                                      <CardHeader>
                                          <CardTitle className="flex items-center gap-2 text-base">
                                              <Percent className="h-4 w-4 text-orange-500" /> Similarity Score
                                          </CardTitle>
                                      </CardHeader>
                                      <CardContent className="flex flex-col gap-4">
                                          <div className="flex items-center justify-between">
                                              <div className="flex flex-col">
                                                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Score</span>
                                                  <div className={`text-4xl font-bold ${getScoreColor(thesis?.similarityScore || 0)}`}>
                                                      {thesis?.similarityScore ?? 0}%
                                                  </div>
                                              </div>
                                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreBg(thesis?.similarityScore || 0)} ${getScoreColor(thesis?.similarityScore || 0)}`}>
                                                  {(thesis?.similarityScore || 0) < 20 ? "Low Risk" : (thesis?.similarityScore || 0) < 50 ? "Moderate" : "High Risk"}
                                              </div>
                                          </div>
                                          <Separator />
                                          <div className="space-y-2">
                                              <Label className="text-xs text-muted-foreground">Update Score</Label>
                                              <div className="flex items-center gap-2">
                                                  <Input 
                                                      type="number" 
                                                      placeholder="Enter %" 
                                                      value={similarityScore} 
                                                      onChange={(e) => setSimilarityScore(e.target.value)}
                                                      className="flex-1"
                                                  />
                                                  <Button size="sm" onClick={handleSaveScore} disabled={isSavingScore}>
                                                      {isSavingScore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                                  </Button>
                                              </div>
                                          </div>
                                      </CardContent>
                                  </Card>

                                  <Card className="border-0 shadow-md">
                                      <CardHeader>
                                          <CardTitle className="flex items-center gap-2 text-base">
                                              <Lock className="h-4 w-4 text-gray-500" /> Private Notes
                                          </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                          <Textarea 
                                              placeholder="Private notes for advisor..." 
                                              value={privateNotes} 
                                              onChange={(e) => setPrivateNotes(e.target.value)}
                                              className="min-h-[80px]"
                                          />
                                          <div className="flex justify-end">
                                              <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={isSavingNotes}>
                                                  {isSavingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Note"}
                                              </Button>
                                          </div>
                                      </CardContent>
                                  </Card>
                              </div>
                          )}
                      </TabsContent>

                      <TabsContent value="timeline">
                          <Card className="border-0 shadow-md">
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                      <Activity className="h-5 w-5" /> Activity Timeline
                                  </CardTitle>
                              </CardHeader>
                              <CardContent>
                                  <ScrollArea className="h-[500px] pr-4">
                                      <div className="relative border-l border-muted ml-4 space-y-8 pb-4">
                                          {timeline.length === 0 ? (
                                              <p className="text-muted-foreground pl-6">No activity recorded yet.</p>
                                          ) : (
                                              timeline.map((item) => (
                                                  <div key={item.id} className="relative pl-6">
                                                      <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 bg-background ${
                                                          item.type === 'activity' ? 'border-blue-500' : 
                                                          item.type === 'comment' ? 'border-green-500' : 'border-purple-500'
                                                      }`} />
                                                      <div className="flex flex-col gap-1">
                                                          <div className="flex items-center gap-2 text-sm">
                                                              <span className="font-semibold">
                                                                  {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System'}
                                                              </span>
                                                              <span className="text-muted-foreground text-xs">
                                                                  {new Date(item.date).toLocaleString()}
                                                              </span>
                                                          </div>
                                                          <p className="text-sm">
                                                              {item.type === 'activity' && item.details}
                                                              {item.type === 'comment' && `Commented: "${item.content}"`}
                                                              {item.type === 'version' && `Uploaded Version ${item.version}`}
                                                          </p>
                                                      </div>
                                                  </div>
                                              ))
                                          )}
                                      </div>
                                  </ScrollArea>
                                  
                                  <div className="mt-8 pt-6 border-t">
                                      <h4 className="font-semibold mb-2 text-sm">Add Comment</h4>
                                      <div className="flex gap-3">
                                          <Avatar className="h-8 w-8"><AvatarFallback>{currentUser?.firstname?.charAt(0) || "U"}</AvatarFallback></Avatar>
                                          <div className="flex-1 gap-2 flex flex-col">
                                              <Textarea placeholder="Type your comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="min-h-[80px]" />
                                              <div className="flex justify-end">
                                                  <Button onClick={handlePostComment} disabled={submitting || !newComment.trim()}>
                                                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Send
                                                  </Button>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </CardContent>
                          </Card>
                      </TabsContent>

                      <TabsContent value="meetings">
                          <Card className="border-0 shadow-md">
                              <CardHeader className="flex flex-row items-center justify-between">
                                  <CardTitle className="flex items-center gap-2">
                                      <Users className="h-5 w-5" /> Meetings
                                  </CardTitle>
                                  {isAdvisor && (
                                      <Button size="sm" onClick={openCreateMeeting}>
                                          <PlusCircle className="h-4 w-4 mr-2" /> Schedule Meeting
                                      </Button>
                                  )}
                              </CardHeader>
                              <CardContent>
                                  <div className="space-y-4">
                                      {meetings.length === 0 ? (
                                          <p className="text-center text-muted-foreground py-8">No meetings scheduled.</p>
                                      ) : (
                                          meetings.map((meeting) => (
                                              <div key={meeting._id} className="flex flex-col sm:flex-row items-start justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors gap-4">
                                                  <div className="flex-1">
                                                      <div className="flex items-center gap-2">
                                                          <h4 className="font-semibold text-base">{meeting.title}</h4>
                                                          <Badge variant={meeting.status === 'completed' ? 'secondary' : 'outline'}>{meeting.status}</Badge>
                                                      </div>
                                                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(meeting.date).toLocaleString()}</span>
                                                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {meeting.organizer.firstName}</span>
                                                      </div>
                                                      {meeting.url && (
                                                          <a href={meeting.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-flex items-center gap-1">
                                                              Link to meeting <ArrowLeft className="h-3 w-3 rotate-135" />
                                                          </a>
                                                      )}
                                                      {meeting.notes && (
                                                          <p className="text-sm mt-2 text-muted-foreground bg-muted/30 p-3 rounded-md border border-border/50">
                                                              {meeting.notes}
                                                          </p>
                                                      )}
                                                  </div>
                                                  
                                                  {isAdvisor && (
                                                      <div className="flex gap-2">
                                                          <Button variant="outline" size="sm" onClick={() => openEditMeeting(meeting)}>Edit</Button>
                                                          <Button variant="destructive" size="sm" onClick={() => handleDeleteMeeting(meeting._id)}>Delete</Button>
                                                      </div>
                                                  )}
                                              </div>
                                          ))
                                      )}
                                  </div>
                              </CardContent>
                          </Card>
                      </TabsContent>

                  </Tabs>
              </div>

              <div className="lg:col-span-1 space-y-6">
                  {isAdvisor && (
                      <Card className="border-0 shadow-md border-l-4 border-l-orange-400">
                          <CardHeader className="pb-3">
                              <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-orange-500" /> Advisor Actions</CardTitle>
                              <CardDescription>Make a decision on this thesis.</CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-3">
                              <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleReviewAction('approved')} disabled={processingAction || thesis.status === 'approved'}>
                                  {processingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} Approve Thesis
                              </Button>
                              <div className="grid grid-cols-2 gap-2">
                                  <Button variant="outline" className="w-full text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" onClick={() => handleReviewAction('pending')} disabled={processingAction || thesis.status === 'pending'}>
                                      <AlertTriangle className="mr-2 h-4 w-4" /> Revision
                                  </Button>
                                  <Button variant="destructive" className="w-full" onClick={() => handleReviewAction('rejected')} disabled={processingAction || thesis.status === 'rejected'}>
                                      <XCircle className="mr-2 h-4 w-4" /> Reject
                                  </Button>
                              </div>
                          </CardContent>
                      </Card>
                  )}

                  <Card className="border-0 shadow-md">
                      <CardHeader><CardTitle className="text-lg">Documents</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                          <div className="p-4 bg-muted/20 rounded-xl border flex items-center gap-3">
                              <div className="p-2 bg-red-100 rounded-lg"><FileText className="h-6 w-6 text-red-500" /></div>
                              <div className="overflow-hidden">
                                  <p className="font-medium truncate text-sm">{thesis.file_path.split('/').pop()}</p>
                                  <p className="text-xs text-muted-foreground">Latest Version</p>
                              </div>
                          </div>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" asChild>
                              <a href={thesis.file_path} download><Download className="mr-2 h-4 w-4" /> Download Latest</a>
                          </Button>
                          
                          <Button variant="outline" className="w-full mt-2" asChild>
                              <Link href="/dashboard/upload">
                                  <UploadCloud className="mr-2 h-4 w-4" /> Upload New Version
                              </Link>
                          </Button>

                          {thesis.chapters && thesis.chapters.length > 0 && thesis.status !== 'approved' && (
                              <>
                                  <Separator className="my-2" />
                                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Chapters</h4>
                                  <div className="space-y-2">
                                      {(() => {
                                          const latestChapterIndex = thesis.chapters.reduce((latestIndex, current, currentIndex, array) => {
                                              const latestDate = new Date(array[latestIndex].uploadedAt).getTime();
                                              const currentDate = new Date(current.uploadedAt).getTime();
                                              return currentDate > latestDate ? currentIndex : latestIndex;
                                          }, 0);

                                          return thesis.chapters.map((chapter, idx) => {
                                              const isLatest = idx === latestChapterIndex;
                                              return (
                                                  <div key={idx} className={`flex flex-col p-3 bg-card border rounded-lg text-sm ${isLatest ? 'border-blue-200 bg-blue-50/30' : ''}`}>
                                                      <div className="flex items-center justify-between">
                                                          <div className="flex items-center gap-2 truncate">
                                                              <FileText className={`h-4 w-4 ${isLatest ? 'text-blue-600' : 'text-blue-500'}`} />
                                                              <span className="truncate max-w-[150px] font-medium">{chapter.title}</span>
                                                              {isLatest && (
                                                                  <Badge variant="secondary" className="text-[10px] h-5 bg-blue-100 text-blue-700 hover:bg-blue-100">
                                                                      Latest
                                                                  </Badge>
                                                              )}
                                                          </div>
                                                          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                                                              <a href={chapter.file_path} download>
                                                                  <Download className="h-4 w-4" />
                                                              </a>
                                                          </Button>
                                                      </div>
                                                      
                                                      {chapter.description && (
                                                          <div className="mt-2 text-xs text-muted-foreground bg-background/50 p-2 rounded border border-border/50">
                                                              <span className="font-semibold text-foreground/70">Note: </span>
                                                              {chapter.description}
                                                          </div>
                                                      )}
                                                      
                                                      <div className="mt-1 text-[10px] text-muted-foreground flex justify-end">
                                                          {new Date(chapter.uploadedAt).toLocaleString()}
                                                      </div>
                                                  </div>
                                              );
                                          });
                                      })()}
                                  </div>
                              </>
                          )}
                      </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                      <CardHeader><CardTitle className="text-lg">Project Details</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                          <div className="flex items-start gap-3">
                              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                  <p className="text-sm font-medium">Author</p>
                                  <p className="text-sm text-muted-foreground">{thesis.author?.firstName} {thesis.author?.lastName}</p>
                                  <p className="text-xs text-muted-foreground">{thesis.author?.user_id}</p>
                              </div>
                          </div>
                          <Separator />
                          <div className="flex items-start gap-3">
                              <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                  <p className="text-sm font-medium">Advisor</p>
                                  <p className="text-sm text-muted-foreground">{thesis.advisor ? `${thesis.advisor.firstName} ${thesis.advisor.lastName}` : "Unknown"}</p>
                              </div>
                          </div>
                          <Separator />
                          <div className="flex items-start gap-3">
                              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                  <p className="text-sm font-medium">Date</p>
                                  <p className="text-sm text-muted-foreground">Submitted: {new Date(thesis.createdAt).toLocaleDateString()}</p>
                                  <p className="text-xs text-muted-foreground">Updated: {new Date(thesis.updatedAt).toLocaleDateString()}</p>
                              </div>
                          </div>
                      </CardContent>
                  </Card>
              </div>
          </div>

          <Dialog open={isMeetingOpen} onOpenChange={setIsMeetingOpen}>
              <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                      <DialogTitle>{editingMeetingId ? "Edit Meeting" : "Schedule Meeting"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Title</Label>
                          <Input 
                              className="col-span-3"
                              placeholder="Meeting topic..." 
                              value={meetingTitle}
                              onChange={(e) => setMeetingTitle(e.target.value)}
                          />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Date</Label>
                          <div className="col-span-3">
                              <DateTimePicker 
                                  date={meetingDate ? new Date(meetingDate) : undefined}
                                  setDate={(date) => setMeetingDate(date ? date.toISOString() : "")}
                              />
                          </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">URL</Label>
                          <Input 
                              className="col-span-3"
                              placeholder="https://meet.google.com/..." 
                              value={meetingUrl}
                              onChange={(e) => setMeetingUrl(e.target.value)}
                          />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                          <Label className="text-right mt-2">Notes</Label>
                          <Textarea 
                              className="col-span-3 min-h-[100px]"
                              placeholder="Additional details..." 
                              value={meetingNotes}
                              onChange={(e) => setMeetingNotes(e.target.value)}
                          />
                      </div>
                  </div>
                  <DialogFooter>
                      <Button variant="outline" onClick={closeMeetingDialog}>Cancel</Button>
                      <Button onClick={handleCreateOrUpdateMeeting} disabled={!meetingTitle || !meetingDate}>
                          {editingMeetingId ? "Save Changes" : "Schedule"}
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>

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