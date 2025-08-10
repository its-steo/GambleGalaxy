"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, TrendingUp, Zap, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface BetSelection {
  matchId: number
  match: {
    id: number
    home_team: string
    away_team: string
    match_time: string
  }
  selection: string
  odds: number
  selectionLabel: string
}

interface BetSlipProps {
  selections: BetSelection[]
  isOpen: boolean
  onClose: () => void
  onRemoveSelection: (matchId: number) => void
}

export default function BetSlip({ selections, isOpen, onClose, onRemoveSelection }: BetSlipProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [betAmount, setBetAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const totalOdds = selections.reduce((acc, selection) => acc * selection.odds, 1)
  const potentialWin = Number.parseFloat(betAmount) * totalOdds || 0

  const placeBet = async () => {
    if (!betAmount || Number.parseFloat(betAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      })
      return
    }

    if (selections.length === 0) {
      toast({
        title: "No Selections",
        description: "Please add at least one selection to your bet slip",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const betData = {
        amount: Number.parseFloat(betAmount),
        selections: selections.map((sel) => ({
          match_id: sel.match.id,
          selected_option: sel.selection,
        })),
      }

      const response = await fetch("/api/betting/place", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(betData),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Bet Placed Successfully! 🎉",
          description: `Your bet of ₦${betAmount} has been placed with total odds of ${totalOdds.toFixed(2)}`,
        })

        // Clear bet slip
        selections.forEach((sel) => onRemoveSelection(sel.matchId))
        setBetAmount("")
        onClose()
      } else {
        const error = await response.json()
        toast({
          title: "Bet Failed",
          description: error.error || "Failed to place bet",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while placing your bet",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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

          {/* Bet Slip */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-gradient-to-b from-slate-900 to-purple-900 z-50 overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Bet Slip</h2>
                    <p className="text-gray-400 text-sm">{selections.length} selections</p>
                  </div>
                </div>
                <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Selections */}
              <div className="space-y-3">
                {selections.map((selection) => (
                  <motion.div
                    key={selection.matchId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm">
                              {selection.match.home_team} vs {selection.match.away_team}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {new Date(selection.match.match_time).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            onClick={() => onRemoveSelection(selection.matchId)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-400 p-1"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {selection.selectionLabel}
                          </Badge>
                          <div className="text-right">
                            <p className="text-white font-bold">{selection.odds.toFixed(2)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {selections.length === 0 && (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-white mb-2">Your bet slip is empty</h3>
                    <p className="text-gray-400 text-sm">Add selections from matches to get started</p>
                  </div>
                )}
              </div>

              {/* Bet Amount & Summary */}
              {selections.length > 0 && (
                <div className="space-y-4">
                  <Card className="glass-card">
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <label className="text-white font-semibold mb-2 block">Bet Amount (₦)</label>
                        <Input
                          type="number"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="glass-input text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Total Odds:</span>
                          <span className="text-white font-bold">{totalOdds.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Stake:</span>
                          <span className="text-white">₦{betAmount || "0.00"}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-2">
                          <span className="text-white font-semibold">Potential Win:</span>
                          <span className="text-green-400 font-bold">₦{potentialWin.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Bet Amounts */}
                  <div>
                    <p className="text-white font-semibold mb-3">Quick Amounts</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[100, 500, 1000, 5000].map((amount) => (
                        <Button
                          key={amount}
                          onClick={() => setBetAmount(amount.toString())}
                          variant="outline"
                          size="sm"
                          className="glass-button text-xs"
                        >
                          ₦{amount}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Place Bet Button */}
                  <Button
                    onClick={placeBet}
                    disabled={loading || !betAmount || Number.parseFloat(betAmount) <= 0}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-12 text-lg font-bold"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Placing Bet...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5" />
                        <span>Place Bet</span>
                      </div>
                    )}
                  </Button>

                  {/* Disclaimer */}
                  <div className="flex items-start space-x-2 p-3 glass rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-400">
                      By placing this bet, you confirm that you are 18+ and agree to our terms and conditions. Bet
                      responsibly.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
