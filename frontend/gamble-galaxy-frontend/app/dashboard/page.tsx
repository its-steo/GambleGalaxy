"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarSign,
  TrendingUp,
  Trophy,
  Activity,
  Plane,
  Target,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  Star,
  Zap,
  Crown,
  Award,
  Clock,
  Menu,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import Link from "next/link"
import GlassSideNav from "@/components/layout/glass-side-nav"
import { api } from "@/lib/api"

// Create a flexible interface for the actual API response
interface ApiResponseData {
  totalBets?: number
  activeBets?: number
  totalWinnings?: number
  winRate?: number
  totalBalance?: number
  walletBalance?: number
  totalLosses?: number
  netProfit?: number
  recentActivities?: Array<{
    id: number
    activity_type: string
    description: string
    amount: number
    timestamp: string
    game_type?: string
    multiplier?: number
  }>
  topWinners?: Array<{
    id?: number
    username?: string
    user?: string
    amount: number | string
    game_type?: string
    multiplier?: number
    cash_out_multiplier?: number
  }>
  recentTransactions?: Array<{
    id: number
    amount: number
    transaction_type: string
    description: string
    created_at: string
    status: string
  }>
  recentBets?: Array<{
    id: number
    amount: number | string
    total_odds: number | string
    status: string
    created_at: string
  }>
  monthlyStats?: {
    totalBets: number
    totalWinnings: number
    totalLosses: number
  }
  weeklyStats?: {
    totalBets: number
    totalWinnings: number
    totalLosses: number
  }
  favoriteGames?: Array<{
    name: string
    count: number
    winRate: number
  }>
  achievements?: Array<{
    id: number
    name: string
    description: string
    unlocked: boolean
    unlockedAt?: string
  }>
}

// Local interface for transformed data
interface DashboardApiResponse {
  totalBets: number
  activeBets: number
  totalWinnings: number
  winRate: number
  totalBalance: number
  walletBalance: number
  totalLosses: number
  netProfit: number
  recentActivities: Array<{
    id: number
    activity_type: string
    description: string
    amount: number
    timestamp: string
    game_type?: string
    multiplier?: number
  }>
  topWinners: Array<{
    id: number
    username: string
    amount: number
    game_type?: string
    multiplier?: number
  }>
  recentTransactions: Array<{
    id: number
    amount: number
    transaction_type: string
    description: string
    created_at: string
    status: string
  }>
  recentBets: Array<{
    id: number
    amount: number | string
    total_odds: number | string
    status: string
    created_at: string
  }>
  monthlyStats: {
    totalBets: number
    totalWinnings: number
    totalLosses: number
  }
  weeklyStats: {
    totalBets: number
    totalWinnings: number
    totalLosses: number
  }
  favoriteGames: Array<{
    name: string
    count: number
    winRate: number
  }>
  achievements: Array<{
    id: number
    name: string
    description: string
    unlocked: boolean
    unlockedAt?: string
  }>
}

export default function DashboardPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const [sideNavOpen, setSideNavOpen] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const handleMouseMove = (e: MouseEvent) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }, 16) // 60fps throttling
    }

    // Only add mouse tracking on non-touch devices
    if (!("ontouchstart" in window)) {
      window.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Transform TopWinner data to match expected structure
  const transformTopWinners = (
    winners: Array<{
      id?: number
      username?: string
      user?: string
      amount: number | string
      game_type?: string
      multiplier?: number
      cash_out_multiplier?: number
    }>,
  ): Array<{
    id: number
    username: string
    amount: number
    game_type?: string
    multiplier?: number
  }> => {
    return winners.map((winner, index) => ({
      id: winner.id || index + 1,
      username: winner.username || winner.user || `Player ${index + 1}`,
      amount: typeof winner.amount === "string" ? Number.parseFloat(winner.amount) : winner.amount || 0,
      game_type: winner.game_type || "Unknown",
      multiplier: winner.multiplier || winner.cash_out_multiplier || undefined,
    }))
  }

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)

      // Use the API client and handle the response more flexibly
      const response = await api.getDashboardStats()

      if (response.data) {
        // Cast the response data to our flexible interface
        const apiData = response.data as ApiResponseData

        // Transform the API response to match our expected structure
        const transformedStats: DashboardApiResponse = {
          totalBets: apiData.totalBets || 0,
          activeBets: apiData.activeBets || 0,
          totalWinnings: apiData.totalWinnings || 0,
          winRate: apiData.winRate || 0,
          // Handle both walletBalance and totalBalance properties
          totalBalance: apiData.walletBalance || apiData.totalBalance || 0,
          walletBalance: apiData.walletBalance || apiData.totalBalance || 0,
          totalLosses: apiData.totalLosses || 0,
          netProfit: apiData.netProfit || (apiData.totalWinnings || 0) - (apiData.totalLosses || 0),
          recentActivities: apiData.recentActivities || [],
          // Transform topWinners to match expected structure
          topWinners: transformTopWinners(apiData.topWinners || []),
          recentTransactions: apiData.recentTransactions || [],
          recentBets: apiData.recentBets || [],
          monthlyStats: apiData.monthlyStats || {
            totalBets: 0,
            totalWinnings: 0,
            totalLosses: 0,
          },
          weeklyStats: apiData.weeklyStats || {
            totalBets: 0,
            totalWinnings: 0,
            totalLosses: 0,
          },
          favoriteGames: apiData.favoriteGames || [],
          achievements: apiData.achievements || [],
        }

        setStats(transformedStats)
      } else {
        toast.error(response.error || "Failed to load dashboard data")
        // Set default empty stats to prevent crashes
        setStats({
          totalBets: 0,
          activeBets: 0,
          totalWinnings: 0,
          winRate: 0,
          totalBalance: 0,
          walletBalance: 0,
          totalLosses: 0,
          netProfit: 0,
          recentActivities: [],
          topWinners: [],
          recentTransactions: [],
          recentBets: [],
          monthlyStats: { totalBets: 0, totalWinnings: 0, totalLosses: 0 },
          weeklyStats: { totalBets: 0, totalWinnings: 0, totalLosses: 0 },
          favoriteGames: [],
          achievements: [],
        })
      }
    } catch (error) {
      console.error("Dashboard error:", error)
      toast.error("Error loading dashboard")
      // Set default empty stats on error
      setStats({
        totalBets: 0,
        activeBets: 0,
        totalWinnings: 0,
        winRate: 0,
        totalBalance: 0,
        walletBalance: 0,
        totalLosses: 0,
        netProfit: 0,
        recentActivities: [],
        topWinners: [],
        recentTransactions: [],
        recentBets: [],
        monthlyStats: { totalBets: 0, totalWinnings: 0, totalLosses: 0 },
        weeklyStats: { totalBets: 0, totalWinnings: 0, totalLosses: 0 },
        favoriteGames: [],
        achievements: [],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Load dashboard data
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated, authLoading, loadDashboardData])

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
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
          <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-36 h-36 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 text-center max-w-sm mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-4 sm:mb-6"></div>
          <p className="text-white text-lg sm:text-xl font-semibold mb-2">Loading Dashboard...</p>
          <p className="text-gray-400 text-sm sm:text-base">Fetching your latest data</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
        </div>
        <div className="relative z-10 text-center max-w-md mx-auto">
          <h2 className="text-white text-xl sm:text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400 text-sm sm:text-base mb-6">Please log in to view your dashboard</p>
          <Link href="/auth/login">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
        {!("ontouchstart" in window) && (
          <div
            className="absolute w-24 h-24 sm:w-48 sm:h-48 lg:w-96 lg:h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl transition-all duration-1000 ease-out"
            style={{
              left: mousePosition.x - 48,
              top: mousePosition.y - 48,
            }}
          />
        )}
        <div className="absolute top-1/4 left-1/4 w-24 h-24 sm:w-36 sm:h-36 lg:w-72 lg:h-72 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-28 h-28 sm:w-40 sm:h-40 lg:w-80 lg:h-80 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        {[...Array(window.innerWidth > 768 ? 15 : 8)].map((_, i) => (
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
      <div className="hidden xl:block relative z-20">
        <GlassSideNav onShare={handleShare} />
      </div>

      {sideNavOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSideNavOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw]">
            <GlassSideNav onShare={handleShare} onClose={() => setSideNavOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative z-10 min-w-0">
        <div className="xl:hidden flex items-center justify-between p-3 sm:p-4 bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-30">
          <button
            onClick={() => setSideNavOpen(true)}
            className="p-2 sm:p-3 text-white hover:bg-white/10 rounded-xl transition-colors touch-manipulation"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-white truncate px-2">Dashboard</h1>
          <Button
            onClick={refreshData}
            disabled={refreshing}
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
          >
            {refreshing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 lg:mb-12">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-2 leading-tight">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent block sm:inline">
                  {user?.username}
                </span>
              </h1>
              <p className="text-gray-400 text-sm sm:text-base lg:text-lg">{"Here's your gaming overview"}</p>
            </div>
            <div className="hidden xl:block">
              <Button
                onClick={refreshData}
                disabled={refreshing}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
            {[
              {
                title: "Wallet Balance",
                value: formatCurrency(stats?.totalBalance || stats?.walletBalance || 0),
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
                className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] group"
              >
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r ${stat.color} rounded-lg sm:rounded-xl flex items-center justify-center`}
                    >
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm text-green-400 font-semibold">{stat.change}</span>
                  </div>
                  <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1 leading-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400">{stat.title}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 mb-6 sm:mb-8 lg:mb-12">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-white flex items-center text-lg sm:text-xl lg:text-2xl">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3 text-yellow-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { name: "Play Aviator", icon: Plane, href: "/games/aviator", color: "from-red-500 to-orange-500" },
                  { name: "Sports Betting", icon: Trophy, href: "/betting", color: "from-green-500 to-emerald-500" },
                  { name: "Deposit", icon: ArrowUpCircle, href: "/wallet", color: "from-blue-500 to-cyan-500" },
                  { name: "Withdraw", icon: ArrowDownCircle, href: "/wallet", color: "from-purple-500 to-pink-500" },
                ].map((action, index) => (
                  <Link key={index} href={action.href}>
                    <Button
                      className={`w-full h-auto py-3 sm:py-4 lg:py-6 bg-gradient-to-r ${action.color} hover:scale-[1.02] active:scale-95 transition-all duration-300 flex flex-col items-center space-y-1 sm:space-y-2 touch-manipulation`}
                    >
                      <action.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                      <span className="text-xs sm:text-sm lg:text-base font-semibold leading-tight text-center">
                        {action.name}
                      </span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="activity" className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="flex justify-center">
              <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1 grid grid-cols-3 w-full max-w-lg">
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg px-3 sm:px-6 py-2 sm:py-3 transition-all duration-300 text-xs sm:text-sm touch-manipulation"
                >
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Activity</span>
                </TabsTrigger>
                <TabsTrigger
                  value="winners"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg px-3 sm:px-6 py-2 sm:py-3 transition-all duration-300 text-xs sm:text-sm touch-manipulation"
                >
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Winners</span>
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg px-3 sm:px-6 py-2 sm:py-3 transition-all duration-300 text-xs sm:text-sm touch-manipulation"
                >
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Stats</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Recent Activity Tab */}
            <TabsContent value="activity">
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl lg:text-2xl">
                    <History className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3 text-blue-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {stats.recentActivities.slice(0, 10).map((activity) => {
                        const IconComponent = getActivityIcon(activity.activity_type)
                        return (
                          <div
                            key={activity.id}
                            className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300"
                          >
                            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                              <div
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/10 flex items-center justify-center ${getActivityColor(activity.activity_type)} flex-shrink-0`}
                              >
                                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-white font-semibold text-sm sm:text-base truncate">
                                  {activity.description}
                                </div>
                                <div className="text-gray-400 text-xs sm:text-sm flex items-center flex-wrap gap-2">
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatTimeAgo(activity.timestamp)}
                                  </div>
                                  {activity.game_type && (
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                                      {activity.game_type}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <div
                                className={`font-bold text-sm sm:text-base ${activity.activity_type === "withdraw" ? "text-red-400" : "text-green-400"}`}
                              >
                                {activity.activity_type === "withdraw" ? "-" : "+"}
                                {formatCurrency(activity.amount)}
                              </div>
                              {activity.multiplier && (
                                <div className="text-yellow-400 text-xs sm:text-sm">{activity.multiplier}x</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <Activity className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-500" />
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No recent activity</h3>
                      <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
                        Start playing to see your activity here
                      </p>
                      <Link href="/games/aviator">
                        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto">
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
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl lg:text-2xl">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3 text-yellow-400" />
                    {"Today's Top Winners"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {stats?.topWinners && stats.topWinners.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {stats.topWinners.map((winner, index) => (
                        <div
                          key={winner.id}
                          className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                            <div
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base flex-shrink-0 ${
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
                            <div className="min-w-0 flex-1">
                              <div className="text-white font-semibold text-sm sm:text-base truncate">
                                {winner.username}
                              </div>
                              <div className="text-gray-400 text-xs sm:text-sm flex items-center flex-wrap gap-2">
                                <span>{winner.game_type}</span>
                                {winner.multiplier && <span className="text-yellow-400">{winner.multiplier}x</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-green-400 font-bold text-sm sm:text-base lg:text-lg flex-shrink-0 ml-2">
                            {formatCurrency(winner.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <Crown className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-500" />
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No winners yet today</h3>
                      <p className="text-gray-400 text-sm sm:text-base">Be the first to make it to the leaderboard!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Performance Stats */}
                <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-400" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 pt-0">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300 text-sm sm:text-base">Total Bets</span>
                      <span className="text-white font-bold text-sm sm:text-base">{stats?.totalBets || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300 text-sm sm:text-base">Total Winnings</span>
                      <span className="text-green-400 font-bold text-sm sm:text-base">
                        {formatCurrency(stats?.totalWinnings || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300 text-sm sm:text-base">Total Losses</span>
                      <span className="text-red-400 font-bold text-sm sm:text-base">
                        {formatCurrency(stats?.totalLosses || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300 text-sm sm:text-base">Net Profit</span>
                      <span
                        className={`font-bold text-sm sm:text-base ${(stats?.netProfit || 0) >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {formatCurrency(stats?.netProfit || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Achievement Card */}
                <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-400" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center py-6 sm:py-8">
                      <Star className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-yellow-400" />
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Coming Soon!</h3>
                      <p className="text-gray-300 text-sm sm:text-base">Unlock achievements as you play</p>
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
