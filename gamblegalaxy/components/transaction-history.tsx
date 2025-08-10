"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Minus,
  Search,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: number
  type: "deposit" | "withdrawal" | "bet" | "win" | "bonus" | "refund"
  amount: number
  status: "pending" | "completed" | "failed" | "cancelled"
  description: string
  timestamp: string
  reference?: string
  method?: string
  details?: any
}

export default function TransactionHistory() {
  const { token } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [dateRange, setDateRange] = useState("all")

  useEffect(() => {
    fetchTransactions()
  }, [activeFilter, dateRange])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: activeFilter !== "all" ? activeFilter : "",
        date_range: dateRange !== "all" ? dateRange : "",
        search: searchTerm,
      })

      const response = await fetch(`/api/wallet/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportTransactions = async () => {
    try {
      const response = await fetch("/api/wallet/transactions/export", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Export Successful",
          description: "Your transaction history has been downloaded",
        })
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export transaction history",
        variant: "destructive",
      })
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="w-5 h-5 text-green-400" />
      case "withdrawal":
        return <ArrowUpRight className="w-5 h-5 text-red-400" />
      case "bet":
        return <Minus className="w-5 h-5 text-blue-400" />
      case "win":
        return <Plus className="w-5 h-5 text-green-400" />
      case "bonus":
        return <Plus className="w-5 h-5 text-purple-400" />
      case "refund":
        return <Plus className="w-5 h-5 text-yellow-400" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
      case "win":
      case "bonus":
      case "refund":
        return "text-green-400"
      case "withdrawal":
      case "bet":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Clock className="w-6 h-6 mr-2 text-blue-400" />
          Transaction History
        </h2>
        <div className="flex space-x-3">
          <Button onClick={fetchTransactions} variant="outline" size="sm" className="glass-button bg-transparent">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportTransactions} variant="outline" size="sm" className="glass-button bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="glass-input text-white pl-10"
              />
            </div>

            {/* Type Filter */}
            <div>
              <Tabs value={activeFilter} onValueChange={setActiveFilter}>
                <TabsList className="glass w-full">
                  <TabsTrigger value="all" className="flex-1 text-xs">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="deposit" className="flex-1 text-xs">
                    Deposits
                  </TabsTrigger>
                  <TabsTrigger value="withdrawal" className="flex-1 text-xs">
                    Withdrawals
                  </TabsTrigger>
                  <TabsTrigger value="bet" className="flex-1 text-xs">
                    Bets
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Date Range */}
            <div>
              <Tabs value={dateRange} onValueChange={setDateRange}>
                <TabsList className="glass w-full">
                  <TabsTrigger value="all" className="flex-1 text-xs">
                    All Time
                  </TabsTrigger>
                  <TabsTrigger value="today" className="flex-1 text-xs">
                    Today
                  </TabsTrigger>
                  <TabsTrigger value="week" className="flex-1 text-xs">
                    This Week
                  </TabsTrigger>
                  <TabsTrigger value="month" className="flex-1 text-xs">
                    This Month
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card hover:bg-white/5 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-white font-semibold">{transaction.description}</p>
                          <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(transaction.status)}
                              <span className="capitalize">{transaction.status}</span>
                            </div>
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{new Date(transaction.timestamp).toLocaleDateString()}</span>
                          <span>{new Date(transaction.timestamp).toLocaleTimeString()}</span>
                          {transaction.reference && (
                            <Badge variant="outline" className="text-xs">
                              Ref: {transaction.reference}
                            </Badge>
                          )}
                          {transaction.method && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.method}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-xl font-bold ${getTypeColor(transaction.type)}`}>
                        {["deposit", "win", "bonus", "refund"].includes(transaction.type) ? "+" : "-"}₦
                        {transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-sm capitalize">{transaction.type}</p>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {transaction.details && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(transaction.details).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-400 capitalize">{key.replace("_", " ")}:</span>
                            <span className="text-white ml-2">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Transactions Found</h3>
            <p className="text-gray-400">
              {searchTerm ? "No transactions match your search criteria" : "You haven't made any transactions yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
