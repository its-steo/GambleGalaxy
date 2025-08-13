"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Clock, Zap, CheckCircle, Sparkles, Target, Minus, Plus } from "lucide-react"
import { useState } from "react"

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
  isPlacingBet?: boolean
  isCashingOut?: boolean
  canPlaceBet?: boolean
  canCashOut?: boolean
  bettingTimeLeft?: number
  hasCashedOut?: boolean
  cashoutResult?: { multiplier: number; winAmount: number }
}

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000]
const QUICK_MULTIPLIERS = [1.5, 2.0, 3.0, 5.0, 10.0]

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
  isAuthenticated,
  isPlacingBet = false,
  //isCashingOut = false,
  canPlaceBet = false,
  canCashOut = false,
  bettingTimeLeft = 0,
  hasCashedOut = false,
  cashoutResult,
}: BettingPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const isActiveRound = hasActiveBet && isRoundActive
  const isMobileCompactMode = isActiveRound && canCashOut

  const adjustBetAmount = (increment: boolean) => {
    const current = Number.parseFloat(betAmount) || 0
    const step = current < 100 ? 10 : current < 1000 ? 50 : 100
    const newAmount = increment ? current + step : Math.max(10, current - step)
    setBetAmount(newAmount.toString())
  }

  const getButtonState = () => {
    if (!isAuthenticated) {
      return { text: "Login to Play", disabled: true, variant: "outline" as const }
    }

    if (!isConnected) {
      return { text: "Connecting...", disabled: true, variant: "outline" as const }
    }

    // Show cashed out state
    if (hasCashedOut && cashoutResult) {
      return {
        text: `Cashed Out ${cashoutResult.multiplier.toFixed(2)}x`,
        disabled: true,
        variant: "default" as const,
        icon: CheckCircle,
        success: true,
      }
    }

    // Show cashout button for active bet
    if (hasActiveBet && isRoundActive && canCashOut) {
      const potentialWin = Number.parseFloat(betAmount) * currentMultiplier
      return {
        text: `Cash Out ${currentMultiplier.toFixed(2)}x`,
        subText: `Win KES ${potentialWin.toFixed(0)}`,
        disabled: false,
        variant: "default" as const,
        action: onCashOut,
        icon: Zap,
        pulse: true,
      }
    }

    // Show betting button
    if (isBettingPhase && bettingTimeLeft > 0) {
      return {
        text: isPlacingBet ? "Placing Bet..." : `Place Bet (${bettingTimeLeft}s)`,
        disabled: isPlacingBet || !canPlaceBet,
        variant: "default" as const,
        action: onPlaceBet,
        icon: isPlacingBet ? Loader2 : Clock,
      }
    }

    if (isRoundActive) {
      return { text: "Round in Progress", disabled: true, variant: "outline" as const }
    }

    return { text: "Waiting for Next Round", disabled: true, variant: "outline" as const }
  }

  const buttonState = getButtonState()
  const IconComponent = buttonState.icon

  return (
    <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <CardContent
        className={`relative z-10 ${isMobileCompactMode ? "p-3 space-y-3" : "p-4 sm:p-6 space-y-4 sm:space-y-6"}`}
      >
        {!isMobileCompactMode && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center border border-blue-500/20 backdrop-blur-xl">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white/90">
                Bet Panel {betNumber === 1 ? "" : betNumber}
              </h3>
              <p className="text-xs text-white/60">Place your bet</p>
            </div>
          </div>
        )}

        {!isMobileCompactMode && (
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Bet Amount (KES)
            </label>

            {/* Amount Input with +/- buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => adjustBetAmount(false)}
                disabled={hasActiveBet || isRoundActive || isPlacingBet}
                className="bg-gradient-to-r from-white/5 to-white/10 border-white/20 hover:from-white/15 hover:to-white/20 text-white/80 hover:text-white rounded-xl backdrop-blur-2xl transition-all duration-300 h-10 w-10 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Enter amount"
                min="10"
                max="10000"
                disabled={hasActiveBet || isRoundActive || isPlacingBet}
                className="bg-gradient-to-r from-white/10 to-white/5 border-white/20 text-white placeholder:text-white/50 rounded-xl sm:rounded-2xl h-10 sm:h-12 text-sm sm:text-base font-medium backdrop-blur-2xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-center"
              />
              <Button
                variant="outline"
                onClick={() => adjustBetAmount(true)}
                disabled={hasActiveBet || isRoundActive || isPlacingBet}
                className="bg-gradient-to-r from-white/5 to-white/10 border-white/20 hover:from-white/15 hover:to-white/20 text-white/80 hover:text-white rounded-xl backdrop-blur-2xl transition-all duration-300 h-10 w-10 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => setBetAmount(amount.toString())}
                  disabled={hasActiveBet || isRoundActive || isPlacingBet}
                  className="bg-gradient-to-r from-white/5 to-white/10 border-white/20 hover:from-white/15 hover:to-white/20 text-white/80 hover:text-white text-xs font-medium rounded-lg backdrop-blur-2xl transition-all duration-300 hover:scale-105 h-8 sm:h-10"
                >
                  {amount}
                </Button>
              ))}
            </div>
          </div>
        )}

        {!isMobileCompactMode && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-400" />
                Auto Cash Out
              </label>
              <Button
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-white/60 hover:text-white/80 h-6 px-2"
              >
                {showAdvanced ? "Simple" : "Advanced"}
              </Button>
            </div>

            <Input
              type="number"
              value={autoCashout}
              onChange={(e) => setAutoCashout(e.target.value)}
              placeholder="e.g., 2.00"
              min="1.01"
              step="0.01"
              disabled={hasActiveBet || isRoundActive || isPlacingBet}
              className="bg-gradient-to-r from-white/10 to-white/5 border-white/20 text-white placeholder:text-white/50 rounded-xl sm:rounded-2xl h-10 sm:h-12 text-sm sm:text-base font-medium backdrop-blur-2xl focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all duration-300"
            />

            {/* Quick Multiplier Buttons */}
            {showAdvanced && (
              <div className="grid grid-cols-5 gap-1 sm:gap-2">
                {QUICK_MULTIPLIERS.map((multiplier) => (
                  <Button
                    key={multiplier}
                    variant="outline"
                    onClick={() => setAutoCashout(multiplier.toString())}
                    disabled={hasActiveBet || isRoundActive || isPlacingBet}
                    className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20 text-green-400 hover:text-green-300 text-xs font-medium rounded-lg backdrop-blur-2xl transition-all duration-300 hover:scale-105 h-8 sm:h-10"
                  >
                    {multiplier}x
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {isMobileCompactMode && (
          <div className="text-center p-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl backdrop-blur-2xl">
            <div className="text-sm text-blue-400 font-bold">Bet Active: KES {betAmount}</div>
            {autoCashout && <div className="text-xs text-green-400">Auto cashout at {autoCashout}x</div>}
            <div className="text-xs text-yellow-400 animate-pulse mt-1 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3" />
              Potential win: KES {(Number.parseFloat(betAmount) * currentMultiplier).toFixed(0)}
            </div>
          </div>
        )}

        <Button
          onClick={buttonState.action || (() => {})}
          disabled={buttonState.disabled}
          variant={buttonState.variant}
          className={`w-full transition-all duration-300 rounded-xl sm:rounded-2xl relative overflow-hidden group ${
            isMobileCompactMode ? "h-16 text-lg" : "h-12 sm:h-14 text-sm sm:text-base"
          } font-bold ${
            buttonState.success
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25"
              : hasActiveBet && isRoundActive && canCashOut
                ? `bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25 ${buttonState.pulse ? "animate-pulse" : ""}`
                : isBettingPhase && canPlaceBet
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gradient-to-r from-white/10 to-white/5 text-white/60 border border-white/20"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent
                  className={`${isMobileCompactMode ? "w-6 h-6" : "w-4 h-4 sm:w-5 sm:h-5"} ${IconComponent === Loader2 ? "animate-spin" : ""}`}
                />
              )}
              {buttonState.text}
            </div>
            {buttonState.subText && <div className="text-xs opacity-90">{buttonState.subText}</div>}
          </div>
        </Button>

        {hasCashedOut && cashoutResult && (
          <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl sm:rounded-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <span className="text-sm sm:text-base text-green-400 font-bold">Cashout Successful!</span>
            </div>
            <div className="text-xs sm:text-sm text-green-300">
              Won KES {cashoutResult.winAmount.toFixed(2)} at {cashoutResult.multiplier.toFixed(2)}x
            </div>
          </div>
        )}

        {!isMobileCompactMode && hasActiveBet && !hasCashedOut && (
          <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl sm:rounded-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span className="text-sm sm:text-base text-blue-400 font-bold">Bet Active</span>
            </div>
            <div className="text-xs sm:text-sm text-white/80 mb-1">KES {betAmount} placed</div>
            {autoCashout && <div className="text-xs text-green-400">Auto cashout at {autoCashout}x</div>}
            {isRoundActive && (
              <div className="text-xs text-yellow-400 animate-pulse mt-2 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" />
                Potential win: KES {(Number.parseFloat(betAmount) * currentMultiplier).toFixed(0)}
              </div>
            )}
          </div>
        )}

        {!isMobileCompactMode && isBettingPhase && bettingTimeLeft > 0 && !hasActiveBet && (
          <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl sm:rounded-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-spin" />
              <span className="text-sm sm:text-base text-amber-400 font-bold">Betting Open</span>
            </div>
            <div className="text-xs sm:text-sm text-white/80">Betting closes in {bettingTimeLeft} seconds</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
