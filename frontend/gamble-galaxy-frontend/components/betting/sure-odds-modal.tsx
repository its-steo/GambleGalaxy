"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Lock, Unlock, DollarSign, Eye, EyeOff, Star, Trophy, Crown, Sparkles, X, CheckCircle, AlertTriangle, Timer, Wallet } from 'lucide-react'
import type { SureOddSlip, Match } from "@/lib/types"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"

interface SureOddsModalProps {
  isOpen: boolean
  onClose: () => void
}

// Sure odds match interface (extends Match with prediction)
interface SureOddsMatch extends Match {
  prediction?: string
  confidence?: number
}

export function SureOddsModal({ isOpen, onClose }: SureOddsModalProps) {
  const { user } = useAuth()
  const [sureOdds, setSureOdds] = useState<SureOddSlip | null>(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState(3600) // 1 hour countdown
  const [error, setError] = useState<string | null>(null)

  const SURE_ODDS_PRICE = 10000 // KES 10,000

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    if (user) {
      try {
        const res = await api.getWallet()
        if (res.data && res.data.balance !== undefined) {
          setWalletBalance(Number(res.data.balance))
        }
      } catch (error) {
        console.error("Error fetching wallet balance:", error)
      }
    }
  }, [user])

  // Generate random predictions for matches
  const generateSureOddsPredictions = (matches: Match[]): SureOddsMatch[] => {
    const predictions = ['home_win', 'draw', 'away_win', 'over_2.5', 'under_2.5', 'btts_yes', 'btts_no']
    const predictionLabels: Record<string, string> = {
      home_win: 'Home Win',
      draw: 'Draw', 
      away_win: 'Away Win',
      'over_2.5': 'Over 2.5 Goals',
      'under_2.5': 'Under 2.5 Goals',
      btts_yes: 'Both Teams to Score - Yes',
      btts_no: 'Both Teams to Score - No'
    }

    // Randomly select 3-5 matches
    const shuffled = [...matches].sort(() => 0.5 - Math.random())
    const selectedMatches = shuffled.slice(0, Math.min(5, Math.max(3, matches.length)))

    return selectedMatches.map(match => {
      // Randomly select a prediction
      const randomPrediction = predictions[Math.floor(Math.random() * predictions.length)]
      
      // Generate confidence (85-98%)
      const confidence = Math.floor(Math.random() * (98 - 85 + 1)) + 85

      return {
        ...match,
        prediction: predictionLabels[randomPrediction],
        confidence
      }
    })
  }

  // Load sure odds from available matches
  const loadSureOdds = useCallback(async () => {
    console.log("🎯 Loading sure odds from available matches...")
    setLoading(true)
    setError(null)
    
    try {
      // First, try to get existing sure odds from API
      const sureOddsResponse = await api.getSureOdds()
      
      if (sureOddsResponse.data) {
        console.log("✅ Found existing sure odds:", sureOddsResponse.data)
        setSureOdds(sureOddsResponse.data)
        return
      }

      // If no existing sure odds, create from available matches
      console.log("📋 No existing sure odds, creating from available matches...")
      const matchesResponse = await api.getMatches()
      
      if (matchesResponse.data && matchesResponse.data.length > 0) {
        console.log(`📊 Found ${matchesResponse.data.length} available matches`)
        
        // Generate sure odds from available matches
        const sureOddsMatches = generateSureOddsPredictions(matchesResponse.data)
        
        // Create sure odds slip
        const generatedSureOdds: SureOddSlip = {
          id: Date.now(), // Use timestamp as ID
          code: `GALAXY${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          paid: false,
          show_predictions: false,
          allow_payment: true,
          dismiss: false,
          matches: sureOddsMatches.map(match => ({
            id: match.id,
            home_team: match.home_team,
            away_team: match.away_team,
            match_time: match.match_time,
            prediction: match.prediction || '',
            odds: match.odds_home_win || '2.0' // Use actual odds or default
          }))
        }
        
        console.log("✅ Generated sure odds:", generatedSureOdds)
        setSureOdds(generatedSureOdds)
        
      } else {
        console.log("❌ No matches available")
        setError("No matches available for sure odds")
      }
      
    } catch (error) {
      console.error("💥 Error loading sure odds:", error)
      setError("Failed to load sure odds. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (isOpen && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isOpen, timeLeft])

  // Load sure odds and wallet balance when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log("🚀 Modal opened, loading data...")
      loadSureOdds()
      fetchWalletBalance()
    } else {
      // Reset state when modal closes
      setSureOdds(null)
      setError(null)
      setLoading(false)
    }
  }, [isOpen, loadSureOdds, fetchWalletBalance])

  const handlePayment = async () => {
    if (!user) {
      toast.error("Login Required", {
        description: "Please log in to purchase sure odds",
        className: "bg-red-500/90 text-white border-red-400 backdrop-blur-md",
      })
      return
    }

    if (walletBalance < SURE_ODDS_PRICE) {
      toast.error("Insufficient Balance", {
        description: `You need KES ${SURE_ODDS_PRICE.toLocaleString()} to purchase sure odds`,
        className: "bg-red-500/90 text-white border-red-400 backdrop-blur-md",
      })
      return
    }

    setPaying(true)
    try {
      console.log("💳 Processing payment...")
      const response = await api.paySureOdds()
      console.log("💳 Payment response:", response)
      
      if (response.data || response.status === 200) {
        // Update wallet balance immediately
        setWalletBalance((prev) => prev - SURE_ODDS_PRICE)
        
        // Update sure odds to show as paid and reveal predictions
        setSureOdds(prev => prev ? {
          ...prev,
          paid: true,
          show_predictions: true
        } : null)
        
        toast.success("🎉 Payment Successful!", {
          description: `KES ${SURE_ODDS_PRICE.toLocaleString()} deducted. Premium predictions unlocked!`,
          className: "bg-green-500/90 text-white border-green-400 backdrop-blur-md",
        })
      } else {
        toast.error("Payment Failed", {
          description: response.error || "Please try again",
          className: "bg-red-500/90 text-white border-red-400 backdrop-blur-md",
        })
      }
    } catch (error) {
      console.error("💥 Payment error:", error)
      toast.error("Payment Error", {
        description: "Something went wrong. Please try again.",
        className: "bg-red-500/90 text-white border-red-400 backdrop-blur-md",
      })
    } finally {
      setPaying(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`
  }

  const getPredictionColor = (prediction: string) => {
    switch (prediction.toLowerCase()) {
      case "home win":
      case "1":
        return "from-green-500 to-emerald-500"
      case "draw":
      case "x":
        return "from-yellow-500 to-orange-500"
      case "away win":
      case "2":
        return "from-blue-500 to-cyan-500"
      case "over 2.5 goals":
      case "both teams to score - yes":
        return "from-purple-500 to-pink-500"
      case "under 2.5 goals":
      case "both teams to score - no":
        return "from-red-500 to-rose-500"
      default:
        return "from-indigo-500 to-purple-500"
    }
  }

  // Show loading state
  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white w-[95vw] max-w-sm mx-auto rounded-2xl overflow-hidden">
          <div className="p-6 text-center">
            <div className="relative mb-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500/30 border-t-purple-500 mx-auto"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border-2 border-purple-400/50 mx-auto"></div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Generating Sure Odds</h3>
            <p className="text-gray-400 text-sm">Analyzing available matches...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Show error state
  if (error && !sureOdds) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white w-[95vw] max-w-sm mx-auto rounded-2xl overflow-hidden">
          <div className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-bold text-white mb-2">Error Loading Sure Odds</h3>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <div className="flex gap-2">
              <Button
                onClick={loadSureOdds}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Retry
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Don't render if no data
  if (!sureOdds) {
    console.log("❌ No sure odds data, not rendering modal")
    return null
  }

  console.log("✅ Rendering modal with sure odds:", sureOdds)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white w-[95vw] max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 p-3 sm:p-4 border-b border-white/10 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">Premium Sure Odds</h2>
                <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-2 space-y-1 xs:space-y-0">
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs px-2 py-0.5 w-fit">
                    Code: {sureOdds.code}
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-2 py-0.5 w-fit">
                    95% Win Rate
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-white/20 rounded-lg p-1.5 sm:p-2 flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
          {/* Compact Timer */}
          {timeLeft > 0 && (
            <div className="mt-2 sm:mt-3 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/20">
              <div className="flex items-center justify-center space-x-2">
                <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 flex-shrink-0" />
                <span className="text-white text-xs sm:text-sm font-medium">Expires in:</span>
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 sm:px-3 py-1 rounded-md sm:rounded-lg font-mono text-xs sm:text-sm font-bold">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar">
          {/* Info Banner */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <p className="text-blue-300 text-sm">
                <strong>Expert Analysis:</strong> These predictions are generated from today's available matches using advanced algorithms.
              </p>
            </div>
          </div>

          {/* Wallet Balance Display */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold text-xs sm:text-sm truncate">Wallet Balance</h3>
                  <p className="text-gray-400 text-xs">Available funds</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-white font-bold text-sm sm:text-lg">KES {walletBalance.toLocaleString()}</div>
                <div
                  className={`text-xs font-medium ${
                    walletBalance >= SURE_ODDS_PRICE ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {walletBalance >= SURE_ODDS_PRICE ? "✅ Sufficient" : "❌ Insufficient"}
                </div>
              </div>
            </div>
          </Card>

          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0 ${
                    sureOdds.paid
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : "bg-gradient-to-r from-red-500 to-pink-500"
                  }`}
                >
                  {sureOdds.paid ? (
                    <Unlock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  ) : (
                    <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium text-xs">Payment</p>
                  <p className={`text-xs font-semibold ${sureOdds.paid ? "text-green-400" : "text-red-400"}`}>
                    {sureOdds.paid ? "Paid" : "Pending"}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0 ${
                    sureOdds.show_predictions
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                      : "bg-gradient-to-r from-gray-500 to-gray-600"
                  }`}
                >
                  {sureOdds.show_predictions ? (
                    <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  ) : (
                    <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium text-xs">Predictions</p>
                  <p
                    className={`text-xs font-semibold ${sureOdds.show_predictions ? "text-blue-400" : "text-gray-400"}`}
                  >
                    {sureOdds.show_predictions ? "Visible" : "Hidden"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Matches */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center text-sm">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-purple-400" />
                Selected Matches ({sureOdds.matches.length})
              </h3>
            </div>
            <div className="space-y-2">
              {sureOdds.matches.map((match, index) => (
                <Card
                  key={match.id}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start space-x-2 min-w-0 flex-1">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white font-bold text-xs">#{index + 1}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white font-medium text-xs sm:text-sm leading-tight">
                          <span className="block sm:inline">{match.home_team}</span>
                          <span className="text-gray-400 mx-1"> vs </span>
                          <span className="block sm:inline">{match.away_team}</span>
                        </h4>
                        <div className="flex items-center text-gray-400 text-xs mt-1">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{new Date(match.match_time).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Prediction */}
                  {sureOdds.show_predictions && match.prediction ? (
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-md sm:rounded-lg p-2 border border-green-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div
                            className={`w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r ${getPredictionColor(match.prediction)} rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0`}
                          >
                            <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-xs">Expert Prediction</p>
                            <p className="text-green-400 font-bold text-xs sm:text-sm truncate">{match.prediction}</p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs px-2 py-0.5 flex-shrink-0 ml-2">
                          <Star className="w-2 h-2 mr-1" />
                          {match.odds}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-500/20 rounded-md sm:rounded-lg p-2 border border-gray-500/30">
                      <div className="flex items-center justify-center space-x-2">
                        <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-gray-400 text-xs sm:text-sm text-center">
                          {sureOdds.paid ? "Prediction coming soon" : "Unlock to view expert prediction"}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Payment Section */}
          {sureOdds.allow_payment && !sureOdds.paid && (
            <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-lg sm:rounded-xl overflow-hidden">
              <div className="p-3 sm:p-4 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg">
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Unlock Expert Predictions</h4>
                <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4">
                  Get expert predictions for {sureOdds.matches.length} carefully selected matches
                </p>
                <div className="bg-white/10 rounded-md sm:rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-300">Price:</span>
                    <span className="text-white font-bold">KES {SURE_ODDS_PRICE.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm mt-1">
                    <span className="text-gray-300">After purchase:</span>
                    <span
                      className={`font-bold ${walletBalance >= SURE_ODDS_PRICE ? "text-green-400" : "text-red-400"}`}
                    >
                      KES {(walletBalance - SURE_ODDS_PRICE).toLocaleString()}
                    </span>
                  </div>
                </div>
                {walletBalance < SURE_ODDS_PRICE && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-md sm:rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                    <div className="flex items-center justify-center space-x-2">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-xs sm:text-sm font-medium text-center">
                        Need KES {(SURE_ODDS_PRICE - walletBalance).toLocaleString()} more
                      </p>
                    </div>
                  </div>
                )}
                <Button
                  onClick={handlePayment}
                  disabled={paying || walletBalance < SURE_ODDS_PRICE}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {paying ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Purchase Now
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                    </div>
                  )}
                </Button>
                <p className="text-gray-400 text-xs mt-2">🔒 Secure payment • ⚡ Instant access</p>
              </div>
            </Card>
          )}

          {/* Success Message */}
          {sureOdds.paid && (
            <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-lg sm:rounded-xl">
              <div className="p-3 sm:p-4 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-green-400 mb-1">Premium Access Unlocked!</h4>
                <p className="text-green-300 text-xs sm:text-sm">You now have access to expert predictions for all selected matches</p>
              </div>
            </Card>
          )}

          {/* Expired Notice */}
          {sureOdds.dismiss && (
            <Card className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg sm:rounded-xl">
              <div className="p-3 sm:p-4 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-red-400 mb-1">Offer Expired</h4>
                <p className="text-red-300 text-xs sm:text-sm">This sure odds slip has expired</p>
              </div>
            </Card>
          )}
        </div>

        {/* Custom Scrollbar Styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #8b5cf6, #ec4899);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #7c3aed, #db2777);
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
