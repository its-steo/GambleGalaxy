"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Star, Crown, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react'

interface LazerSignalModalProps {
  showLazerSignal: boolean
  isLoadingPremiumOdds: boolean
  hasPurchasedPremium: boolean
  premiumSureOdd: number | null
  walletBalance: number
  onDismiss: () => void
  onPayForPremiumOdds: () => void
}

export function LazerSignalModal({
  showLazerSignal,
  isLoadingPremiumOdds,
  hasPurchasedPremium,
  premiumSureOdd,
  walletBalance,
  onDismiss,
  onPayForPremiumOdds
}: LazerSignalModalProps) {
  if (!showLazerSignal) return null

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right-5 duration-500">
      <div className="relative max-w-xs w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 rounded-2xl blur-xl animate-pulse"></div>

        <Card className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"></div>

          <Button
            variant="ghost"
            onClick={onDismiss}
            className="absolute -top-2 -right-2 z-10 h-6 w-6 p-0 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full border border-white/20 backdrop-blur-xl"
          >
            <X className="w-3 h-3" />
          </Button>

          <CardContent className="p-4 space-y-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500/80 via-orange-500/80 to-red-500/80 rounded-full flex items-center justify-center shadow-lg animate-pulse backdrop-blur-xl">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 animate-ping">
                  <Star className="w-3 h-3 text-amber-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  ⚡ LAZER SIGNAL
                </h3>
                <p className="text-xs text-amber-400/80">Premium Sure Odds</p>
              </div>
            </div>

            {!isLoadingPremiumOdds && !hasPurchasedPremium && (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-3 border border-amber-500/20 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-white/90">Premium Odds</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-amber-400">KES 10K</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/70">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span>99% Accuracy</span>
                  </div>
                </div>

                {walletBalance < 10000 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2 flex items-center gap-2 backdrop-blur-xl">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="text-red-400 font-medium">Need KES {(10000 - walletBalance).toFixed(0)} more</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={onDismiss}
                    className="flex-1 bg-white/5 border-white/20 hover:bg-white/10 text-white/80 h-8 text-xs backdrop-blur-xl"
                  >
                    Later
                  </Button>
                  <Button
                    onClick={onPayForPremiumOdds}
                    disabled={walletBalance < 10000}
                    className="flex-1 bg-gradient-to-r from-amber-500/80 to-orange-500/80 hover:from-amber-600/80 hover:to-orange-600/80 text-white font-bold h-8 text-xs disabled:opacity-50 backdrop-blur-xl"
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    Buy
                  </Button>
                </div>
              </div>
            )}

            {isLoadingPremiumOdds && (
              <div className="space-y-3">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 mx-auto bg-gradient-to-br from-blue-500/80 to-purple-500/80 rounded-full flex items-center justify-center backdrop-blur-xl">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-400">Processing...</p>
                    <p className="text-xs text-white/70">Waiting for premium odd</p>
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2 text-center backdrop-blur-xl">
                  <p className="text-xs text-white/90">Payment successful!</p>
                  <p className="text-xs text-white/70">KES 10,000 deducted</p>
                </div>
              </div>
            )}

            {hasPurchasedPremium && premiumSureOdd && (
              <div className="space-y-3">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 mx-auto bg-gradient-to-br from-green-500/80 to-emerald-500/80 rounded-full flex items-center justify-center backdrop-blur-xl">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-medium text-green-400">Premium Odd Ready!</p>
                </div>
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-3 border border-green-500/20 text-center backdrop-blur-xl">
                  <p className="text-xs text-green-400 mb-1">Your Sure Odd:</p>
                  <div className="text-2xl font-bold text-green-400 animate-pulse">
                    {premiumSureOdd.toFixed(2)}x
                  </div>
                </div>
                <Button
                  onClick={onDismiss}
                  className="w-full bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600/80 hover:to-emerald-600/80 text-white font-bold h-8 text-xs backdrop-blur-xl"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Got It!
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
