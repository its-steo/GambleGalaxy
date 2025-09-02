"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Target, Sparkles, Zap } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { PredictorPurchase, PredictorPrediction } from "@/lib/types"

interface AIPredictorPanelProps {
  currentRoundId: number | null
  onOpenPredictor: () => void
}

export function AIPredictorPanel({ currentRoundId, onOpenPredictor }: AIPredictorPanelProps) {
  const [activePurchases, setActivePurchases] = useState<PredictorPurchase[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string>("")
  const [currentPrediction, setCurrentPrediction] = useState<PredictorPrediction | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dailyLimit, setDailyLimit] = useState(0)

  const loadActivePurchases = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.getMyPredictorPurchases()

      if (response.data) {
        const now = new Date()
        const active = response.data.filter((p) => new Date(p.expiry_date) > now)
        setActivePurchases(active)

        if (active.length > 0 && !selectedPackageId) {
          setSelectedPackageId(active[0].id.toString())
          setDailyLimit(active[0].predictor_package.predictions_per_day)
        }
      }
    } catch (error) {
      console.error("Error loading active purchases:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedPackageId]) // Include selectedPackageId as a dependency

  const loadCurrentPrediction = async () => {
    try {
      const response = await api.getCurrentPrediction()
      console.log("[v0] Current prediction response:", response)

      if (response.data) {
        setCurrentPrediction(response.data.prediction)
        // Removed predictionsRemaining assignment
        // Remove daily_limit assignment since it does not exist on response.data
      }
    } catch (error) {
      console.error("Error loading current prediction:", error)
    }
  }

  const handleGeneratePrediction = async () => {
    if (!selectedPackageId) {
      toast.error("No Package Selected", { description: "Please select a predictor package first." })
      return
    }

    try {
      setIsGenerating(true)
      const response = await api.generatePrediction(Number.parseInt(selectedPackageId))

      console.log("[v0] Generate prediction response:", response)

      if (response.data) {
        const predictionValue = response.data.prediction

        console.log("[v0] Prediction value:", predictionValue)

        setCurrentPrediction({
          predicted_multiplier: predictionValue,
          confidence_level: response.data.confidence_level ?? 95,
          round_id: currentRoundId || response.data.round_id || 0,
          id: response.data.id || 0,
          purchase_id: Number.parseInt(selectedPackageId),
          created_at: new Date().toISOString(),
        })

        toast.success("Prediction Generated!", {
          description: `Predicted multiplier: ${predictionValue.toFixed(2)}x`,
        })

        // Removed predictionsRemaining assignment
      } else if (response.error) {
        toast.error("Generation Failed", { description: response.error })
      }
    } catch (error) {
      console.error("Error generating prediction:", error)
      toast.error("Generation Failed", { description: "Please try again later" })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePackageChange = (purchaseId: string) => {
    setSelectedPackageId(purchaseId)
    const selectedPurchase = activePurchases.find((p) => p.id.toString() === purchaseId)
    if (selectedPurchase) {
      setDailyLimit(selectedPurchase.predictor_package.predictions_per_day)
    }
  }

  useEffect(() => {
    loadActivePurchases()
    loadCurrentPrediction()
  }, [loadActivePurchases]) // Added loadActivePurchases to dependency array

  useEffect(() => {
    if (currentRoundId) {
      loadCurrentPrediction()
    }
  }, [currentRoundId])

  if (isLoading) {
    return (
      <Card className="bg-black/20 backdrop-blur-md border-white/10 shadow-xl h-full w-full">
        <CardContent className="flex items-center justify-center py-4 sm:py-6 md:py-8">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-3 sm:border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
              <div className="absolute inset-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-3 sm:border-4 border-transparent border-r-pink-400 rounded-full animate-spin animate-reverse" />
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 animate-pulse" />
              <span className="text-xs sm:text-sm text-white/70 animate-pulse">Loading AI Predictor...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activePurchases.length === 0) {
    return (
      <Card className="bg-black/20 backdrop-blur-md border-white/10 shadow-xl h-full w-full">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center space-x-2 text-xs sm:text-sm text-white">
            <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
            <span>AI Predictor</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          <div className="text-center">
            <div className="text-xl sm:text-2xl mb-2">🤖</div>
            <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">Get AI-powered multiplier predictions</p>
            <Button
              onClick={onOpenPredictor}
              className="w-full text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="w-3 h-3 mr-1 sm:mr-2" />
              Purchase Package
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/20 backdrop-blur-md border-white/10 shadow-xl h-full w-full">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center space-x-2 text-xs sm:text-sm text-white">
          <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
          <span>AI Predictor</span>
          <Badge variant="secondary" className="ml-auto bg-green-100/20 text-green-300 border-green-400/30 text-xs">
            Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="space-y-1 sm:space-y-2">
          <label className="text-xs text-gray-300">Select Predictor Package:</label>
          <Select value={selectedPackageId} onValueChange={handlePackageChange}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs sm:text-sm h-8 sm:h-10">
              <SelectValue placeholder="Choose package..." />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20">
              {activePurchases.map((purchase) => (
                <SelectItem key={purchase.id} value={purchase.id.toString()} className="text-white hover:bg-white/10">
                  <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                        {purchase.predictor_package?.name || "Premium Package"}
                      </span>
                      <Badge variant="outline" className="ml-2 text-xs bg-purple-100/20 text-purple-300 shrink-0">
                        {purchase.predictions_remaining || 0} left
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {/* {purchase.package?.predictions_per_day || 0} predictions/day */}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGeneratePrediction}
          disabled={isGenerating || !selectedPackageId}
          className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 relative overflow-hidden"
        >
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <div className="absolute inset-0 w-3 h-3 sm:w-4 sm:h-4 border-2 border-transparent border-r-pink-300 rounded-full animate-spin animate-reverse" />
              </div>
              <span className="animate-pulse">Generating AI Prediction...</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Generate Prediction</span>
            </div>
          )}
        </Button>

        {currentPrediction ? (
          <div className="bg-white/10 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-white/20">
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="relative">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                  {currentPrediction.predicted_multiplier.toFixed(2)}x
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-lg blur opacity-75" />
              </div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium">AI Predicted Crash</div>

              <div className="flex items-center justify-between text-xs bg-white/5 p-2 rounded">
                <div className="flex items-center space-x-1 text-gray-300">
                  <Target className="w-3 h-3 text-pink-400" />
                  <span>{currentPrediction.confidence_level}% confidence</span>
                </div>
                <Badge variant="secondary" className="text-xs bg-white/10 text-gray-300 border-white/20">
                  Round #{currentPrediction.round_id}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-white/10 text-center">
            {isGenerating ? (
              <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                <div className="relative">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                  <div className="absolute inset-0 w-6 h-6 sm:w-8 sm:h-8 border-3 border-transparent border-r-pink-400 rounded-full animate-spin animate-reverse" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs sm:text-sm text-purple-400 font-medium animate-pulse">
                    Analyzing patterns...
                  </div>
                  <div className="text-xs text-gray-400">AI is processing game data</div>
                </div>
              </div>
            ) : (
              <>
                <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-400">Click Generate to get AI prediction</p>
              </>
            )}
          </div>
        )}

        <div className="text-xs text-gray-400 text-center bg-white/5 p-2 rounded">
          {dailyLimit > 0 ? `${dailyLimit} predictions today` : "Loading predictions..."}
        </div>

        <Button
          onClick={onOpenPredictor}
          variant="outline"
          className="w-full text-xs bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 h-8"
        >
          <Target className="w-3 h-3 mr-1" />
          Open Dashboard
        </Button>
      </CardContent>
    </Card>
  )
}
