"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, Clock, Trophy, Zap } from "lucide-react"

interface LiveMatch {
  id: number
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  status: string
  minute: number
  league: string
  home_logo?: string
  away_logo?: string
}

export default function LiveScores() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLiveScores()
    const interval = setInterval(fetchLiveScores, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchLiveScores = async () => {
    try {
      // Simulate live scores data
      const mockData: LiveMatch[] = [
        {
          id: 1,
          home_team: "Manchester United",
          away_team: "Liverpool",
          home_score: 2,
          away_score: 1,
          status: "second_half",
          minute: 67,
          league: "Premier League",
        },
        {
          id: 2,
          home_team: "Barcelona",
          away_team: "Real Madrid",
          home_score: 0,
          away_score: 0,
          status: "first_half",
          minute: 23,
          league: "La Liga",
        },
        {
          id: 3,
          home_team: "Bayern Munich",
          away_team: "Dortmund",
          home_score: 3,
          away_score: 2,
          status: "fulltime",
          minute: 90,
          league: "Bundesliga",
        },
      ]
      setLiveMatches(mockData)
    } catch (error) {
      console.error("Error fetching live scores:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "first_half":
      case "second_half":
        return <Play className="text-green-400" size={16} />
      case "halftime":
        return <Pause className="text-yellow-400" size={16} />
      case "fulltime":
        return <Trophy className="text-blue-400" size={16} />
      default:
        return <Clock className="text-gray-400" size={16} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "first_half":
      case "second_half":
        return "text-green-400"
      case "halftime":
        return "text-yellow-400"
      case "fulltime":
        return "text-blue-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusText = (status: string, minute: number) => {
    switch (status) {
      case "first_half":
        return `${minute}'`
      case "second_half":
        return `${minute}'`
      case "halftime":
        return "HT"
      case "fulltime":
        return "FT"
      default:
        return "Soon"
    }
  }

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-32"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white/10 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-xl flex items-center">
          <Zap className="mr-2 text-yellow-400" size={20} />
          Live Scores
        </h3>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="w-3 h-3 bg-red-500 rounded-full"
        />
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {liveMatches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-xl hover:from-white/10 hover:to-white/15 transition-all"
            >
              {/* League */}
              <div className="text-white/60 text-xs mb-2 flex items-center justify-between">
                <span>{match.league}</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(match.status)}
                  <span className={getStatusColor(match.status)}>{getStatusText(match.status, match.minute)}</span>
                </div>
              </div>

              {/* Teams and Score */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {match.home_team.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{match.home_team}</span>
                    </div>
                    <motion.div
                      key={`home-${match.home_score}`}
                      initial={{ scale: 1.2, color: "#10b981" }}
                      animate={{ scale: 1, color: "#ffffff" }}
                      className="text-2xl font-bold text-white"
                    >
                      {match.home_score}
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {match.away_team.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{match.away_team}</span>
                    </div>
                    <motion.div
                      key={`away-${match.away_score}`}
                      initial={{ scale: 1.2, color: "#10b981" }}
                      animate={{ scale: 1, color: "#ffffff" }}
                      className="text-2xl font-bold text-white"
                    >
                      {match.away_score}
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Quick Bet Button */}
              {match.status !== "fulltime" && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-3 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg text-green-400 font-medium text-sm hover:from-green-500/30 hover:to-blue-500/30 transition-all"
                >
                  Quick Bet
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
