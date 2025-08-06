"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, PieChart, Calendar, Download, Target, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface AnalyticsData {
  totalBets: number
  totalWinnings: number
  totalLosses: number
  winRate: number
  profitLoss: number
  avgBetAmount: number
  bestDay: string
  worstDay: string
  monthlyData: Array<{
    month: string
    bets: number
    winnings: number
    losses: number
  }>
  gameTypeStats: Array<{
    game: string
    bets: number
    winRate: number
    profit: number
  }>
  hourlyActivity: Array<{
    hour: number
    bets: number
  }>
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Simulate analytics data
      const mockData: AnalyticsData = {
        totalBets: 156,
        totalWinnings: 45600,
        totalLosses: 23400,
        winRate: 68.5,
        profitLoss: 22200,
        avgBetAmount: 450,
        bestDay: "2024-01-15",
        worstDay: "2024-01-08",
        monthlyData: [
          { month: "Jan", bets: 45, winnings: 12500, losses: 6800 },
          { month: "Feb", bets: 52, winnings: 15200, losses: 8100 },
          { month: "Mar", bets: 59, winnings: 17900, losses: 8500 },
        ],
        gameTypeStats: [
          { game: "Sports", bets: 89, winRate: 72.1, profit: 15600 },
          { game: "Aviator", bets: 45, winRate: 64.4, profit: 8900 },
          { game: "Mini Games", bets: 22, winRate: 59.1, profit: -2300 },
        ],
        hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          bets: Math.floor(Math.random() * 10) + 1,
        })),
      }
      setAnalytics(mockData)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    if (!analytics) return

    const csvData = [
      ["Metric", "Value"],
      ["Total Bets", analytics.totalBets],
      ["Total Winnings", analytics.totalWinnings],
      ["Total Losses", analytics.totalLosses],
      ["Win Rate", `${analytics.winRate}%`],
      ["Profit/Loss", analytics.profitLoss],
      ["Average Bet", analytics.avgBetAmount],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `betting-analytics-${timeRange}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const stats = {
    totalBets: analytics?.totalBets || 0,
    winRate: analytics?.winRate || 0,
    profit: analytics?.profitLoss || 0,
    avgOdds: analytics?.avgBetAmount || 0,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-white/20 rounded w-32"></div>
              <div className="h-32 bg-white/10 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-xl flex items-center">
            <BarChart3 className="mr-2 text-blue-400" size={20} />
            Analytics Dashboard
          </h3>
          <div className="flex space-x-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={exportData}
              className="px-3 py-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg text-white text-sm font-medium hover:from-green-600 hover:to-blue-600 transition-all flex items-center space-x-1"
            >
              <Download size={14} />
              <span>Export</span>
            </motion.button>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="flex space-x-2">
          {[
            { key: "7d", label: "7 Days" },
            { key: "30d", label: "30 Days" },
            { key: "90d", label: "90 Days" },
            { key: "1y", label: "1 Year" },
          ].map((range) => (
            <motion.button
              key={range.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimeRange(range.key as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                timeRange === range.key
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {range.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalBets}</p>
                <p className="text-sm text-muted-foreground">Total Bets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.winRate}%</p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">${stats.profit}</p>
                <p className="text-sm text-muted-foreground">Total Profit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.avgOdds}</p>
                <p className="text-sm text-muted-foreground">Avg Odds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Your betting performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Win Rate</span>
                <span>{stats.winRate}%</span>
              </div>
              <Progress value={stats.winRate} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Profit Margin</span>
                <span>{((stats.profit / (stats.totalBets * 100)) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(stats.profit / (stats.totalBets * 100)) * 100} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6"
      >
        <h4 className="text-white font-bold text-lg mb-4 flex items-center">
          <TrendingUp className="mr-2" size={18} />
          Monthly Performance
        </h4>

        <div className="space-y-4">
          {analytics?.monthlyData.map((month, index) => (
            <motion.div
              key={month.month}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
            >
              <div className="flex items-center space-x-4">
                <div className="text-white font-medium w-12">{month.month}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-white/70">Bets: {month.bets}</span>
                    <span className="text-green-400">Won: KES {month.winnings.toLocaleString()}</span>
                    <span className="text-red-400">Lost: KES {month.losses.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                      style={{ width: `${(month.winnings / (month.winnings + month.losses)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${month.winnings > month.losses ? "text-green-400" : "text-red-400"}`}>
                  {month.winnings > month.losses ? "+" : ""}
                  KES {(month.winnings - month.losses).toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Game Type Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6"
      >
        <h4 className="text-white font-bold text-lg mb-4 flex items-center">
          <PieChart className="mr-2" size={18} />
          Game Type Performance
        </h4>

        <div className="space-y-4">
          {analytics?.gameTypeStats.map((game, index) => (
            <motion.div
              key={game.game}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-white/5 rounded-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      index === 0 ? "bg-blue-500" : index === 1 ? "bg-green-500" : "bg-purple-500"
                    }`}
                  />
                  <span className="text-white font-medium">{game.game}</span>
                </div>
                <div className={`font-bold ${game.profit > 0 ? "text-green-400" : "text-red-400"}`}>
                  {game.profit > 0 ? "+" : ""}KES {game.profit.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-white/60">Bets</div>
                  <div className="text-white font-bold">{game.bets}</div>
                </div>
                <div>
                  <div className="text-white/60">Win Rate</div>
                  <div className="text-white font-bold">{game.winRate}%</div>
                </div>
                <div>
                  <div className="text-white/60">ROI</div>
                  <div className={`font-bold ${game.profit > 0 ? "text-green-400" : "text-red-400"}`}>
                    {((game.profit / (game.bets * 100)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      index === 0
                        ? "bg-gradient-to-r from-blue-500 to-blue-600"
                        : index === 1
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : "bg-gradient-to-r from-purple-500 to-purple-600"
                    }`}
                    style={{ width: `${game.winRate}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Hourly Activity Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6"
      >
        <h4 className="text-white font-bold text-lg mb-4 flex items-center">
          <Calendar className="mr-2" size={18} />
          Betting Activity by Hour
        </h4>

        <div className="grid grid-cols-12 gap-1">
          {analytics?.hourlyActivity.map((hour) => (
            <motion.div
              key={hour.hour}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: hour.hour * 0.02 }}
              className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative group"
              style={{
                backgroundColor: `rgba(59, 130, 246, ${Math.min(hour.bets / 10, 1)})`,
              }}
            >
              <div className="text-white font-bold">{hour.hour}</div>
              <div className="text-white/70">{hour.bets}</div>

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {hour.hour}:00 - {hour.bets} bets
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-white/60">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>11 PM</span>
        </div>
      </motion.div>
    </div>
  )
}
