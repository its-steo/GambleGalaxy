"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Zap, AlertCircle, Calendar, Target } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { PredictorPurchase } from "@/lib/types"

interface PredictorDashboardProps {
  onClose: () => void
}

export function PredictorDashboard({ onClose }: PredictorDashboardProps) {
  const [activePurchases, setActivePurchases] = useState<PredictorPurchase[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const purchasesRes = await api.getMyPredictorPurchases()

      if (purchasesRes.data) {
        const now = new Date()
        const active = purchasesRes.data.filter((p) => new Date(p.expiry_date) > now)
        setActivePurchases(active)
        console.log("[v0] Active purchases found:", active.length)
      }
    } catch (error) {
      console.error("Error loading predictor dashboard:", error)
      toast.error("Failed to load predictor data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const getDaysRemaining = (expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (daysRemaining: number) => {
    if (daysRemaining <= 1) return "text-red-400 bg-red-500/20 border-red-400/30"
    if (daysRemaining <= 3) return "text-yellow-400 bg-yellow-500/20 border-yellow-400/30"
    return "text-green-400 bg-green-500/20 border-green-400/30"
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-white/10 rounded" />
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">My Predictor Packages</h2>
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Back to Packages
            </Button>
          </div>

          {activePurchases.length === 0 ? (
            <Card className="bg-black/20 backdrop-blur-md border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-white/40 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">No Active Packages</h3>
                <p className="text-white/70 text-center mb-4">Purchase a predictor package to view your dashboard.</p>
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  View Packages
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activePurchases.map((purchase) => {
                const daysRemaining = getDaysRemaining(purchase.expiry_date)
                const statusColor = getStatusColor(daysRemaining)

                return (
                  <Card key={purchase.id} className="bg-black/20 backdrop-blur-md border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Zap className="w-5 h-5 text-yellow-600" />
                          <span>{purchase.predictor_package.name}</span>
                        </div>
                        <Badge className={`${statusColor}`}>
                          {daysRemaining > 0 ? `${daysRemaining} days left` : "Expires today"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/5 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Target className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-gray-300">Daily Predictions</span>
                          </div>
                          <div className="text-xl font-bold text-white">
                            {purchase.predictions_remaining} / {purchase.predictor_package.predictions_per_day}
                          </div>
                          <div className="text-xs text-gray-400">Remaining today</div>
                        </div>

                        <div className="bg-white/5 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="w-4 h-4 text-pink-400" />
                            <span className="text-sm text-gray-300">Purchase Date</span>
                          </div>
                          <div className="text-sm font-medium text-white">
                            {new Date(purchase.purchase_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(purchase.purchase_date).toLocaleTimeString()}
                          </div>
                        </div>

                        <div className="bg-white/5 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-gray-300">Expiry Date</span>
                          </div>
                          <div className="text-sm font-medium text-white">
                            {new Date(purchase.expiry_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(purchase.expiry_date).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
