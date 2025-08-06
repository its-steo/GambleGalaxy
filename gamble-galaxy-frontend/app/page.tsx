"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"

// Import all components
import BottomNav from "@/components/bottom-nav"
import AuthModal from "@/components/auth-modal"
import ChatSystem from "@/components/chat-system"
import PushNotifications from "@/components/push-notifications"
import AnalyticsDashboard from "@/components/analytics-dashboard"
import { NotificationProvider } from "@/components/notification-system"
import SportsBetting from "@/components/sports-betting"
import AviatorGame from "@/components/aviator-game"
import WalletComponent from "@/components/wallet"
import Profile from "@/components/profile"
import Dashboard from "@/components/dashboard"
import PaymentIntegration from "@/components/payment-intergrations"
import AdminPanel from "@/components/admin-panel"
import SecuritySystem from "@/components/security-system"
import TournamentSystem from "@/components/tournament-system"

export default function GambleGalaxyPlatform() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("access_token")
    const userData = localStorage.getItem("user_data")

    if (token && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleAuthSuccess = (userData: any) => {
    setIsAuthenticated(true)
    setUser(userData.user)
    setShowAuthModal(false)
    localStorage.setItem("user_data", JSON.stringify(userData.user))
    localStorage.setItem("access_token", userData.access_token)
    if (userData.refresh_token) {
      localStorage.setItem("refresh_token", userData.refresh_token)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user_data")
    setActiveTab("dashboard")
  }

  const requireAuth = (component: React.ReactNode) => {
    if (!isAuthenticated) {
      return (
        <Card className="max-w-md mx-auto mt-20">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access this feature</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowAuthModal(true)} className="w-full">
              Login / Register
            </Button>
          </CardContent>
        </Card>
      )
    }
    return component
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />
      case "sports":
        return <SportsBetting />
      case "aviator":
        return <AviatorGame />
      case "wallet":
        return requireAuth(<WalletComponent />)
      case "profile":
        return requireAuth(<Profile />)
      case "notifications":
        return requireAuth(<PushNotifications />)
      case "analytics":
        return requireAuth(<AnalyticsDashboard />)
      case "chat":
        return requireAuth(<ChatSystem />)
      case "payments":
        return requireAuth(<PaymentIntegration />)
      case "admin":
        return user?.role === "admin" ? (
          <AdminPanel />
        ) : (
          <Card className="max-w-md mx-auto mt-20">
            <CardHeader className="text-center">
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>Admin privileges required</CardDescription>
            </CardHeader>
          </Card>
        )
      case "security":
        return requireAuth(<SecuritySystem />)
      case "tournaments":
        return <TournamentSystem />
      default:
        return <Dashboard />
    }
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  GambleGalaxy
                </h1>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  Pro
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("notifications")}
                      className="relative"
                    >
                      <Bell className="h-4 w-4" />
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                        3
                      </Badge>
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium hidden sm:inline">{user?.name || user?.email}</span>
                      <Button variant="outline" size="sm" onClick={handleLogout}>
                        Logout
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button onClick={() => setShowAuthModal(true)}>Login</Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 pb-20">{renderContent()}</main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Auth Modal */}
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
      </div>
    </NotificationProvider>
  )
}
