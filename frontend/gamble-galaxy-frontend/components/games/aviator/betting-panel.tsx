"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, DollarSign, Banknote, Rocket, Target, Activity } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useWallet } from "@/context/WalletContext"

interface BettingPanelProps {
  betNumber: 1 | 2
  betAmount: string
  setBetAmount: (amount: string) => void
  autoCashout: string
  setAutoCashout: (amount: string) => void
  onPlaceBet: () => void
  onCashOut: () => void
  hasActiveBet: boolean
  isRoundActive: boolean
  isBettingPhase: boolean
  isConnected: boolean
  currentMultiplier: number
  isAuthenticated: boolean
}

export function BettingPanel({
  betNumber,
  betAmount,
  setBetAmount,
  autoCashout,
  setAutoCashout,
  onPlaceBet,
  onCashOut,
  hasActiveBet,
  isRoundActive,
  isBettingPhase,
  isConnected,
  currentMultiplier,
  isAuthenticated
}: BettingPanelProps) {
  const { balance } = useWallet()

  const adjustAmount = (currentValue: string, setter: (amount: string) => void, increment: boolean, step: number) => {
    const current = Number.parseFloat(currentValue) || 0
    const newAmount = increment ? current + step : Math.max(10, current - step)
    setter(newAmount.toFixed(2))
  }

  const calculatePotentialWin = (betAmount: string, multiplier: number) => {
    const amount = Number.parseFloat(betAmount) || 0
    return (amount * multiplier).toFixed(2)
  }

  const potentialWin = calculatePotentialWin(betAmount, currentMultiplier)
  const betAmountNum = Number.parseFloat(betAmount) || 0
  const canAffordBet = betAmountNum <= balance
  const isValidBet = betAmountNum >= 10 && betAmountNum <= 10000

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all duration-300",
        betNumber === 1
          ? "bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-blue-500/10 border-blue-500/20"
          : "bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-purple-500/10 border-purple-500/20",
        hasActiveBet && isRoundActive && "ring-2 ring-green-400/50 animate-pulse",
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"></div>

      <div className="absolute top-3 right-3 w-12 h-12 opacity-10">
        {betNumber === 1 ? (
          <Rocket className="w-full h-full text-blue-400" />
        ) : (
          <Target className="w-full h-full text-purple-400" />
        )}
      </div>

      <div className="relative p-4 space-y-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg backdrop-blur-xl border border-white/20",
                betNumber === 1
                  ? "bg-gradient-to-br from-blue-500/80 to-blue-600/80"
                  : "bg-gradient-to-br from-purple-500/80 to-purple-600/80",
              )}
            >
              {betNumber}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white/90">Bet {betNumber}</h3>
              <p className="text-xs text-white/60">Quick bet</p>
            </div>
          </div>
          {hasActiveBet && isRoundActive && (
            <Badge className="bg-green-500/20 text-green-300 border-green-500/40 px-2 py-1 text-xs animate-pulse backdrop-blur-xl">
              <Activity className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/70 mb-2 block font-medium">Amount (KES)</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => adjustAmount(betAmount, setBetAmount, false, 10)}
                className={cn(
                  "h-9 w-9 p-0 rounded-xl border transition-all duration-200 backdrop-blur-xl",
                  betNumber === 1
                    ? "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30 text-blue-300"
                    : "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30 text-purple-300",
                )}
                disabled={!isBettingPhase}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className={cn(
                  "text-center h-9 text-sm font-bold border transition-all duration-200 backdrop-blur-xl bg-white/5",
                  betNumber === 1
                    ? "border-blue-500/30 focus:border-blue-400 text-blue-100"
                    : "border-purple-500/30 focus:border-purple-400 text-purple-100",
                  !canAffordBet && "border-red-500/50 text-red-300",
                )}
                min="10"
                max="10000"
                step="10"
                disabled={!isBettingPhase}
              />
              <Button
                variant="outline"
                onClick={() => adjustAmount(betAmount, setBetAmount, true, 10)}
                className={cn(
                  "h-9 w-9 p-0 rounded-xl border transition-all duration-200 backdrop-blur-xl",
                  betNumber === 1
                    ? "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30 text-blue-300"
                    : "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30 text-purple-300",
                )}
                disabled={!isBettingPhase}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {!canAffordBet && betAmountNum > 0 && (
              <p className="text-xs text-red-400 mt-1">
                Insufficient balance (KES {balance.toFixed(2)} available)
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-white/70 mb-2 block font-medium">Auto Cashout (x)</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => adjustAmount(autoCashout, setAutoCashout, false, 0.1)}
                className={cn(
                  "h-9 w-9 p-0 rounded-xl border transition-all duration-200 backdrop-blur-xl",
                  betNumber === 1
                    ? "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30 text-blue-300"
                    : "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30 text-purple-300",
                )}
                disabled={!isBettingPhase}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                className={cn(
                  "text-center h-9 text-sm font-bold border transition-all duration-200 backdrop-blur-xl bg-white/5",
                  betNumber === 1
                    ? "border-blue-500/30 focus:border-blue-400 text-blue-100"
                    : "border-purple-500/30 focus:border-purple-400 text-purple-100",
                )}
                placeholder="2.00"
                min="1.01"
                step="0.1"
                disabled={!isBettingPhase}
              />
              <Button
                variant="outline"
                onClick={() => adjustAmount(autoCashout, setAutoCashout, true, 0.1)}
                className={cn(
                  "h-9 w-9 p-0 rounded-xl border transition-all duration-200 backdrop-blur-xl",
                  betNumber === 1
                    ? "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30 text-blue-300"
                    : "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30 text-purple-300",
                )}
                disabled={!isBettingPhase}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {hasActiveBet && isRoundActive && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-green-500/30 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-white/80 font-medium">Potential Win:</span>
              <span className="text-sm font-bold text-green-400 animate-pulse">KES {potentialWin}</span>
            </div>
            <div className="text-center text-xs text-white/70 mt-2">
              @ {currentMultiplier.toFixed(2)}x
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onPlaceBet}
            disabled={
              !isConnected || 
              !isAuthenticated || 
              !isBettingPhase || 
              hasActiveBet || 
              !isValidBet || 
              !canAffordBet ||
              isRoundActive // Disable during active round
            }
            className="bg-gradient-to-r from-amber-500/80 to-orange-500/80 hover:from-amber-600/80 hover:to-orange-600/80 text-white font-bold h-10 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 text-sm backdrop-blur-xl border border-amber-500/30"
          >
            <DollarSign className="w-4 h-4 mr-1" />
            {hasActiveBet ? "Bet Placed" : isBettingPhase ? "Bet" : "Wait"}
          </Button>
          <Button
            onClick={onCashOut}
            disabled={
              !isConnected || 
              !isAuthenticated || 
              !isRoundActive || 
              !hasActiveBet ||
              currentMultiplier < 1.01 // Prevent cashout at very low multipliers
            }
            className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600/80 hover:to-emerald-600/80 text-white font-bold h-10 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 text-sm backdrop-blur-xl border border-green-500/30"
          >
            <Banknote className="w-4 h-4 mr-1" />
            {hasActiveBet && isRoundActive ? (
              <div className="flex flex-col items-center leading-tight">
                <span>Cash</span>
                <span className="text-xs opacity-90">{currentMultiplier.toFixed(2)}x</span>
              </div>
            ) : (
              "Cash"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
