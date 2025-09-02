"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, TrendingUp, Shield, ArrowLeft, BarChart3 } from "lucide-react"
import { PredictorPackageCard } from "@/components/predictor/predictor-package-card"
import { PredictorDashboard } from "@/components/predictor/predictor-dashboard"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { PredictorPackage } from "@/lib/types"

export default function PredictorPage() {
  const router = useRouter()
  const [packages, setPackages] = useState<PredictorPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [userBalance, setUserBalance] = useState(0)
  const [activeTab, setActiveTab] = useState("packages")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      console.log("🔍 [Predictor] Starting to load packages and wallet data...")

      const [packagesRes, walletRes] = await Promise.all([api.getPredictorPackages(), api.getWallet()])

      console.log("📦 [Predictor] Packages API Response:", {
        status: packagesRes.status,
        data: packagesRes.data,
        error: packagesRes.error,
        dataType: typeof packagesRes.data,
        isArray: Array.isArray(packagesRes.data),
        length: packagesRes.data?.length,
      })

      if (packagesRes.data && Array.isArray(packagesRes.data)) {
        // Parse price to number for numeric comparisons/calculations
        const parsedPackages = packagesRes.data.map((pkg: PredictorPackage) => ({
          ...pkg,
          price: parseFloat(pkg.price as unknown as string),  // Cast/coerce if needed; assumes API sends string
        }))
        console.log("✅ [Predictor] Setting parsed packages:", parsedPackages)
        setPackages(parsedPackages)
      } else {
        console.warn("⚠️ [Predictor] Invalid packages data received:", packagesRes)
        if (packagesRes.error) {
          toast.error("Failed to load packages", {
            description: packagesRes.error,
          })
        }
      }

      console.log("💰 [Predictor] Wallet API Response:", {
        status: walletRes.status,
        data: walletRes.data,
        error: walletRes.error,
      })

      if (walletRes.data) {
        // Parse balance to number
        const parsedBalance = parseFloat(walletRes.data.balance as unknown as string)  // Cast/coerce if needed; assumes API sends string
        console.log("✅ [Predictor] Setting balance:", parsedBalance)
        setUserBalance(parsedBalance)
      } else if (walletRes.error) {
        console.warn("⚠️ [Predictor] Wallet error:", walletRes.error)
        toast.error("Failed to load wallet balance", {
          description: walletRes.error,
        })
      }
    } catch (error) {
      console.error("💥 [Predictor] Error loading predictor data:", error)
      toast.error("Failed to load predictor data", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async (packageId: number) => {
    try {
      setIsPurchasing(true)
      const response = await api.purchasePredictorPackage(packageId)

      if (response.data) {
        toast.success("Package purchased successfully!", {
          description: "Your predictor package is now active",
        })
        setUserBalance(response.data.new_balance)
        setActiveTab("dashboard")
      } else if (response.error) {
        toast.error("Purchase failed", {
          description: response.error,
        })
      }
    } catch (error) {
      console.error("Purchase error:", error)
      toast.error("Purchase failed", {
        description: "Please try again later",
      })
    } finally {
      setIsPurchasing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-300 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            AI Predictor System
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border-cyan-400/30 hover:from-cyan-500/20 hover:to-blue-500/20 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-cyan-100">
                <Brain className="w-5 h-5 text-cyan-400" />
                <span>AI-Powered Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cyan-200/80 leading-relaxed text-sm">
                Advanced neural networks analyze patterns for accurate multiplier predictions.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border-purple-400/30 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-purple-100">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span>Smart Betting</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-200/80 leading-relaxed text-sm">
                Instant predictions for each round with confidence levels and detailed market analysis.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border-emerald-400/30 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-emerald-100">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>Responsible Gaming</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-200/80 leading-relaxed text-sm">
                Predictions assist your strategy, not guarantees. Always gamble responsibly within your limits.
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/30">
            <TabsTrigger
              value="packages"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300"
            >
              Predictor Packages
            </TabsTrigger>
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300"
            >
              My Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packages">
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold mb-2 text-foreground">Choose Your Predictor Package</h2>
                <p className="text-muted-foreground">Select the perfect package for your gaming strategy and budget</p>
              </div>

              {packages.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packages.map((pkg) => (
                    <PredictorPackageCard
                      key={pkg.id}
                      package={pkg}
                      onPurchase={handlePurchase}
                      isPurchasing={isPurchasing}
                      userBalance={userBalance}
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-foreground">No Packages Available</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      {isLoading
                        ? "Loading packages..."
                        : "Predictor packages are currently being updated. Please check back soon."}
                    </p>
                    <Button variant="outline" onClick={loadData} className="bg-card border-border hover:bg-muted">
                      Retry Loading
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            <PredictorDashboard onClose={() => setActiveTab("packages")} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}