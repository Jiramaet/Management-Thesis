"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Clock, Bell, BellOff, MessageSquare, Calendar, Settings, Trash2, Loader2, Info, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface UINotification {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: string
  actionUrl: string | null
}

const notificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  thesisUpdates: true,
  deadlineReminders: true,
  feedbackAlerts: true,
  meetingReminders: true,
  systemUpdates: false,
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<UINotification[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(notificationSettings)
  const [filter, setFilter] = useState("all")
  const router = useRouter()
  const { toast } = useToast()

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        const mappedNotifs: UINotification[] = data.notifications.map((n: any) => ({
          id: n._id,
          type: n.type || 'system',
          title: n.title,
          message: n.message,
          timestamp: n.createdAt,
          read: n.isRead,
          priority: n.priority || 'medium',
          actionUrl: n.link && n.link !== '#' ? n.link : null
        }));
        setNotifs(mappedNotifs);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [])

  const handleSaveSettings = () => {
      // In a real app, this would save to backend/localstorage
      toast({
          title: "Settings saved",
          description: "Your notification preferences have been updated.",
      })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": 
      case "thesis_approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "thesis_rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "deadline":
      case "deadline_reminder":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "info":
      case "feedback_received":
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case "meeting_scheduled":
        return <Calendar className="h-5 w-5 text-purple-500" />
      case "system_update":
        return <Settings className="h-5 w-5 text-gray-500" />
      case "warning":
         return <AlertCircle className="h-5 w-5 text-orange-500" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const markAsRead = async (id: string) => {
    setNotifs(notifs.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
    try {
      await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }

  const markAllAsRead = async () => {
    setNotifs(notifs.map((notif) => ({ ...notif, read: true })))
    try {
       await fetch('/api/notifications', { 
           method: 'PUT', 
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ id: 'all' }) 
       });
    } catch (error) {
       console.error("Error marking all as read:", error);
    }
  }

  const deleteNotification = async (id: string) => {
    setNotifs(notifs.filter((notif) => notif.id !== id))
    try {
        await fetch('/api/notifications', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
    } catch (error) {
        console.error("Error deleting notification:", error);
    }
  }

  const clearAllNotifications = async () => {
      if (!confirm("Are you sure you want to delete all notifications?")) return;
      setNotifs([]);
      try {
          await fetch('/api/notifications', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: 'all' })
          });
      } catch (error) {
          console.error("Error clearing notifications:", error);
      }
  }

  const filteredNotifications = notifs.filter((notif) => {
    if (filter === "unread") return !notif.read
    if (filter === "read") return notif.read
    return true
  })

  const unreadCount = notifs.filter((notif) => !notif.read).length

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString()
  }

  // Grouping Logic
  const groupedNotifications = filteredNotifications.reduce((acc, notif) => {
      const date = new Date(notif.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key = "Earlier";
      if (date.toDateString() === today.toDateString()) key = "Today";
      else if (date.toDateString() === yesterday.toDateString()) key = "Yesterday";

      if (!acc[key]) acc[key] = [];
      acc[key].push(notif);
      return acc;
  }, {} as Record<string, UINotification[]>);

  const groupOrder = ["Today", "Yesterday", "Earlier"];

  return (
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Notifications</h1>
              <p className="text-muted-foreground">
                Stay updated with your thesis progress and important announcements
              </p>
            </div>
            <div className="flex items-center gap-2">
               {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
               )}
               {notifs.length > 0 && (
                   <Button variant="destructive" size="sm" onClick={clearAllNotifications}>
                       Clear All
                   </Button>
               )}
            </div>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className="rounded-full"
              >
                All ({notifs.length})
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("unread")}
                className="rounded-full"
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === "read" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("read")}
                className="rounded-full"
              >
                Read ({notifs.length - unreadCount})
              </Button>
            </div>

            {/* Notifications List */}
            <div className="space-y-6">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
                    <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-heading font-semibold mb-2">No notifications</h3>
                    <p className="text-muted-foreground max-w-sm">
                      {filter === "unread" ? "You're all caught up! No unread notifications." : "You have no notifications at the moment."}
                    </p>
                </div>
              ) : (
                groupOrder.map(group => {
                    const groupNotifs = groupedNotifications[group];
                    if (!groupNotifs || groupNotifs.length === 0) return null;

                    return (
                        <div key={group} className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1">{group}</h3>
                            {groupNotifs.map((notification) => (
                                <Card
                                    key={notification.id}
                                    className={`group relative transition-all hover:shadow-md border-l-4 ${
                                    !notification.read ? "border-l-primary bg-primary/5" : "border-l-transparent"
                                    }`}
                                >
                                    <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className={`font-medium text-foreground ${!notification.read ? 'font-bold' : ''}`}>
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.read && (
                                                            <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{notification.message}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <Badge className={getPriorityColor(notification.priority)} variant="outline">
                                                        {notification.priority}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteNotification(notification.id)
                                                        }}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {formatTimestamp(notification.timestamp)}
                                                </span>
                                                <div className="flex gap-2">
                                                    {!notification.read && (
                                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAsRead(notification.id)}>
                                                            Mark as read
                                                        </Button>
                                                    )}
                                                    {notification.actionUrl && (
                                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                                                            <a href={notification.actionUrl}>
                                                                View Details <CheckCircle className="h-3 w-3" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Notification Preferences</CardTitle>
                <CardDescription>Customize how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* General Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">General</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Specific Notifications */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Notification Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="thesis-updates">Thesis Updates</Label>
                        <p className="text-sm text-muted-foreground">Approval, rejection, and status changes</p>
                      </div>
                      <Switch
                        id="thesis-updates"
                        checked={settings.thesisUpdates}
                        onCheckedChange={(checked) => setSettings({ ...settings, thesisUpdates: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="deadline-reminders">Deadline Reminders</Label>
                        <p className="text-sm text-muted-foreground">Upcoming submission and review deadlines</p>
                      </div>
                      <Switch
                        id="deadline-reminders"
                        checked={settings.deadlineReminders}
                        onCheckedChange={(checked) => setSettings({ ...settings, deadlineReminders: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="feedback-alerts">Feedback Alerts</Label>
                        <p className="text-sm text-muted-foreground">New comments and reviews from advisors</p>
                      </div>
                      <Switch
                        id="feedback-alerts"
                        checked={settings.feedbackAlerts}
                        onCheckedChange={(checked) => setSettings({ ...settings, feedbackAlerts: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="meeting-reminders">Meeting Reminders</Label>
                        <p className="text-sm text-muted-foreground">Scheduled meetings with advisors</p>
                      </div>
                      <Switch
                        id="meeting-reminders"
                        checked={settings.meetingReminders}
                        onCheckedChange={(checked) => setSettings({ ...settings, meetingReminders: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="system-updates">System Updates</Label>
                        <p className="text-sm text-muted-foreground">Maintenance and system announcements</p>
                      </div>
                      <Switch
                        id="system-updates"
                        checked={settings.systemUpdates}
                        onCheckedChange={(checked) => setSettings({ ...settings, systemUpdates: checked })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  )
}
