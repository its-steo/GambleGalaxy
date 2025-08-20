"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { getAuthHeader } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpCircle, ArrowDownCircle, Clock, ReceiptText, History, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Transaction = {
  id: string | number
  transaction_type: string
  amount: string | number
  timestamp: string
  description?: string
  mpesa_code?: string
  account_details?: string
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axios.get("https://gamblegalaxy.onrender.com/api/wallet/transactions/", {
          headers: getAuthHeader(),
        })

        //const res = await axios.get("http://localhost:8000/api/wallet/transactions/", {
        //  headers: getAuthHeader(),
        //})
        setTransactions(res.data)
      } catch (err) {
        console.error("Failed to fetch transactions:", err)
        setError("Failed to load transaction history. Please try again.")
        toast.error("Failed to load transactions", {
          description: "Could not retrieve your transaction history.",
          className: "bg-red-500/90 text-white border-red-400",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  const getTransactionIcon = (type: string, description?: string) => {
    const status = description?.toLowerCase() || ''
    if (status.includes('pending')) {
      return <Clock className="w-4 h-4 text-yellow-400" />
    }
    switch (type.toLowerCase()) {
      case "deposit":
      case "winning":
      case "bonus":
        return <ArrowUpCircle className="w-4 h-4 text-green-400" />
      case "withdraw":
      case "penalty":
        return <ArrowDownCircle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />
    }
  }

  const getStatusBadge = (description?: string) => {
    const status = description?.toLowerCase() || ''
    if (status.includes('pending')) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
    } else if (status.includes('completed')) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>
    } else if (status.includes('failed')) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>
    }
    return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <ReceiptText className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">Transaction History</h3>
        </div>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto text-purple-400 animate-spin mb-4" />
            <p className="text-gray-300">Loading transactions...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <ReceiptText className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">Transaction History</h3>
        </div>
        <Card className="bg-red-900/20 border-red-500/30">
          <CardContent className="p-8 text-center">
            <History className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <p className="text-red-300">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
          <ReceiptText className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white">Transaction History</h3>
      </div>

      {transactions.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center">
            <History className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold text-white mb-2">No transactions found</h3>
            <p className="text-gray-400">Your transaction history will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        transactions.map((transaction) => (
          <Card key={transaction.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.transaction_type, transaction.description)}
                  <div>
                    <p className="text-white font-medium capitalize">
                      {transaction.description || transaction.transaction_type}
                    </p>
                    <p className="text-white/60 text-sm">{new Date(transaction.timestamp).toLocaleString()}</p>
                    {transaction.mpesa_code && (
                      <p className="text-white/60 text-sm">M-Pesa Code: {transaction.mpesa_code}</p>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p
                    className={`font-bold ${
                      ["deposit", "winning", "bonus"].includes(transaction.transaction_type.toLowerCase())
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    KES {Number.parseFloat(String(transaction.amount)).toFixed(2)}
                  </p>
                  {getStatusBadge(transaction.description)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}