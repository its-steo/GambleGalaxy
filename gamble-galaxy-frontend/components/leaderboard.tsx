"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Medal, Crown, Star, TrendingUp, Users } from "lucide-react"

interface LeaderboardUser {
  id: number
  username: string
  avatar?: string
  total_winnings: number
  win_rate: number
  total_bets: number
  rank: number
  badge?: string
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "all">("weekly")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [period])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      // Simulate leaderboard data
      const mockData: LeaderboardUser[] = [
        {
          id: 1,
          username: "BetKing2024",
          total_winnings: 125000,
          win_rate: 78.5,
          total_bets: 156,
          rank: 1,
          badge: "👑",
        },
        {
          id: 2,
          username: "LuckyStrike",
          total_winnings: 98500,
          win_rate: 72.3,
          total_bets: 203,
          rank: 2,
          badge: "🥈",
        },
        {
          id: 3,
          username: "AviatorPro",
          total_winnings: 87200,
          win_rate: 69.8,
          total_bets: 178,
          rank: 3,
          badge: "🥉",
        },
        {
          id: 4,
          username: "SportsMaster",
          total_winnings: 76800,
          win_rate: 65.4,
          total_bets: 234,
          rank: 4,
        },
        {
          id: 5,
          username: "CrashExpert",
          total_winnings: 65400,
          win_rate: 61.2,
          total_bets: 189,
          rank: 5,
        },
      ]
      setLeaderboard(mockData)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-400" size={20} />
      case 2:
        return <Medal className="text-gray-300" size={20} />
      case 3:
        return <Medal className="text-orange-400" size={20} />
      default:
        return <Trophy className="text-blue-400" size={16} />
    }
  }

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1:
        return "from-yellow-500/20 to-orange-500/20 border-yellow-500/30"
      case 2:
        return "from-gray-400/20 to-gray-600/20 border-gray-400/30"
      case 3:
        return "from-orange-500/20 to-red-500/20 border-orange-500/30"
      default:
        return "from-blue-500/10 to-purple-500/10 border-blue-500/20"
    }
  }

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-32"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/10 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-xl flex items-center">
          <Users className="mr-2 text-purple-400" size={20} />
          Leaderboard
        </h3>

        {/* Period Filter */}
        <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
          {["daily", "weekly", "monthly", "all"].map((periodOption) => (
            <motion.button
              key={periodOption}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPeriod(periodOption as any)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                period === periodOption
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {periodOption.charAt(0).toUpperCase() + periodOption.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        <AnimatePresence>
          {leaderboard.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 bg-gradient-to-r ${getRankGradient(user.rank)} border rounded-xl hover:scale-[1.02] transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className="flex items-center space-x-2">
                    {getRankIcon(user.rank)}
                    <span className="text-white font-bold text-lg">#{user.rank}</span>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.badge || user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.username}</div>
                      <div className="text-white/60 text-xs flex items-center space-x-2">
                        <span>{user.total_bets} bets</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <TrendingUp size={12} />
                          <span>{user.win_rate}%</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Winnings */}
                <div className="text-right">
                  <div className="text-green-400 font-bold text-lg">KES {user.total_winnings.toLocaleString()}</div>
                  <div className="text-white/60 text-xs">Total Winnings</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${user.win_rate}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-white/60 mt-1">
                  <span>Win Rate</span>
                  <span>{user.win_rate}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Your Rank */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Star className="text-blue-400" size={20} />
            <div>
              <div className="text-white font-medium">Your Rank</div>
              <div className="text-white/60 text-sm">Keep betting to climb higher!</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-blue-400 font-bold text-xl">#47</div>
            <div className="text-white/60 text-xs">This Week</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
