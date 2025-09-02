"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, Zap, Star, Calendar } from "lucide-react"
import type { PredictorPackage } from "@/lib/types"

interface PredictorPackageCardProps {
  package: PredictorPackage
  onPurchase: (packageId: number) => void
  isPurchasing: boolean
  userBalance: number
}

export function PredictorPackageCard({
  package: pkg,
  onPurchase,
  isPurchasing,
  userBalance,
}: PredictorPackageCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const canAfford = userBalance >= pkg.price
  const isPopular = pkg.name.toLowerCase().includes("pro") || pkg.price >= 1000

  // Calculate deficit with rounding to avoid floating-point oddities (e.g., .53 vs .54)
  const deficit = Math.round(Math.max(0, pkg.price - userBalance) * 100) / 100

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 backdrop-blur-md bg-black/20 border-white/10 ${
        isHovered ? "scale-105 shadow-2xl" : "shadow-lg"
      } ${isPopular ? "ring-2 ring-purple-500/50" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-pink-600 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
          <Star className="w-3 h-3 inline mr-1" />
          POPULAR
        </div>
      )}

      <CardHeader className="pb-4">
        {pkg.image_url && (
          <div className="w-full h-32 mb-4 rounded-lg overflow-hidden">
            <img
              src={pkg.image_url || "/placeholder.svg"}
              alt={pkg.name}
              className="w-full h-full object-cover"
              //onError={(e) => {
              //  // Hide image if it fails to load
              //  //e.currentTarget.style.display = "none"
              //}}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {pkg.name}
          </CardTitle>
          <Badge variant="secondary" className="bg-purple-100/20 text-purple-300 border-purple-400/30">
            {pkg.predictions_per_day}/day
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">KES {pkg.price.toLocaleString()}</div>
            <div className="text-sm text-gray-300">One-time payment</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>{pkg.validity_days} days</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <Target className="w-4 h-4 text-pink-400" />
            <span>{pkg.predictions_per_day} predictions</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Real-time</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <Star className="w-4 h-4 text-green-400" />
            <span>AI Powered</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3 rounded-lg border border-purple-400/20">
          <div className="text-sm font-medium text-purple-300 mb-1">Package Features:</div>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Advanced AI prediction algorithm</li>
            <li>• Real-time multiplier forecasting</li>
            <li>• Confidence level indicators</li>
            <li>• Historical accuracy tracking</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={() => onPurchase(pkg.id)}
          disabled={!canAfford || isPurchasing}
          className={`w-full font-semibold transition-all duration-300 ${
            canAfford
              ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isPurchasing ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          ) : !canAfford ? (
            `Insufficient Balance (KES ${deficit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} needed)`
          ) : (
            "Purchase Package"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}