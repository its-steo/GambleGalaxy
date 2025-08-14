"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Star, Crown, CheckCircle, AlertTriangle, Loader2, X, Sparkles, Target } from "lucide-react"

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
  onPayForPremiumOdds,
}: LazerSignalModalProps) {
  if (!showLazerSignal) return null

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Mobile: Center positioned, Desktop: Top-right positioned */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-4 md:right-4 md:left-auto md:translate-x-0 md:translate-y-0 lg:top-6 lg:right-6 pointer-events-auto">
        <div className="relative w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm md:w-full animate-in slide-in-from-bottom-5 md:slide-in-from-right-5 duration-700 ease-out">
          {/* Enhanced floating animation with multiple layers */}
          <div className="absolute inset-0 animate-float">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/20 rounded-2xl blur-xl animate-pulse"></div>
          </div>

          {/* Secondary glow effect */}
          <div className="absolute inset-0 animate-float-delayed">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/15 via-orange-400/8 to-red-400/15 rounded-3xl blur-2xl"></div>
          </div>

          <Card className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
            {/* Top shine effect */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 opacity-0 animate-border-glow"></div>

            <Button
              variant="ghost"
              onClick={onDismiss}
              className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 z-10 h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 p-0 text-white/70 hover:text-white bg-gradient-to-br from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 rounded-xl sm:rounded-2xl border border-white/30 backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:rotate-90"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>

            <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <div className="relative">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 bg-gradient-to-br from-amber-500/30 via-orange-500/30 to-red-500/30 rounded-2xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg animate-pulse backdrop-blur-xl border border-amber-500/30">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-amber-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 animate-ping">
                    <Star className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-amber-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                    <Star className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-amber-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent flex items-center gap-1 sm:gap-2">
                    ⚡ LAZER SIGNAL
                    <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-amber-400 animate-spin flex-shrink-0" />
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-400/90 font-medium truncate">
                    Premium Sure Odds Available
                  </p>
                </div>
              </div>

              {!isLoadingPremiumOdds && !hasPurchasedPremium && (
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/15 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 border border-amber-500/30 backdrop-blur-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-1 sm:mb-2 md:mb-3">
                        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0 flex-1">
                          <Crown className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-amber-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm md:text-base font-bold text-white/90 block truncate">
                              Premium Odds
                            </span>
                            <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                              <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-green-400 flex-shrink-0" />
                              <span className="text-xs text-green-400 font-medium truncate">99% Accuracy</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-amber-400">KES 10K</div>
                          <div className="text-xs text-white/60">one-time</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 text-xs text-white/80">
                        <Target className="w-2 h-2 sm:w-3 sm:h-3 text-blue-400 flex-shrink-0" />
                        <span className="truncate">Instant delivery • Valid for session</span>
                      </div>
                    </div>
                  </div>

                  {walletBalance < 10000 && (
                    <div className="bg-gradient-to-br from-red-500/15 to-pink-500/15 border border-red-500/30 rounded-xl sm:rounded-2xl p-2 sm:p-3 flex items-center gap-2 sm:gap-3 backdrop-blur-2xl">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-400 flex-shrink-0" />
                      <div className="text-xs sm:text-sm min-w-0 flex-1">
                        <p className="text-red-400 font-semibold truncate">Insufficient Balance</p>
                        <p className="text-white/70 text-xs truncate">
                          Need KES {(10000 - walletBalance).toFixed(0)} more
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      onClick={onDismiss}
                      className="flex-1 bg-gradient-to-r from-white/10 to-white/5 border-white/30 hover:from-white/20 hover:to-white/15 text-white/80 hover:text-white h-8 sm:h-10 md:h-12 text-xs sm:text-sm font-medium backdrop-blur-2xl rounded-xl sm:rounded-2xl transition-all duration-300"
                    >
                      Maybe Later
                    </Button>
                    <Button
                      onClick={onPayForPremiumOdds}
                      disabled={walletBalance < 10000}
                      className="flex-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white font-bold h-8 sm:h-10 md:h-12 text-xs sm:text-sm disabled:opacity-50 backdrop-blur-xl rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg disabled:hover:scale-100"
                    >
                      <Crown className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">Purchase Now</span>
                    </Button>
                  </div>
                </div>
              )}

              {isLoadingPremiumOdds && (
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <div className="text-center space-y-2 sm:space-y-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center backdrop-blur-xl border border-blue-500/30">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-400 animate-spin" />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <p className="text-xs sm:text-sm md:text-base font-bold text-blue-400">Processing Payment...</p>
                      <p className="text-xs sm:text-sm text-white/70">Generating your premium sure odd</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-blue-500/30 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 text-center backdrop-blur-2xl">
                    <p className="text-xs sm:text-sm text-white/90 font-medium">Payment Successful!</p>
                    <p className="text-xs text-white/70 mt-1">KES 10,000 deducted from wallet</p>
                    <div className="mt-1 sm:mt-2 md:mt-3 flex items-center justify-center gap-1 sm:gap-2 text-xs text-blue-400">
                      <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 animate-spin flex-shrink-0" />
                      <span className="truncate">Calculating optimal odds...</span>
                    </div>
                  </div>
                </div>
              )}

              {hasPurchasedPremium && premiumSureOdd && (
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <div className="text-center space-y-2 sm:space-y-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-2xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center backdrop-blur-xl border border-green-500/30">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400" />
                    </div>
                    <p className="text-xs sm:text-sm md:text-base font-bold text-green-400">Premium Odd Ready!</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/15 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-green-500/30 text-center backdrop-blur-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
                    <div className="relative z-10">
                      <p className="text-xs sm:text-sm text-green-400 mb-1 sm:mb-2 font-medium">
                        Your Premium Sure Odd:
                      </p>
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-400 animate-pulse mb-1 sm:mb-2">
                        {premiumSureOdd.toFixed(2)}x
                      </div>
                      <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs text-green-300">
                        <Target className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                        <span>99% Success Rate</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={onDismiss}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold h-8 sm:h-10 md:h-12 text-xs sm:text-sm backdrop-blur-xl rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                    <span className="truncate">Perfect! Lets Win!</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
