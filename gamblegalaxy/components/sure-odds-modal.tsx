"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Star, Lock, Unlock, Clock, Trophy, Zap, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface SureOddsModalProps {
  isOpen: boolean
  onClose: () => void
}

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

export default function SureOddsModal({ isOpen, onClose }: SureOddsModalProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [sureOddsData, setSureOddsData] = useState<SureOddsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchSureOdds()
    }
  }, [isOpen])

  const fetchSureOdds = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/betting/sure-odds", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSureOddsData(data)
      } else {
        toast({
          title: "No Sure Odds Available",
          description: "No sure odds slip found. Please try again later.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching sure odds:", error)
      toast({
        title: "Error",
        description: "Failed to fetch sure odds data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setPaymentLoading(true)
    try {
      const response = await fetch("/api/betting/sure-odds/pay", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast({
          title: "Payment Successful! 🎉",
          description: "Sure odds predictions have been unlocked!",
        })
        fetchSureOdds() // Refresh data
      } else {
        const error = await response.json()
        toast({
          title: "Payment Failed",
          description: error.detail || "Payment failed. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during payment",
        variant: "destructive",
      })
    } finally {
      setPaymentLoading(false)
    }
  }

  const getPredictionIcon = (prediction: string) => {
    if (prediction === "LOCKED") return <Lock className="w-4 h-4" />
    return <Unlock className="w-4 h-4" />
  }

  const getPredictionColor = (prediction: string) => {
    if (prediction === "LOCKED") return "bg-red-500/20 text-red-300 border-red-500/30"
    return "bg-green-500/20 text-green-300 border-green-500/30"
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center animate-glow">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">Sure Odds Premium</CardTitle>
                      <p className="text-gray-400">AI-powered predictions with high accuracy</p>
                    </div>
                  </div>
                  <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white">Loading sure odds...</p>
                  </div>
                ) : sureOddsData ? (
                  <>
                    {/* Sure Odds Info */}
                    <div className="glass p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-white font-bold text-lg">Sure Odds Slip</h3>
                          <p className="text-gray-400 text-sm">Code: {sureOddsData.code}</p>
                        </div>
                        <Badge
                          className={
                            sureOddsData.paid
                              ? "bg-green-500/20 text-green-300 border-green-500/30"
                              : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          }
                        >
                          {sureOddsData.paid ? "PAID" : "UNPAID"}
                        </Badge>
                      </div>

                      {/* Payment Required */}
                      {!sureOddsData.paid && sureOddsData.allow_payment && (
                        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="text-yellow-300 font-semibold mb-2">Payment Required</h4>
                              <p className="text-gray-300 text-sm mb-4">
                                Unlock premium predictions for ₦10,000. These predictions have a high accuracy rate and
                                are available 30 minutes before match start.
                              </p>
                              <Button
                                onClick={handlePayment}
                                disabled={paymentLoading}
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                              >
                                {paymentLoading ? (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processing...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <Zap className="w-4 h-4" />
                                    <span>Pay ₦10,000 & Unlock</span>
                                  </div>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Waiting for Payment Window */}
                      {!sureOddsData.paid && !sureOddsData.allow_payment && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                          <div className="flex items-center space-x-3">
                            <Clock className="w-5 h-5 text-blue-400" />
                            <div>
                              <h4 className="text-blue-300 font-semibold">Payment Window Not Open</h4>
                              <p className="text-gray-300 text-sm">
                                Payment will be available 30 minutes before the first match starts.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Matches */}
                    <div className="space-y-3">
                      <h3 className="text-white font-bold flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                        Predicted Matches ({sureOddsData.matches.length})
                      </h3>

                      {sureOddsData.matches.map((match, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="glass-card">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="text-white font-semibold">
                                    {match.home_team} vs {match.away_team}
                                  </p>
                                  <p className="text-gray-400 text-sm">
                                    {new Date(match.match_time).toLocaleDateString()} at{" "}
                                    {new Date(match.match_time).toLocaleTimeString()}
                                  </p>
                                </div>
                                <Badge className={getPredictionColor(match.prediction)}>
                                  <div className="flex items-center space-x-1">
                                    {getPredictionIcon(match.prediction)}
                                    <span>{match.prediction}</span>
                                  </div>
                                </Badge>
                              </div>

                              {match.can_win && sureOddsData.show_predictions && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                  <div className="flex items-center space-x-2">
                                    <Trophy className="w-4 h-4 text-green-400" />
                                    <span className="text-green-300 text-sm font-semibold">
                                      Eligible for winnings (Verified account)
                                    </span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Features */}
                    <div className="glass p-4 rounded-xl">
                      <h4 className="text-white font-semibold mb-3">Sure Odds Features</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-gray-300 text-sm">AI-powered predictions</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-gray-300 text-sm">High accuracy rate</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-gray-300 text-sm">Verified accounts only</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-gray-300 text-sm">30-min unlock window</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Sure Odds Available</h3>
                    <p className="text-gray-400">Check back later for new predictions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
