// app/dashboard/layout.tsx
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout' 
import { Skeleton } from '@/components/ui/skeleton'
import type React from "react"

interface AppUser {
  id: string
  firstname: string
  lastname: string
  email: string
  role: "student" | "advisor" | "admin"
  department: string
  user_id: string 
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true) 
  const router = useRouter()

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');

        if (!res.ok) { 
          throw new Error('Not authenticated');
        }

        const data = await res.json();

        if (data.success) {
          setUser(data.user); 
          localStorage.setItem('user', JSON.stringify(data.user)); 
        } else {
          throw new Error(data.error || 'Failed to fetch user');
        }
      } catch ( error : any) {
        console.error("Auth Error (Layout):", (error as Error).message);
        router.push('/login'); 
      } finally {
        setLoading(false); 
      }
    }

    fetchUser();
  }, [router]); 

  if (loading || !user) {
    return <Skeleton className="w-full h-screen" />
  }
  

  return (
    <DashboardLayout user={user}>
      {children} {/* (นี่คือ 'page.tsx' หรือ 'upload/page.tsx' ที่จะมาแสดงข้างใน) */}
    </DashboardLayout>
  )
}