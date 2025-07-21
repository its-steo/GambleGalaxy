"use client"

import type React from "react"
import { useState } from "react"
import axios from "axios"
import { getAuthHeader } from "@/lib/auth"
import { Banknote, Minus, Plus, Sparkles, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/context/WalletContext"
import { toast } from "sonner"

export default function WithdrawForm() {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { refreshBalance } = useWallet()
  const quickAmounts = [500, 1000, 2000, 5000, 10000]

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = Number.parseFloat(amount)

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Invalid amount", {
        description: "Please enter a valid positive number for withdrawal.",
        className: "bg-red-500/90 text-white border-red-400",
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/wallet/withdraw/",
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
        toast.success("Withdrawal Successful!", {
          description: `✅ KES ${parsedAmount.toLocaleString()} has been processed.`,
          className: "bg-green-500/90 text-white border-green-400",
        })
        setAmount("")
        await refreshBalance()
      } else {
        toast.error("Withdrawal Failed", {
          description: res.data?.detail || res.statusText || "Please try again later.",
          className: "bg-red-500/90 text-white border-red-400",
        })
      }
    } catch (err: any) {
      console.error("Withdraw error:", err)
      const errorMessage =
        err?.response?.data?.detail || err?.message || "Withdrawal failed"
      toast.error("Network Error", {
        description: errorMessage,
        className: "bg-red-500/90 text-white border-red-400",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const adjustAmount = (increment: boolean) => {
    const current = Number.parseFloat(amount) || 0
    const newAmount = increment ? current + 100 : Math.max(0, current - 100)
    setAmount(newAmount.toString())
  }

  return (
    <form onSubmit={handleWithdraw} className="space-y-4 sm:space-y-6 text-white">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
          <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold">Withdraw Funds</h3>
      </div>

      {/* Quick Amount Buttons */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">
          Quick Amounts (KES)
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
          {quickAmounts.map((val) => (
            <Button
              key={val}
              type="button"
              variant="ghost"
              onClick={() => setAmount(val.toString())}
              className={`text-xs sm:text-sm py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-300 ${
                amount === val.toString()
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              {val.toLocaleString()}
            </Button>
          ))}
        </div>
      </div>

      {/* Amount Input with Controls */}
      <div>
        <label
          htmlFor="withdraw-amount"
          className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2"
        >
          Enter Amount (KES)
        </label>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => adjustAmount(false)}
            className="bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl p-2 sm:p-2.5"
          >
            <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Input
            id="withdraw-amount"
            type="number"
            placeholder="e.g., 5000"
            className="flex-1 bg-white/10 border-white/20 placeholder:text-gray-400 text-white text-center text-base sm:text-lg font-bold rounded-lg sm:rounded-xl h-10 sm:h-12 focus:border-purple-400 transition-all duration-300"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="100"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => adjustAmount(true)}
            className="bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl p-2 sm:p-2.5"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 border-2 border-white/30 border-t-white mr-2 animate-spin" />
            Processing...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Banknote className="w-5 h-5 mr-2" />
            Withdraw Now
            <Sparkles className="w-4 h-4 ml-2" />
          </div>
        )}
      </Button>
    </form>
  )
}
