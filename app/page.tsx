"use client"

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { AdminDashboard } from "@/components/admin-dashboard"

function AppContent() {
  const { employee } = useAuth()

  if (!employee) {
    return <LoginForm />
  }

  return <AdminDashboard />
}

export default function HomePage() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
