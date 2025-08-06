"use client"

import { useEffect, useState } from "react"
import axios from "axios" // Keeping axios as it's already in use
import { getAuthHeader } from "@/lib/auth" // Assuming this utility exists
import { ReceiptText, History, Loader2 } from "lucide-react" // Added Loader2 for loading state
import { toast } from "sonner" // Using sonner for toasts

type Transaction = {
  id: string | number
  transaction_type: string
  amount: string | number
  timestamp: string
  description?: string
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
        const res = await axios.get( "http://127.0.0.1:8000/api/wallet/transactions/", { headers: getAuthHeader() })
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

  return (
    <div className="text-white overflow-x-auto">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
          <ReceiptText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold">Transaction History</h3>
      </div>

      {loading ? (
        <div className="py-8 sm:py-12 text-center">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-purple-400 animate-spin mb-4" />
          <p className="text-gray-300 text-sm sm:text-base">Loading transactions...</p>
        </div>
      ) : error ? (
        <div className="py-8 sm:py-12 text-center bg-red-900/20 border border-red-500/30 rounded-xl">
          <History className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-red-400 mb-4" />
          <p className="text-red-300 text-sm sm:text-base">{error}</p>
        </div>
      ) : (
        <div className="rounded-lg sm:rounded-xl overflow-hidden border border-white/10">
          <table className="w-full text-sm text-left text-white table-auto min-w-[600px]">
            <thead className="bg-white/5 border-b border-white/20 text-gray-300 uppercase text-xs sm:text-sm">
              <tr>
                <th className="p-3 sm:p-4 font-semibold">Type</th>
                <th className="p-3 sm:p-4 font-semibold">Amount</th>
                <th className="p-3 sm:p-4 font-semibold">Date</th>
                <th className="p-3 sm:p-4 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200">
                    <td className="p-3 sm:p-4 capitalize text-gray-200">{tx.transaction_type}</td>
                   <td
                     className={`p-3 sm:p-4 font-medium ${
                       ["deposit", "winning"].includes(tx.transaction_type)
                         ? "text-green-400"
                         : "text-red-400"
                     }`}
                   >
                     KES {Number.parseFloat(String(tx.amount)).toFixed(2)}
                   </td>
                   <td className="p-3 sm:p-4 text-gray-400 text-xs sm:text-sm">
                     {new Date(tx.timestamp).toLocaleString()}
                   </td>
                   <td className="p-3 sm:p-4 text-gray-300 text-xs sm:text-sm">{tx.description || "-"}</td>
                 </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 sm:p-8 text-center text-gray-400">
                    <History className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No transactions found</h3>
                    <p className="text-gray-400 text-sm sm:text-base">Your transaction history will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}