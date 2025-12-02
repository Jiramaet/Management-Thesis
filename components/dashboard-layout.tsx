"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { GlobalSearch } from "@/components/global-search"
import { NotificationBell } from "@/components/notification-bell"
import { useTheme } from "next-themes" 
import {
  BookOpen,
  Home,
  FileText,
  Upload,
  Search,
  Users,
  Settings,
  Bell,
  BarChart3,
  Menu,
  LogOut,
  Shield,
  Clock,
  CheckCircle,
  MessageSquare,
  User, 
  Sun, 
  Moon, 
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: { 
    id: string
    firstname: string
    lastname: string
    email: string
    role: "student" | "advisor" | "admin"
    department: string
  }
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme() 

  const handleLogout = async () => {
    console.log("dashboard handleLogout called")
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (e) {
      console.error("Logout fetch error:", e);
    }
    window.location.href = '/login'
  }

  const displayName = user?.firstname + " " + user?.lastname || "Guest"
  const initials = (
    (user?.firstname + " " + user?.lastname)
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("") || "U"
  )

  const getNavigationItems = () => {
    const baseItems = [{ icon: Home, label: "Dashboard", href: "/dashboard" }]
    if (!user) return baseItems

    const roleSpecificItems = {
      student: [
        { icon: Search, label: "Browse", href: "/dashboard/browse" },
        { icon: FileText, label: "My Thesis", href: "/dashboard/thesis" },
        { icon: Upload, label: "Upload", href: "/dashboard/upload" },
        // { icon: Clock, label: "Progress", href: "/dashboard/progress" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
      ],
      advisor: [
        { icon: Search, label: "Browse", href: "/dashboard/browse" },
        { icon: Users, label: "Students", href: "/dashboard/students" },
        { icon: FileText, label: "Reviews", href: "/dashboard/reviews" },
        { icon: CheckCircle, label: "Approvals", href: "/dashboard/approvals" },
        { icon: MessageSquare, label: "Reports", href: "/dashboard/reports" },
        // { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
      ],
      admin: [
        { icon: Users, label: "User Management", href: "/dashboard/users" },
        { icon: FileText, label: "All Theses", href: "/dashboard/theses" },
        { icon: CheckCircle, label: "Approvals", href: "/dashboard/approvals" },
        { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
        { icon: MessageSquare, label: "Reports", href: "/dashboard/reports" },
        { icon: Settings, label: "System Settings", href: "/dashboard/settings" },
        { icon: Search, label: "Browse", href: "/dashboard/browse" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
      ],
    }

    return [...baseItems, ...roleSpecificItems[user.role]]
  }

  const navigationItems = getNavigationItems()

  const SidebarContent = () => (
    <motion.div
      className="flex h-full flex-col"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <BookOpen className="h-6 w-6 text-sidebar-primary" />
          </motion.div>
          <span className="font-heading font-bold text-sidebar-foreground">Thesis Manager</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigationItems.map((item, index) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </motion.div>
        ))}
      </nav>

      {/* User Role Badge */}
      <motion.div
        className="border-t border-sidebar-border p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {user?.role ?? "guest"}
          </Badge>
          <span className="text-xs text-sidebar-foreground/70">{user?.department ?? ""}</span>
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <motion.header
          className="flex h-16 items-center justify-between border-b border-border bg-card px-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            <h2 className="font-heading font-semibold text-card-foreground">Welcome back, {displayName}</h2>
          </div>

          <div className="flex items-center gap-4">
            <GlobalSearch />
            <NotificationBell />

            {/* ปุ่มเปลี่ยนธีม (ถูกต้อง) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email ?? ""}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* ปุ่ม Profile (ถูกต้อง) */}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Admin Panel</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                {/* 2. --- onSelect={handleLogout} ถูกต้องแล้ว --- */}
                <DropdownMenuItem 
                  onSelect={handleLogout} 
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
                
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}