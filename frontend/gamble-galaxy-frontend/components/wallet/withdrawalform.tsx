"use client"

import { useState } from "react"
import axios from "axios"
import { getAuthHeader } from "@/lib/auth"
import { Banknote } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/context/WalletContext"

export default function WithdrawForm() {
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const { refreshBalance } = useWallet()

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setMessage("❌ Please enter a valid amount.")
      return
    }

    try {
      const res = await axios.post(
        "/api/wallet/withdraw/",
        {
          amount: parsedAmount,
          transaction_type: "withdraw",
          description: "User withdrawal",
        },
        {
          headers: getAuthHeader(),
        }
      )

      if (res.status === 201 || res.status === 200) {
        setMessage("✅ Withdrawal successful")
        setAmount("")
        await refreshBalance()
      } else {
        setMessage(`❌ Error: ${res.statusText}`)
      }
    } catch (err: any) {
      console.error("Withdraw error:", err)
      const errorMessage =
        err?.response?.data?.detail || err?.message || "Withdrawal failed"
      setMessage(`❌ ${errorMessage}`)
    }
  }

  return (
    <form
      onSubmit={handleWithdraw}
      className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl shadow-lg p-6 space-y-4 text-white"
    >
      <div className="flex items-center space-x-2">
        <Banknote className="text-red-400 w-5 h-5" />
        <h3 className="text-lg font-semibold">Withdraw Funds</h3>
      </div>
      <Input
        type="number"
        placeholder="Enter amount"
        className="bg-white/20 border-none placeholder:text-gray-300 text-white"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
        Withdraw
      </Button>
      {message && (
        <p className="text-sm mt-1">{message}</p>
      )}
    </form>
  )
}
