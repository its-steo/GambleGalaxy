"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Unlock, Clock, Star, Trophy } from "lucide-react"
import { useNotification } from "./notification-system"
import { apiService } from "@/lib/api"

interface SureOddsData {
  code: string
  matches: Array<{
    home_team: string
    away_team: string
    match_time: string
    prediction: string
    can_win: boolean
  }>
  paid: boolean
  allow_payment: boolean
  show_predictions: boolean
  dismiss: boolean
}

export default function SureOdds() {
  const [sureOdds, setSureOdds] = useState<SureOddsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const { addNotification } = useNotification()

  useEffect(() => {
    fetchSureOdds()
    const interval = setInterval(fetchSureOdds, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchSureOdds = async () => {
    try {
      const data = await apiService.getSureOdds()
      setSureOdds(data)
    } catch (error) {
      console.error("Error fetching sure odds:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setPaying(true)
    try {
      await apiService.paySureOdds()
      addNotification({
        type: "success",
        title: "Payment Successful!",
        message: "Sure odds predictions have been unlocked",
      })
      fetchSureOdds()
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Payment Failed",
        message: error.message || "Unable to process payment",
      })
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-32"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!sureOdds || sureOdds.dismiss) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
        <Star className="mx-auto mb-4 text-yellow-400" size={48} />
        <h3 className="text-white font-bold text-lg mb-2">No Sure Odds Available</h3>
        <p className="text-white/70">Check back later for premium predictions</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
            <Star className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Sure Odds</h3>
            <p className="text-white/70 text-sm">Premium Predictions</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-yellow-400 font-bold">KES 10,000</div>
          <div className="text-white/60 text-xs">Code: {sureOdds.code.slice(0, 8)}</div>
        </div>
      </div>

      {/* Matches */}
      <div className="space-y-3 mb-6">
        {sureOdds.matches.map((match, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-white/5 border border-white/10 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-white font-medium text-sm">
                {match.home_team} vs {match.away_team}
              </div>
              <div className="flex items-center space-x-2 text-white/60 text-xs">
                <Clock size={12} />
                <span>{new Date(match.match_time).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {sureOdds.show_predictions ? (
                  <>
                    <Unlock className="text-green-400" size={16} />
                    <span className="text-green-400 font-bold">{match.prediction}</span>
                    {match.can_win && <Trophy className="text-yellow-400" size={14} />}
                  </>
                ) : (
                  <>
                    <Lock className="text-red-400" size={16} />
                    <span className="text-red-400">LOCKED</span>
                  </>
                )}
              </div>

              {sureOdds.paid && (
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    match.can_win ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {match.can_win ? "Can Win" : "Cannot Win"}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Button */}
      <AnimatePresence>
        {sureOdds.allow_payment && !sureOdds.paid && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePayment}
            disabled={paying}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {paying ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Unlock size={20} />
                <span>Unlock Predictions - KES 10,000</span>
              </>
            )}
          </motion.button>
        )}

        {sureOdds.paid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl"
          >
            <div className="flex items-center justify-center space-x-2 text-green-400 font-bold">
              <Unlock size={20} />
              <span>Predictions Unlocked!</span>
            </div>
            <p className="text-white/70 text-sm mt-1">Good luck with your bets!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning */}
      {!sureOdds.paid && (
        <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <p className="text-orange-400 text-xs text-center">
            ⚠️ Payment unlocks predictions. Only verified users can win from sure odds.
          </p>
        </div>
      )}
    </motion.div>
  )
}
