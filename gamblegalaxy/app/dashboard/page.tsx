"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Trophy,
  Activity,
  Eye,
  Star,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Gamepad2,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

interface DashboardStats {
  totalBalance: number
  totalBets: number
  totalWinnings: number
  totalLosses: number
  winRate: number
  activeBets: number
  recentActivities: any[]
  topWinners: any[]
}

interface TopWinner {
  id: number
  username: string
  amount: number
  game_type: string
  timestamp: string
}

export default function DashboardPage() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.username}! 👋</h1>
          <p className="text-gray-400">Here's what's happening with your account</p>
        </div>
        {user?.is_verified && (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
            <Star className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )}
      </motion.div>

      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Balance</p>
                  <p className="text-3xl font-bold text-white">₦{stats?.totalBalance?.toLocaleString() || "0.00"}</p>
                </div>
              </div>
              <Link href="/dashboard/wallet">
                <Button className="glass-button">
                  <Eye className="w-4 h-4 mr-2" />
                  View Wallet
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-4 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">Total Winnings</span>
                </div>
                <p className="text-xl font-bold text-green-400">₦{stats?.totalWinnings?.toLocaleString() || "0.00"}</p>
              </div>

              <div className="glass p-4 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-gray-400">Total Losses</span>
                </div>
                <p className="text-xl font-bold text-red-400">₦{stats?.totalLosses?.toLocaleString() || "0.00"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.totalBets || 0}</p>
            <p className="text-sm text-gray-400">Total Bets</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.winRate?.toFixed(1) || 0}%</p>
            <p className="text-sm text-gray-400">Win Rate</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.activeBets || 0}</p>
            <p className="text-sm text-gray-400">Active Bets</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Star className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              ₦{((stats?.totalWinnings || 0) - (stats?.totalLosses || 0)).toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">Net Profit</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Zap className="w-5 h-5 mr-2 text-purple-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/betting">
              <Button className="w-full glass-button h-16 flex flex-col space-y-2">
                <TrendingUp className="w-6 h-6" />
                <span>Sports Betting</span>
              </Button>
            </Link>

            <Link href="/dashboard/games">
              <Button className="w-full glass-button h-16 flex flex-col space-y-2">
                <Gamepad2 className="w-6 h-6" />
                <span>Aviator Game</span>
              </Button>
            </Link>

            <Link href="/dashboard/wallet">
              <Button className="w-full glass-button h-16 flex flex-col space-y-2">
                <Wallet className="w-6 h-6" />
                <span>Deposit</span>
              </Button>
            </Link>

            <Link href="/dashboard/betting/sure-odds">
              <Button className="w-full glass-button h-16 flex flex-col space-y-2">
                <Star className="w-6 h-6" />
                <span>Sure Odds</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity & Top Winners */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-400" />
                  Recent Activity
                </span>
                <Link href="/dashboard/activity">
                  <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                    View All
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.recentActivities?.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 glass rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        activity.activity_type === "win" || activity.activity_type === "deposit"
                          ? "bg-green-500/20"
                          : activity.activity_type === "bet"
                            ? "bg-blue-500/20"
                            : "bg-red-500/20"
                      }`}
                    >
                      {activity.activity_type === "win" || activity.activity_type === "deposit" ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : activity.activity_type === "bet" ? (
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{activity.description}</p>
                      <p className="text-gray-400 text-xs">{new Date(activity.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        activity.activity_type === "win" || activity.activity_type === "deposit"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {activity.activity_type === "win" || activity.activity_type === "deposit" ? "+" : "-"}₦
                      {activity.amount.toLocaleString()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}

              {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Winners */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                  Today's Top Winners
                </span>
                <Link href="/dashboard/leaderboard">
                  <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                    View All
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.topWinners?.slice(0, 5).map((winner, index) => (
                <div key={winner.id} className="flex items-center justify-between p-3 glass rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? "bg-yellow-500/20 text-yellow-400"
                          : index === 1
                            ? "bg-gray-500/20 text-gray-400"
                            : index === 2
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{winner.username}</p>
                      <p className="text-gray-400 text-xs capitalize">{winner.game_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">₦{winner.amount.toLocaleString()}</p>
                    <p className="text-gray-400 text-xs">{new Date(winner.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}

              {(!stats?.topWinners || stats.topWinners.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No winners yet today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
