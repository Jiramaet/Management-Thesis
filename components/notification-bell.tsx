"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, CheckCircle, Clock, MessageSquare, Info } from "lucide-react"

interface INotification {
  _id: string;
  title: string;
  message: string;
  link: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<INotification[]>([])
  const router = useRouter()

  // 1. ดึงข้อมูลเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchNotis = async () => {
        // Check if user is logged in
        const userStr = localStorage.getItem("user");
        if (!userStr) return;

        try {
            const res = await fetch('/api/notifications', { signal });
            if (res.status === 401) {
                localStorage.removeItem("user");
                router.push('/login');
                return;
            }
            
            const data = await res.json();
            if(data.success) setNotifications(data.notifications);
        } catch (e: any) { 
            if (e.name === 'AbortError') return;
            // Suppress "Failed to fetch" which happens on dev server restart/network blip
            if (e.message === 'Failed to fetch') return;
            console.error("Notification fetch error:", e); 
        }
    };
    fetchNotis();
    
    // (Optional) ตั้งเวลาดึงใหม่ทุก 30 วินาที (Polling)
    const interval = setInterval(fetchNotis, 30000);
    return () => {
        clearInterval(interval);
        controller.abort();
    };
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleRead = async (n: INotification) => {
    // 1. ถ้ายังไม่อ่าน ให้ยิง API ไปบอกว่าอ่านแล้ว
    if (!n.isRead) {
        await fetch('/api/notifications', {
            method: 'PUT',
            body: JSON.stringify({ id: n._id })
        });
        // อัปเดตหน้าจอทันที
        setNotifications(prev => prev.map(item => item._id === n._id ? { ...item, isRead: true } : item));
    }
    // 2. ไปยังลิงก์
    if (n.link && n.link !== '#') router.push(n.link);
  }

  const getIcon = (type: string) => {
      if(type === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
      if(type === 'warning') return <Clock className="h-4 w-4 text-yellow-500" />;
      return <Info className="h-4 w-4 text-blue-500" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 hover:bg-red-600">{unreadCount}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center justify-between">
            <span className="font-medium">Notifications</span>
            {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} unread</span>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
            notifications.map((n) => (
                <DropdownMenuItem key={n._id} className={`p-3 cursor-pointer flex items-start gap-3 ${!n.isRead ? "bg-muted/50" : ""}`} onClick={() => handleRead(n)}>
                    <div className="mt-1">{getIcon(n.type)}</div>
                    <div className="flex-1 space-y-1">
                        <p className={`text-sm leading-none ${!n.isRead ? "font-semibold" : ""}`}>{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />}
                </DropdownMenuItem>
            ))
            )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
