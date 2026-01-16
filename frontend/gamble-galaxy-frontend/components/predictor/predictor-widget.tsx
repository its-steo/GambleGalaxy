"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Target, TrendingUp, RefreshCw } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { PredictorPrediction } from "@/lib/types"

interface PredictorWidgetProps {
  currentRoundId: number | null
  onOpenPredictor: () => void
}

export function PredictorWidget({ currentRoundId, onOpenPredictor }: PredictorWidgetProps) {
  const [currentPrediction, setCurrentPrediction] = useState<PredictorPrediction | null>(null)
  const [hasActivePackage, setHasActivePackage] = useState(false)
  const [predictionsRemaining, setPredictionsRemaining] = useState<number | null>(null)
  const [dailyLimit, setDailyLimit] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastRoundId, setLastRoundId] = useState<number | null>(null)

  type ApiResponse = {
    prediction: PredictorPrediction | null
    has_active_package: boolean
    predictions_remaining: number
    daily_limit?: number | null
  }

  const loadPrediction = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.getCurrentPrediction()
      const data = response.data as ApiResponse
      if (data) {
        setCurrentPrediction(data.prediction)
        setHasActivePackage(data.has_active_package)
        setPredictionsRemaining(data.predictions_remaining)
        setDailyLimit(data.daily_limit || null)
      } else {
        setPredictionsRemaining(0)
        setDailyLimit(null)
      }
    } catch (error) {
      console.error("Error loading prediction:", error)
      toast.error("Failed to load prediction")
    } finally {
      setIsLoading(false)
    }
  }, []) // Empty dependency array since loadPrediction doesn't depend on props or state

  useEffect(() => {
    if (currentRoundId && currentRoundId !== lastRoundId) {
      loadPrediction()
      setLastRoundId(currentRoundId)
    }
  }, [currentRoundId, lastRoundId, loadPrediction]) // Include loadPrediction

  useEffect(() => {
    loadPrediction()
  }, [loadPrediction]) // Include loadPrediction

  return (
    <Card className="bg-black/30 backdrop-blur-md border-white/10 shadow-xl">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2 text-sm text-white">
          <Brain className="w-4 h-4 text-purple-400" />
          <span>AI Predictor</span>
        </CardTitle>
        <Button
          variant="ghost"
          onClick={loadPrediction}
          disabled={isLoading}
          className="text-white hover:bg-white/10"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasActivePackage ? (
          <div className="text-center py-4">
            <Brain className="w-6 h-6 text-white/40 mx-auto mb-2" />
            <p className="text-xs text-white/70">No active packages. Purchase one to start predicting!</p>
            <Button
              onClick={onOpenPredictor}
              className="mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              View Packages
            </Button>
          </div>
        ) : (
          <>
            {currentPrediction ? (
              <div className="text-center space-y-2">
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 animate-fade-in">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {currentPrediction.predicted_multiplier.toFixed(2)}x
                  </div>
                  <div className="text-xs text-gray-300">Predicted Crash</div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Target className="w-3 h-3 text-pink-400" />
                    <span>{currentPrediction.confidence_level}% confidence</span>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-white/10 text-gray-300 border-white/20">
                    Round #{currentPrediction.round_id}
                  </Badge>
                </div>
                <div className="text-xs text-gray-300 text-center bg-white/5 p-2 rounded animate-pulse">
                  {predictionsRemaining !== null && dailyLimit !== null
                    ? `${predictionsRemaining}/${dailyLimit} predictions remaining today`
                    : predictionsRemaining === 0
                      ? "No predictions remaining today"
                      : "Loading predictions..."}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-lg mb-2">⏳</div>
                <p className="text-xs text-gray-300 mb-2">No prediction for current round</p>
                <Button
                  variant="outline"
                  onClick={loadPrediction}
                  disabled={isLoading}
                  className="text-xs bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                >
                  Check Again
                </Button>
              </div>
            )}
            <Button
              onClick={onOpenPredictor}
              variant="outline"
              className="w-full text-xs bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Open Dashboard
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}