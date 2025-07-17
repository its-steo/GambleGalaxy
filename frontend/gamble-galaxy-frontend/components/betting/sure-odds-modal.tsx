"use client"

import { useState, useEffect } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Lock, Unlock, DollarSign, Eye, EyeOff } from "lucide-react"
import type { SureOddSlip } from "@/lib/types"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface SureOddsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SureOddsModal({ isOpen, onClose }: SureOddsModalProps) {
  const [sureOdds, setSureOdds] = useState<SureOddSlip | null>(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadSureOdds()
    }
  }, [isOpen])

  const loadSureOdds = async () => {
    setLoading(true)
    try {
      const response = await api.getSureOdds()
      if (response.data) {
        setSureOdds(response.data)
      } else {
        toast.error("No sure odds available", {
          description: "Please check back later",
        })
        onClose()
      }
    } catch (error) {
      toast.error("Failed to load sure odds")
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setPaying(true)
    try {
      const response = await api.paySureOdds()
      if (response.data) {
        toast.success("Payment successful!", {
          description: "Predictions unlocked!",
        })
        loadSureOdds() // Reload to show predictions
      } else {
        toast.error("Payment failed", {
          description: response.error || "Please try again",
        })
      }
    } catch (error) {
      toast.error("Payment error", {
        description: "Please check your wallet balance",
      })
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <Dialog isOpen={isOpen} onClose={onClose}>
        <div className="bg-gray-800 border-gray-700 text-white p-6 rounded-lg">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p>Loading sure odds...</p>
            </div>
          </div>
        </div>
      </Dialog>
    )
  }

  if (!sureOdds) {
    return null
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="bg-gray-800 border-gray-700 text-white max-w-2xl p-6 rounded-lg">
        <h2 className="flex items-center space-x-2 text-xl font-bold mb-4">
          <Lock className="w-5 h-5 text-yellow-500" />
          <span>Sure Odds - Code: {sureOdds.code}</span>
        </h2>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-center space-x-4">
            <Badge variant={sureOdds.paid ? "success" : "warning"} className="flex items-center space-x-1">
              {sureOdds.paid ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              <span>{sureOdds.paid ? "Paid" : "Unpaid"}</span>
            </Badge>
            <Badge
              variant={sureOdds.show_predictions ? "primary" : "warning"}
              className="flex items-center space-x-1"
            >
              {sureOdds.show_predictions ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{sureOdds.show_predictions ? "Predictions Visible" : "Predictions Hidden"}</span>
            </Badge>
          </div>

          {/* Matches */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Matches</h3>
            {sureOdds.matches.map((match, index) => (
              <Card key={index} className="bg-gray-700 border-gray-600">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-medium">
                      {match.home_team} vs {match.away_team}
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(match.match_time).toLocaleString()}
                    </div>
                  </div>

                  {sureOdds.show_predictions && match.prediction ? (
                    <div className="mt-2">
                      <Badge className="bg-green-600 text-white">Prediction: {match.prediction}</Badge>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Badge variant="warning" className="text-gray-400">
                        {sureOdds.paid ? "Prediction will be revealed soon" : "Pay to unlock prediction"}
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Payment Section */}
          {sureOdds.allow_payment && !sureOdds.paid && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-yellow-400 mb-2">Payment Required</h4>
                <p className="text-gray-300 mb-4">Pay $10,000 to unlock sure predictions for these matches</p>
                <Button
                  onClick={handlePayment}
                  disabled={paying}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {paying ? (
                    "Processing..."
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pay $10,000
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Dismiss Notice */}
          {sureOdds.dismiss && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
              <p className="text-red-400">This sure odds slip has expired as matches have started.</p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}
