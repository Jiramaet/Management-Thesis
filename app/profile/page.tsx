"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/components/navbar"
import { User, Mail, Shield, Calendar, Edit, Save, X } from "lucide-react"
import { AnimatePresence} from "framer-motion"
import { AlertCircle } from "lucide-react"
import { set } from "mongoose"
import { se, tr } from "date-fns/locale"

interface UserProfile {
  id?: string
  firstname?: string
  lastname?: string
  email: string
  role: string
  joinDate?: string
  department?: string
  studentId?: string
  user_id?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<UserProfile>({
    id: "",
    firstname: "",
    lastname: "",
    email: "",
    role: "",
    department: "",
    studentId: "",
    user_id: "",
  })

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    // Add mock additional data
    const fullUser = {
      ...parsedUser,
      joinDate: "January 2024",
      department: parsedUser.department || "Not specified",
      studentId: parsedUser.user_id,
      user_id: parsedUser.user_id,
    }

    setUser(fullUser)
    setEditForm(fullUser)
  }, [router])

  // const handleSave = () => {
  //   if (user) {
  //     const updatedUser = { ...user, ...editForm }
  //     setUser(updatedUser)
  //     localStorage.setItem("user", JSON.stringify(updatedUser))
  //     setIsEditing(false)
  //   }
  // }

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (data.success) {
        // อัพเดท local storage จาก Server response
        const updatedUser = { ...user, ...editForm };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        updatedUser.studentId = data.user.user_id;

        // อัพเดทสถานะ
        setUser(updatedUser);
        setEditForm(updatedUser);
        setIsEditing(false);
        setError(null);
      } else {
        setError(data.message || 'Failed to update profile.');
      }
    } catch (error: any) {
      console.log('Profile update error:', error);
      setError(error.message || 'Server error');
    }
    setIsLoading(false);
  }

  const handleCancel = () => {
    if (user) {
      setEditForm(user)
    }
    setIsEditing(false)
    setError(null);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const displayName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || "User"
  const initials = (user.firstname || 'U').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.div
        className="container mx-auto px-4 py-8 max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>

        {/* --- 4. เพิ่มการแสดง Error (ถ้ามี) --- */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        {/* ----------------------------------- */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            className="lg:col-span-1"
            whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {user.firstname.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-heading font-bold text-foreground mb-2">{user.firstname} {user.lastname}</h2>
                <p className="text-muted-foreground mb-4">{user.email}</p>
                <Badge className="mb-4 capitalize bg-gradient-to-r from-blue-600 to-green-600 text-white">
                  {user.role}
                </Badge>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {user.joinDate}</span>
                  </div>
                  {user.department && (
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>{user.department}</span>
                    </div>
                  )}
                  {user.studentId && (
                    <div className="flex items-center justify-center gap-2">
                      <User className="h-4 w-4" />
                      <span>ID: {user.studentId}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Information */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-heading">Personal Information</CardTitle>
                  <CardDescription>Update your personal details and information</CardDescription>
                </div>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <motion.div
                        whileFocus={{ boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" }}
                        transition={{ duration: 0.2 }}
                      >
                        <Input
                          id="name"
                          value={editForm.firstname + " " + editForm.lastname}
                          onChange={(e) => setEditForm({ ...editForm, firstname: e.target.value.split(" ")[0], lastname: e.target.value.split(" ")[1] || "" })}
                          className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        />
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{user.firstname} {user.lastname}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    {isEditing ? (
                      <motion.div
                        whileFocus={{ boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" }}
                        transition={{ duration: 0.2 }}
                      >
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        />
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{user.role}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    {isEditing ? (
                      <motion.div
                        whileFocus={{ boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" }}
                        transition={{ duration: 0.2 }}
                      >
                        <Input
                          id="department"
                          value={editForm.department || ""}
                          onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                          className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        />
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>{user.department || "Not specified"}</span>
                      </div>
                    )}
                  </div>

                  {/* {user.role === "student" && (
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      {isEditing ? (
                        <motion.div
                          whileFocus={{ boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" }}
                          transition={{ duration: 0.2 }}
                        >
                          <Input
                            id="studentId"
                            value={editForm.studentId || ""}
                            onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                            className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                          />
                        </motion.div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{user.studentId || "Not specified"}</span>
                        </div>
                      )}
                    </div>
                  )} */}

                  {user.role === "student" && (
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      
                      {/* เราลบเงื่อนไข isEditing ออก ให้แสดงผลแบบ Read-only ตลอด */}
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{user.studentId || "Not specified"}</span>
                      </div>

                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="joinDate">Join Date</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{user.joinDate}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional Information */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-heading">Account Statistics</CardTitle>
              <CardDescription>Your activity and engagement overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {user.role === "student" ? "3" : user.role === "advisor" ? "12" : "156"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.role === "student" ? "Submissions" : user.role === "advisor" ? "Students" : "Total Users"}
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {user.role === "student" ? "2" : user.role === "advisor" ? "8" : "89"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.role === "student" ? "Approved" : user.role === "advisor" ? "Completed" : "Total Theses"}
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {user.role === "student" ? "5" : user.role === "advisor" ? "3" : "12"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.role === "student" ? "Feedback" : "This Month"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
