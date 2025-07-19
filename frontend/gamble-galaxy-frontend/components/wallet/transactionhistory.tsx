"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { getAuthHeader } from "@/lib/auth"
import { ReceiptText } from "lucide-react"

type Transaction = {
  id: string | number;
  transaction_type: string;
  amount: string | number;
  timestamp: string;
  description?: string;
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    axios
      .get("/api/wallet/transactions/", { headers: getAuthHeader() })
      .then((res) => setTransactions(res.data))
      .catch((err) => console.error(err))
  }, [])

  return (
    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl shadow-xl p-6 text-white overflow-x-auto">
      <div className="flex items-center space-x-2 mb-4">
        <ReceiptText className="text-cyan-400 w-5 h-5" />
        <h3 className="text-2xl font-semibold">Transaction History</h3>
      </div>

      <table className="w-full text-sm text-left text-white table-auto min-w-[600px]">
        <thead className="border-b border-white/20 text-gray-300">
          <tr>
            <th className="p-2">Type</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Date</th>
            <th className="p-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-white/10 hover:bg-white/5 transition">
                <td className="p-2 capitalize">{tx.transaction_type}</td>
                <td className="p-2 text-green-400 font-medium">KES {parseFloat(String(tx.amount)).toFixed(2)}</td>
                <td className="p-2">{new Date(tx.timestamp).toLocaleString()}</td>
                <td className="p-2 text-gray-300">{tx.description || "-"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-400">
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
