"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import {
  Wallet,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Smartphone,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import DepositModal from "@/components/deposit-modal"
import WithdrawModal from "@/components/withdraw-modal"
import TransactionHistory from "@/components/transaction-history"

interface WalletStats {
  balance: number
  totalDeposits: number
  totalWithdrawals: number
  pendingWithdrawals: number
  totalBets: number
  totalWinnings: number
  recentTransactions: Transaction[]
}

interface Transaction {
  id: number
  type: "deposit" | "withdrawal" | "bet" | "win" | "bonus"
  amount: number
  status: "pending" | "completed" | "failed" | "cancelled"
  description: string
  timestamp: string
  reference?: string
  method?: string
}

export default function WalletPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchWalletStats()
  }, [])

  const fetchWalletStats = async () => {
    try {
      const response = await fetch("/api/wallet/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setWalletStats(data)
      }
    } catch (error) {
      console.error("Error fetching wallet stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4 text-red-400" />
      case "bet":
        return <Minus className="w-4 h-4 text-blue-400" />
      case "win":
        return <Plus className="w-4 h-4 text-green-400" />
      case "bonus":
        return <Plus className="w-4 h-4 text-purple-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />
      case "failed":
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "failed":
      case "cancelled":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-white/10 rounded-2xl"></div>
            <div className="h-32 bg-white/10 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Wallet className="w-8 h-8 mr-3 text-green-400" />
              My Wallet 💰
            </h1>
            <p className="text-gray-400">Manage your deposits, withdrawals, and transactions</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowDepositModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Deposit
            </Button>
            <Button
              onClick={() => setShowWithdrawModal(true)}
              variant="outline"
              className="glass-button bg-transparent"
            >
              <Minus className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
          <CardContent className="p-8 relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Available Balance</p>
                  <div className="flex items-center space-x-3">
                    <p className="text-4xl font-bold text-white">
                      {showBalance ? `₦${walletStats?.balance?.toLocaleString() || "0.00"}` : "₦****"}
                    </p>
                    <Button
                      onClick={() => setShowBalance(!showBalance)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 mb-2">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Account
                </Badge>
                <p className="text-gray-400 text-sm">Last updated: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass p-4 rounded-xl text-center">
                <ArrowDownLeft className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">₦{walletStats?.totalDeposits?.toLocaleString() || "0"}</p>
                <p className="text-sm text-gray-400">Total Deposits</p>
              </div>

              <div className="glass p-4 rounded-xl text-center">
                <ArrowUpRight className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">
                  ₦{walletStats?.totalWithdrawals?.toLocaleString() || "0"}
                </p>
                <p className="text-sm text-gray-400">Total Withdrawals</p>
              </div>

              <div className="glass p-4 rounded-xl text-center">
                <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">₦{walletStats?.totalBets?.toLocaleString() || "0"}</p>
                <p className="text-sm text-gray-400">Total Bets</p>
              </div>

              <div className="glass p-4 rounded-xl text-center">
                <Plus className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">₦{walletStats?.totalWinnings?.toLocaleString() || "0"}</p>
                <p className="text-sm text-gray-400">Total Winnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Wallet Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass-card p-1 w-full">
            <TabsTrigger value="overview" className="flex-1">
              <Wallet className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1">
              <Clock className="w-4 h-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="methods" className="flex-1">
              <CreditCard className="w-4 h-4 mr-2" />
              Payment Methods
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Recent Transactions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-400" />
                    Recent Activity
                  </span>
                  <Button
                    onClick={() => setActiveTab("transactions")}
                    variant="ghost"
                    size="sm"
                    className="text-purple-400 hover:text-purple-300"
                  >
                    View All
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {walletStats?.recentTransactions?.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 glass rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{transaction.description}</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-gray-400 text-sm">
                            {new Date(transaction.timestamp).toLocaleDateString()}
                          </p>
                          {transaction.reference && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.reference}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <p
                          className={`font-bold ${
                            ["deposit", "win", "bonus"].includes(transaction.type) ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {["deposit", "win", "bonus"].includes(transaction.type) ? "+" : "-"}₦
                          {transaction.amount.toLocaleString()}
                        </p>
                        <Badge className={getStatusColor(transaction.status)} variant="outline">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(transaction.status)}
                            <span className="capitalize">{transaction.status}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}

                {(!walletStats?.recentTransactions || walletStats.recentTransactions.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No recent transactions</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-green-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => setShowDepositModal(true)}
                  className="glass-button h-20 flex flex-col space-y-2 hover:bg-green-500/20"
                >
                  <ArrowDownLeft className="w-6 h-6 text-green-400" />
                  <span>Deposit Money</span>
                </Button>

                <Button
                  onClick={() => setShowWithdrawModal(true)}
                  className="glass-button h-20 flex flex-col space-y-2 hover:bg-red-500/20"
                >
                  <ArrowUpRight className="w-6 h-6 text-red-400" />
                  <span>Withdraw</span>
                </Button>

                <Button
                  onClick={() => setActiveTab("transactions")}
                  className="glass-button h-20 flex flex-col space-y-2 hover:bg-blue-500/20"
                >
                  <Clock className="w-6 h-6 text-blue-400" />
                  <span>View History</span>
                </Button>

                <Button
                  onClick={() => setActiveTab("methods")}
                  className="glass-button h-20 flex flex-col space-y-2 hover:bg-purple-500/20"
                >
                  <CreditCard className="w-6 h-6 text-purple-400" />
                  <span>Payment Methods</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <TransactionHistory />
          </TabsContent>

          <TabsContent value="methods" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Deposit Methods */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ArrowDownLeft className="w-5 h-5 mr-2 text-green-400" />
                    Deposit Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 glass rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Bank Transfer</p>
                        <p className="text-gray-400 text-sm">Instant deposits</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Available</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 glass rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Mobile Money</p>
                        <p className="text-gray-400 text-sm">MTN, Airtel, 9mobile</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Available</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 glass rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">USSD</p>
                        <p className="text-gray-400 text-sm">*737# and others</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Available</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Withdrawal Methods */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ArrowUpRight className="w-5 h-5 mr-2 text-red-400" />
                    Withdrawal Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 glass rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Bank Account</p>
                        <p className="text-gray-400 text-sm">2-24 hours processing</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Available</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 glass rounded-lg opacity-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Mobile Money</p>
                        <p className="text-gray-400 text-sm">Coming soon</p>
                      </div>
                    </div>
                    <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">Coming Soon</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Modals */}
      <DepositModal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} onSuccess={fetchWalletStats} />
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onSuccess={fetchWalletStats}
        currentBalance={walletStats?.balance || 0}
      />
    </div>
  )
}
