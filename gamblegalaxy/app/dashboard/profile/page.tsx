"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import {
  User,
  Shield,
  Camera,
  Star,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Edit3,
  Lock,
  Bell,
  CreditCard,
  Activity,
  Award,
  TrendingUp,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ProfileEditor from "@/components/profile-editor"
import SecuritySettings from "@/components/security-settings"
import NotificationSettings from "@/components/notification-settings"
import AccountVerification from "@/components/account-verification"

interface UserProfile {
  id: number
  username: string
  email: string
  phone?: string
  first_name?: string
  last_name?: string
  date_of_birth?: string
  address?: string
  city?: string
  state?: string
  country?: string
  avatar?: string
  is_verified: boolean
  is_phone_verified: boolean
  is_email_verified: boolean
  date_joined: string
  last_login: string
  verification_level: "unverified" | "basic" | "full"
  kyc_status: "pending" | "approved" | "rejected" | "not_submitted"
}

interface ProfileStats {
  totalBets: number
  totalWinnings: number
  winRate: number
  accountAge: number
  favoriteGame: string
  totalDeposits: number
  currentStreak: number
}

export default function ProfilePage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showProfileEditor, setShowProfileEditor] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/profile/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getVerificationColor = (level: string) => {
    switch (level) {
      case "full":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "basic":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      default:
        return "bg-red-500/20 text-red-300 border-red-500/30"
    }
  }

  const getVerificationIcon = (level: string) => {
    switch (level) {
      case "full":
        return <CheckCircle className="w-4 h-4" />
      case "basic":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-white/10 rounded-2xl"></div>
            <div className="h-32 bg-white/10 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <User className="w-8 h-8 mr-3 text-purple-400" />
              My Profile 👤
            </h1>
            <p className="text-gray-400">Manage your account settings and preferences</p>
          </div>
          <Button
            onClick={() => setShowProfileEditor(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </motion.div>

      {/* Profile Header Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardContent className="p-8 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                {/* Avatar */}
                <div className="relative">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar || "/placeholder.svg"}
                      alt={profile.username}
                      className="w-24 h-24 rounded-2xl border-4 border-white/20 object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center border-4 border-white/20">
                      <span className="text-white font-bold text-2xl">
                        {profile?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 p-0"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold text-white">{profile?.username}</h2>
                    <Badge className={getVerificationColor(profile?.verification_level || "unverified")}>
                      <div className="flex items-center space-x-1">
                        {getVerificationIcon(profile?.verification_level || "unverified")}
                        <span className="capitalize">{profile?.verification_level || "Unverified"}</span>
                      </div>
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4 text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{profile?.email}</span>
                      {profile?.is_email_verified && <CheckCircle className="w-4 h-4 text-green-400" />}
                    </div>
                    {profile?.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{profile.phone}</span>
                        {profile.is_phone_verified && <CheckCircle className="w-4 h-4 text-green-400" />}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(profile?.date_joined || "").toLocaleDateString()}</span>
                    </div>
                    {profile?.city && profile?.state && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {profile.city}, {profile.state}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="glass p-4 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-xl font-bold text-white">{stats?.winRate?.toFixed(1) || 0}%</p>
                  <p className="text-sm text-gray-400">Win Rate</p>
                </div>

                <div className="glass p-4 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                  </div>
                  <p className="text-xl font-bold text-white">{stats?.currentStreak || 0}</p>
                  <p className="text-sm text-gray-400">Current Streak</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass-card p-1 w-full">
            <TabsTrigger value="overview" className="flex-1">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex-1">
              <Shield className="w-4 h-4 mr-2" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Account Statistics */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-400" />
                  Account Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats?.totalBets || 0}</p>
                  <p className="text-sm text-gray-400">Total Bets</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">₦{stats?.totalWinnings?.toLocaleString() || "0"}</p>
                  <p className="text-sm text-gray-400">Total Winnings</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">₦{stats?.totalDeposits?.toLocaleString() || "0"}</p>
                  <p className="text-sm text-gray-400">Total Deposits</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats?.accountAge || 0}</p>
                  <p className="text-sm text-gray-400">Days Active</p>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center">
                    <User className="w-5 h-5 mr-2 text-purple-400" />
                    Personal Information
                  </span>
                  <Button
                    onClick={() => setShowProfileEditor(true)}
                    variant="ghost"
                    size="sm"
                    className="text-purple-400 hover:text-purple-300"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm">Full Name</label>
                    <p className="text-white font-semibold">
                      {profile?.first_name && profile?.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : "Not provided"}
                    </p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm">Email Address</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-semibold">{profile?.email}</p>
                      {profile?.is_email_verified ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm">Phone Number</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-semibold">{profile?.phone || "Not provided"}</p>
                      {profile?.phone &&
                        (profile?.is_phone_verified ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm">Date of Birth</label>
                    <p className="text-white font-semibold">
                      {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : "Not provided"}
                    </p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm">Address</label>
                    <p className="text-white font-semibold">{profile?.address || "Not provided"}</p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm">Location</label>
                    <p className="text-white font-semibold">
                      {profile?.city && profile?.state
                        ? `${profile.city}, ${profile.state}, ${profile.country || "Nigeria"}`
                        : "Not provided"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Activity */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-400" />
                  Account Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 glass rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Last Login</p>
                      <p className="text-gray-400 text-sm">
                        {profile?.last_login ? new Date(profile.last_login).toLocaleString() : "Never logged in"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 glass rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Account Created</p>
                      <p className="text-gray-400 text-sm">
                        {profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 glass rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Favorite Game</p>
                      <p className="text-gray-400 text-sm">{stats?.favoriteGame || "No games played yet"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="mt-6">
            <AccountVerification profile={profile} onUpdate={fetchProfile} />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecuritySettings onUpdate={fetchProfile} />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Profile Editor Modal */}
      <ProfileEditor
        isOpen={showProfileEditor}
        onClose={() => setShowProfileEditor(false)}
        profile={profile}
        onUpdate={fetchProfile}
      />
    </div>
  )
}
