"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Clock, Zap, CheckCircle } from 'lucide-react'

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
  cashoutResult?: { multiplier: number, winAmount: number }
}

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000]

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
  isCashingOut = false,
  canPlaceBet = false,
  canCashOut = false,
  bettingTimeLeft = 0,
  hasCashedOut = false,
  cashoutResult,
}: BettingPanelProps) {
  
  const getButtonState = () => {
    if (!isAuthenticated) {
      return { text: "Login to Play", disabled: true, variant: "secondary" as const }
    }
    
    if (!isConnected) {
      return { text: "Connecting...", disabled: true, variant: "secondary" as const }
    }
    
    // Show cashed out state
    if (hasCashedOut && cashoutResult) {
      return { 
        text: `Cashed Out ${cashoutResult.multiplier.toFixed(2)}x`, 
        disabled: true, 
        variant: "default" as const,
        icon: CheckCircle,
        success: true
      }
    }
    
    // Show cashout button for active bet
    if (hasActiveBet && isRoundActive && canCashOut) {
      return { 
        text: `Cash Out ${currentMultiplier.toFixed(2)}x`, 
        disabled: false, 
        variant: "default" as const,
        action: onCashOut,
        icon: Zap,
        pulse: true
      }
    }
    
    // Show betting button
    if (isBettingPhase && bettingTimeLeft > 0) {
      return { 
        text: isPlacingBet ? "Placing Bet..." : `Bet (${bettingTimeLeft}s)`, 
        disabled: isPlacingBet || !canPlaceBet, 
        variant: "default" as const,
        action: onPlaceBet,
        icon: isPlacingBet ? Loader2 : Clock
      }
    }
    
    if (isRoundActive) {
      return { text: "Round in Progress", disabled: true, variant: "secondary" as const }
    }
    
    return { text: "Waiting for Next Round", disabled: true, variant: "secondary" as const }
  }

  const buttonState = getButtonState()
  const IconComponent = buttonState.icon

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardContent className="p-4 space-y-4">
        {/* Bet Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Bet Amount (KES)
          </label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="Enter amount"
            min="10"
            max="10000"
            disabled={hasActiveBet || isRoundActive || isPlacingBet}
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
          
          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-1">
            {QUICK_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setBetAmount(amount.toString())}
                disabled={hasActiveBet || isRoundActive || isPlacingBet}
                className="text-xs bg-slate-700/30 border-slate-600 hover:bg-slate-600/50 text-slate-300"
              >
                {amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Auto Cashout */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Auto Cash Out (Optional)
          </label>
          <Input
            type="number"
            value={autoCashout}
            onChange={(e) => setAutoCashout(e.target.value)}
            placeholder="e.g., 2.00"
            min="1.01"
            step="0.01"
            disabled={hasActiveBet || isRoundActive || isPlacingBet}
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
        </div>

        {/* Action Button */}
        <Button
          onClick={buttonState.action || (() => {})}
          disabled={buttonState.disabled}
          variant={buttonState.variant}
          className={`w-full h-12 text-base font-semibold transition-all duration-200 ${
            buttonState.success
              ? "bg-green-600 text-white"
              : hasActiveBet && isRoundActive && canCashOut
              ? `bg-green-600 hover:bg-green-700 text-white ${buttonState.pulse ? 'animate-pulse' : ''}`
              : isBettingPhase && canPlaceBet
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-slate-600 text-slate-300"
          }`}
        >
          {IconComponent && (
            <IconComponent className={`w-4 h-4 mr-2 ${
              IconComponent === Loader2 ? 'animate-spin' : ''
            }`} />
          )}
          {buttonState.text}
        </Button>

        {/* Status Indicators */}
        {hasCashedOut && cashoutResult && (
          <div className="text-center p-3 bg-green-900/20 border border-green-500/30 rounded">
            <div className="text-sm text-green-400 font-medium">
              ✅ Won KES {cashoutResult.winAmount.toFixed(2)}
            </div>
            <div className="text-xs text-green-300">
              Cashed out at {cashoutResult.multiplier.toFixed(2)}x
            </div>
          </div>
        )}

        {hasActiveBet && !hasCashedOut && (
          <div className="text-center">
            <div className="text-sm text-green-400 font-medium">
              ✅ Bet Active: KES {betAmount}
            </div>
            {autoCashout && (
              <div className="text-xs text-blue-400">
                Auto cashout at {autoCashout}x
              </div>
            )}
            {isRoundActive && (
              <div className="text-xs text-yellow-400 animate-pulse">
                🚀 Click to cash out instantly!
              </div>
            )}
          </div>
        )}

        {isBettingPhase && bettingTimeLeft > 0 && (
          <div className="text-center">
            <div className="text-sm text-yellow-400 font-medium">
              ⏰ Betting closes in {bettingTimeLeft}s
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
