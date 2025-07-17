"use client"
import { useEffect, useState } from "react"
import axios from "axios"

export default function WalletOverview() {
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    axios.get("/api/wallet/")
      .then((res) => setBalance(res.data.balance))
      .catch((err) => console.error("Error loading wallet", err))
  }, [])

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h2 className="text-lg font-semibold mb-2">Wallet Balance</h2>
      <p className="text-2xl font-bold text-green-600">Ksh {balance.toFixed(2)}</p>
    </div>
  )
}
