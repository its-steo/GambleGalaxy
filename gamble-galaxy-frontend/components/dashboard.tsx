"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Trophy, Activity, Zap, Target, Star } from "lucide-react"

interface DashboardStats {
  balance: number
  totalBets: number
  winRate: number
  rank: number
  todayProfit: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    balance: 0,
    totalBets: 0,
    winRate: 0,
    rank: 0,
    todayProfit: 0,
  })

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: "win", amount: 250, game: "Aviator", time: "2 min ago" },
    { id: 2, type: "bet", amount: 100, game: "Football", time: "5 min ago" },
    { id: 3, type: "win", amount: 180, game: "Basketball", time: "12 min ago" },
  ])

  useEffect(() => {
    // Load user stats from localStorage
    const balance = Number.parseFloat(localStorage.getItem("wallet_balance") || "1000")
    const totalBets = Number.parseInt(localStorage.getItem("total_bets") || "0")
    const winRate = Number.parseFloat(localStorage.getItem("win_rate") || "65.5")
    const rank = Number.parseInt(localStorage.getItem("user_rank") || "1247")
    const todayProfit = Number.parseFloat(localStorage.getItem("today_profit") || "125.50")

    setStats({ balance, totalBets, winRate, rank, todayProfit })
  }, [])

  const quickActions = [
    { name: "Sports Betting", icon: Target, color: "bg-blue-500" },
    { name: "Aviator", icon: Zap, color: "bg-purple-500" },
    { name: "Deposit", icon: DollarSign, color: "bg-green-500" },
    { name: "Tournaments", icon: Trophy, color: "bg-yellow-500" },
  ]

  return (
    <div className="space-y-6 p-4">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-muted-foreground">Ready to win big today?</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-xl font-bold">KES {stats.balance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Bets</p>
                <p className="text-xl font-bold">{stats.totalBets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-xl font-bold">{stats.winRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="text-xl font-bold">#{stats.rank}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump into your favorite games</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button key={index} variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                <action.icon className={`h-6 w-6 ${action.color.replace("bg-", "text-")}`} />
                <span className="text-sm">{action.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Today's Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-500">+KES {stats.todayProfit}</p>
              <p className="text-sm text-muted-foreground">Profit today</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              +12.5%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${activity.type === "win" ? "bg-green-500" : "bg-blue-500"}`} />
                  <div>
                    <p className="font-medium">
                      {activity.type === "win" ? "Won" : "Bet"} KES {activity.amount}
                    </p>
                    <p className="text-sm text-muted-foreground">{activity.game}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
