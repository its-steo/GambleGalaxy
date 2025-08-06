"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { History, Trophy, Clock, CheckCircle, XCircle, Loader } from "lucide-react"
import { apiService } from "@/lib/api"

interface Bet {
  id: number
  amount: number
  total_odds: number
  status: "pending" | "won" | "lost"
  placed_at: string
  expected_payout: number
  selections: Array<{
    match: {
      home_team: string
      away_team: string
    }
    selected_option: string
    is_correct?: boolean
  }>
}

export default function BetHistory() {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "won" | "lost">("all")

  useEffect(() => {
    fetchBetHistory()
  }, [])

  const fetchBetHistory = async () => {
    try {
      const data = await apiService.getBetHistory()
      setBets(data)
    } catch (error) {
      console.error("Error fetching bet history:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBets = bets.filter((bet) => filter === "all" || bet.status === filter)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return <CheckCircle className="text-green-400" size={16} />
      case "lost":
        return <XCircle className="text-red-400" size={16} />
      default:
        return <Loader className="text-yellow-400 animate-spin" size={16} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "text-green-400"
      case "lost":
        return "text-red-400"
      default:
        return "text-yellow-400"
    }
  }

  const getOptionLabel = (option: string) => {
    const labels: { [key: string]: string } = {
      home_win: "1",
      draw: "X",
      away_win: "2",
      "over_2.5": "O2.5",
      "under_2.5": "U2.5",
      btts_yes: "BTTS",
      btts_no: "No BTTS",
    }
    return labels[option] || option
  }

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-32"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white/10 rounded-xl"></div>
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
          <History className="mr-2" size={20} />
          Bet History
        </h3>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {["all", "pending", "won", "lost"].map((filterOption) => (
            <motion.button
              key={filterOption}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(filterOption as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === filterOption
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bets List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredBets.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 text-white/60">
              <Trophy size={48} className="mx-auto mb-4 opacity-50" />
              <p>No bets found for this filter</p>
            </motion.div>
          ) : (
            filteredBets.map((bet, index) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                {/* Bet Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(bet.status)}
                    <div>
                      <div className="text-white font-medium">Bet #{bet.id}</div>
                      <div className="text-white/60 text-xs flex items-center space-x-2">
                        <Clock size={12} />
                        <span>{new Date(bet.placed_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-white font-bold">KES {bet.amount.toLocaleString()}</div>
                    <div className="text-white/60 text-xs">@ {bet.total_odds.toFixed(2)}x</div>
                  </div>
                </div>

                {/* Selections */}
                <div className="space-y-2 mb-3">
                  {bet.selections.map((selection, selIndex) => (
                    <div key={selIndex} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                      <div className="text-white text-sm">
                        {selection.match.home_team} vs {selection.match.away_team}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white/70 text-sm">{getOptionLabel(selection.selected_option)}</span>
                        {selection.is_correct !== undefined && (
                          <div
                            className={`w-2 h-2 rounded-full ${selection.is_correct ? "bg-green-400" : "bg-red-400"}`}
                          ></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bet Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className={`font-bold ${getStatusColor(bet.status)}`}>{bet.status.toUpperCase()}</div>

                  {bet.status === "won" && (
                    <div className="text-green-400 font-bold">Won: KES {bet.expected_payout.toLocaleString()}</div>
                  )}

                  {bet.status === "pending" && (
                    <div className="text-yellow-400 font-bold">
                      Potential: KES {bet.expected_payout.toLocaleString()}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
