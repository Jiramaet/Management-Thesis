"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    department: "",
    user_id: "",
    bio: "",
  });

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setError("")
  //   setIsLoading(true)

  //   await new Promise((resolve) => setTimeout(resolve, 1000))

  //   if (formData.email === "test@gmail.com" && formData.password === "1234" && formData.role) {
  //     if (formData.password !== formData.confirmPassword) {
  //       setError("Passwords do not match")
  //       setIsLoading(false)
  //       return
  //     }

  //     // Store user info in localStorage for demo purposes
  //     localStorage.setItem(
  //       "user",
  //       JSON.stringify({
  //         email: formData.email,
  //         role: formData.role,
  //         name: `${formData.firstName} ${formData.lastName}`,
  //       }),
  //     )

  //     // Redirect to dashboard
  //     router.push("/dashboard")
  //   } else {
  //     setError("Please use test@gmail.com / 1234 for demo registration")
  //   }

  //   setIsLoading(false)
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })
      
      console.log(formData);
      const data = await res.json()

      if (data.success) {
        router.push("/login")
      } else {
        setError(data.message || "Register failed")
      }
    } catch (error) {
      setError("Error " + error);
    }
    setIsLoading(false)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-heading font-bold">
              Thesis Management
            </span>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Create Account
          </h1>
          <p className="text-muted-foreground">
            Join our academic community today
          </p>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="rounded-2xl border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-heading">Register</CardTitle>
              <CardDescription>
                Fill in your information to create your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: 0 }}
                      animate={{
                        opacity: 1,
                        x: [0, -10, 10, -10, 10, 0],
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        x: { duration: 0.5, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
                        opacity: { duration: 0.3 },
                      }}
                      className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <motion.div
                      whileFocus={{
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        required
                      />
                    </motion.div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <motion.div
                      whileFocus={{
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        required
                      />
                    </motion.div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <motion.div
                    whileFocus={{
                      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      id="email"
                      type="email"
                      placeholder="test@gmail.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      required
                    />
                  </motion.div>
                </div>

                {/* Password Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <motion.div
                      className="relative"
                      whileFocus={{
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="1234"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <motion.div
                      className="relative"
                      whileFocus={{
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="1234"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Role and Academic Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <motion.div
                      whileHover={{ opacity: 0.9 }}
                      whileTap={{ opacity: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Select
                        value={formData.role}
                        onValueChange={(value) =>
                          setFormData({ ...formData, role: value })
                        }
                      >
                        <SelectTrigger className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="advisor">Advisor</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <motion.div
                      whileFocus={{
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        id="department"
                        placeholder="Computer Science"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        required
                      />
                    </motion.div>
                  </div>
                </div>

                {formData.role === "student" && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="studentId">Student ID</Label>
                    <motion.div
                      whileFocus={{
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        id="user_id"
                        placeholder="20240001"
                        value={formData.user_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            user_id: e.target.value,
                          })
                        }
                        className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        required
                      />
                    </motion.div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <motion.div
                    whileFocus={{
                      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself and your academic interests..."
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      rows={3}
                    />
                  </motion.div>
                </div>

                <motion.div
                  whileHover={{
                    y: -1,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  whileTap={{ y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </motion.div>
              </form>

              <div className="mt-6 text-center">
                <motion.div
                  className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                    🔑 Demo Registration:
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      📧 Email: test@gmail.com
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      🔒 Password: 1234
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      👤 Role: Any role
                    </p>
                  </div>
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-primary hover:underline font-medium transition-colors duration-200"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
