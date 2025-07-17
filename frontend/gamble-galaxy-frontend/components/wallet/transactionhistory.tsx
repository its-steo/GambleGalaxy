"use client"
import { useEffect, useState } from "react"
import axios from "axios"

type Transaction = {
  id: string | number;
  transaction_type: string;
  amount: number;
  timestamp: string;
  description: string;
};

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    axios.get("/api/wallet/transactions/")
      .then((res) => setTransactions(res.data))
      .catch((err) => console.error(err))
  }, [])

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <h3 className="text-lg font-semibold mb-2">Transaction History</h3>
      <table className="w-full text-sm text-left">
        <thead className="border-b">
          <tr>
            <th className="p-2">Type</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Date</th>
            <th className="p-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b">
              <td className="p-2">{tx.transaction_type}</td>
              <td className="p-2">Ksh {tx.amount.toFixed(2)}</td>
              <td className="p-2">{new Date(tx.timestamp).toLocaleString()}</td>
              <td className="p-2">{tx.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
