"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, Trophy, Activity, Plane, Target, ArrowUpCircle, ArrowDownCircle, History, Star, Zap, Crown, Award, Clock, Menu } from 'lucide-react'
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import Link from "next/link"
import GlassSideNav from "@/components/layout/glass-side-nav"
import { api } from "@/lib/api" // Import the API client

interface DashboardStats {
  totalBalance: number
  totalBets: number
  totalWinnings: number
  totalLosses: number
  winRate: number
  activeBets: number
  netProfit: number
  recentActivities: RecentActivity[]
  topWinners: TopWinner[]
}

interface RecentActivity {
  id: number
  activity_type: string
  game_type?: string
  amount: number
  multiplier?: number
  description: string
  status: string
  timestamp: string
}

interface TopWinner {
  id: number
  username: string
  amount: number
  game_type: string
  multiplier?: number
  timestamp: string
}

export default function DashboardPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const [sideNavOpen, setSideNavOpen] = useState(false)

  // Mouse tracking for interactive background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Load dashboard data
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated, authLoading])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Use the API client instead of direct fetch
      const response = await api.getDashboardStats()
      
      if (response.data) {
        setStats(response.data)
      } else {
        toast.error(response.error || "Failed to load dashboard data")
      }
    } catch (error) {
      console.error("Dashboard error:", error)
      toast.error("Error loading dashboard")
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
    toast.success("Dashboard refreshed!")
  }

  const handleShare = () => {
    toast.success("Share functionality coming soon!")
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "bet":
        return Trophy
      case "win":
        return Award
      case "deposit":
        return ArrowUpCircle
      case "withdraw":
        return ArrowDownCircle
      case "cashout":
        return Plane
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "bet":
        return "text-blue-400"
      case "win":
        return "text-green-400"
      case "deposit":
        return "text-green-400"
      case "withdraw":
        return "text-red-400"
      case "cashout":
        return "text-yellow-400"
      default:
        return "text-gray-400"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
          <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-60 h-60 sm:w-80 sm:h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-6"></div>
          <p className="text-white text-xl font-semibold mb-2">Loading Dashboard...</p>
          <p className="text-gray-400">Fetching your latest data</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
        </div>
        <div className="relative z-10 text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-6">Please log in to view your dashboard</p>
          <Link href="/auth/login">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex">
      {/* Enhanced Glassmorphism Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
        <div
          className="absolute w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 96,
            top: mousePosition.y - 96,
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-36 h-36 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Side Navigation - Desktop */}
      <div className="hidden lg:block relative z-20">
        <GlassSideNav onShare={handleShare} />
      </div>

      {/* Mobile Side Navigation Overlay */}
      {sideNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSideNavOpen(false)} />
          {/* Side Nav */}
          <div className="relative">
            <GlassSideNav onShare={handleShare} onClose={() => setSideNavOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative z-10">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border-b border-white/10">
          <button
            onClick={() => setSideNavOpen(true)}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  {user?.username}
                </span>
              </h1>
              <p className="text-gray-400 text-lg">{"Here's your gaming overview"}</p>
            </div>
            <Button
              onClick={refreshData}
              disabled={refreshing}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 mt-4 sm:mt-0"
            >
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {[
              {
                title: "Wallet Balance",
                value: formatCurrency(stats?.totalBalance || 0),
                icon: DollarSign,
                color: "from-green-500 to-emerald-500",
                change: "+12.5%",
              },
              {
                title: "Total Winnings",
                value: formatCurrency(stats?.totalWinnings || 0),
                icon: Trophy,
                color: "from-yellow-500 to-orange-500",
                change: "+8.2%",
              },
              {
                title: "Win Rate",
                value: `${(stats?.winRate || 0).toFixed(1)}%`,
                icon: Target,
                color: "from-blue-500 to-cyan-500",
                change: "+2.1%",
              },
              {
                title: "Active Bets",
                value: stats?.activeBets?.toString() || "0",
                icon: Activity,
                color: "from-purple-500 to-pink-500",
                change: "3 pending",
              },
            ].map((stat, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 group"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}
                    >
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="text-xs text-green-400 font-semibold">{stat.change}</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.title}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 mb-8 sm:mb-12">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-xl sm:text-2xl">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-yellow-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: "Play Aviator", icon: Plane, href: "/games/aviator", color: "from-red-500 to-orange-500" },
                  { name: "Sports Betting", icon: Trophy, href: "/betting", color: "from-green-500 to-emerald-500" },
                  { name: "Deposit", icon: ArrowUpCircle, href: "/wallet", color: "from-blue-500 to-cyan-500" },
                  { name: "Withdraw", icon: ArrowDownCircle, href: "/wallet", color: "from-purple-500 to-pink-500" },
                ].map((action, index) => (
                  <Link key={index} href={action.href}>
                    <Button
                      className={`w-full h-auto py-4 sm:py-6 bg-gradient-to-r ${action.color} hover:scale-105 transition-all duration-300 flex flex-col items-center space-y-2`}
                    >
                      <action.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                      <span className="text-sm sm:text-base font-semibold">{action.name}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="activity" className="space-y-6 sm:space-y-8">
            <div className="flex justify-center">
              <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1 grid grid-cols-3 w-full max-w-md">
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg px-6 py-3 transition-all duration-300"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Activity
                </TabsTrigger>
                <TabsTrigger
                  value="winners"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg px-6 py-3 transition-all duration-300"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Winners
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg px-6 py-3 transition-all duration-300"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Stats
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Recent Activity Tab */}
            <TabsContent value="activity">
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-xl sm:text-2xl">
                    <History className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentActivities.slice(0, 10).map((activity) => {
                        const IconComponent = getActivityIcon(activity.activity_type)
                        return (
                          <div
                            key={activity.id}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300"
                          >
                            <div className="flex items-center space-x-4">
                              <div
                                className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center ${getActivityColor(activity.activity_type)}`}
                              >
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-white font-semibold">{activity.description}</div>
                                <div className="text-gray-400 text-sm flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatTimeAgo(activity.timestamp)}
                                  {activity.game_type && (
                                    <span className="ml-2 px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                                      {activity.game_type}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`font-bold ${activity.activity_type === "withdraw" ? "text-red-400" : "text-green-400"}`}
                              >
                                {activity.activity_type === "withdraw" ? "-" : "+"}
                                {formatCurrency(activity.amount)}
                              </div>
                              {activity.multiplier && (
                                <div className="text-yellow-400 text-sm">{activity.multiplier}x</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                      <h3 className="text-xl font-semibold text-white mb-2">No recent activity</h3>
                      <p className="text-gray-400 mb-6">Start playing to see your activity here</p>
                      <Link href="/games/aviator">
                        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                          <Plane className="w-4 h-4 mr-2" />
                          Play Aviator
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Winners Tab */}
            <TabsContent value="winners">
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-xl sm:text-2xl">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-yellow-400" />
                    {"Today's Top Winners"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.topWinners && stats.topWinners.length > 0 ? (
                    <div className="space-y-4">
                      {stats.topWinners.map((winner, index) => (
                        <div
                          key={winner.id}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                index === 0
                                  ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                  : index === 1
                                    ? "bg-gradient-to-r from-gray-400 to-gray-500"
                                    : index === 2
                                      ? "bg-gradient-to-r from-orange-600 to-yellow-600"
                                      : "bg-gradient-to-r from-purple-500 to-pink-500"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-white font-semibold">{winner.username}</div>
                              <div className="text-gray-400 text-sm">
                                {winner.game_type}
                                {winner.multiplier && (
                                  <span className="ml-2 text-yellow-400">{winner.multiplier}x</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-green-400 font-bold text-lg">{formatCurrency(winner.amount)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Crown className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                      <h3 className="text-xl font-semibold text-white mb-2">No winners yet today</h3>
                      <p className="text-gray-400">Be the first to make it to the leaderboard!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Detailed Stats Tab */}
            <TabsContent value="stats">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Stats */}
                <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center text-xl">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300">Total Bets</span>
                      <span className="text-white font-bold">{stats?.totalBets || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300">Total Winnings</span>
                      <span className="text-green-400 font-bold">{formatCurrency(stats?.totalWinnings || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300">Total Losses</span>
                      <span className="text-red-400 font-bold">{formatCurrency(stats?.totalLosses || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300">Net Profit</span>
                      <span className={`font-bold ${(stats?.netProfit || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {formatCurrency(stats?.netProfit || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Achievement Card */}
                <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center text-xl">
                      <Award className="w-5 h-5 mr-2 text-yellow-400" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-8">
                      <Star className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                      <h3 className="text-xl font-bold text-white mb-2">Coming Soon!</h3>
                      <p className="text-gray-300">Unlock achievements as you play</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
