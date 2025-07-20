"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner" // Using sonner for toasts
import { PiggyBank, DollarSign, Plus, Minus, Sparkles } from "lucide-react"
import { useWallet } from "@/context/WalletContext" // Assuming this context exists and provides refreshBalance
import { getAuthHeader } from "@/lib/auth" // Assuming this utility exists

export function DepositForm() {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { refreshBalance } = useWallet() // Assuming useWallet is correctly implemented
  const quickAmounts = [500, 1000, 2000, 5000, 10000]

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    const depositAmount = Number(amount)

    if (!amount || isNaN(depositAmount) || depositAmount <= 0) {
      toast.error("Invalid amount", {
        description: "Please enter a valid positive number for deposit.",
        className: "bg-red-500/90 text-white border-red-400",
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/wallet/deposit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ amount: depositAmount }),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success("Deposit Successful!", {
          description: `✅ KES ${depositAmount.toLocaleString()} has been added to your wallet.`,
          className: "bg-green-500/90 text-white border-green-400",
        })
        setAmount("")
        await refreshBalance()
      } else {
        toast.error("Deposit Failed", {
          description: data.detail || "Please try again later.",
          className: "bg-red-500/90 text-white border-red-400",
        })
      }
    } catch (error) {
      console.error("Deposit network error:", error)
      toast.error("Network Error", {
        description: "Could not connect to the server. Please check your internet connection.",
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
    <form onSubmit={handleDeposit} className="space-y-4 sm:space-y-6 text-white">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
          <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold">Deposit Funds</h3>
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
        <label htmlFor="deposit-amount" className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">
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
            id="deposit-amount"
            type="number"
            placeholder="e.g., 1000"
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
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
            Processing...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Deposit Now
            <Sparkles className="w-4 h-4 ml-2" />
          </div>
        )}
      </Button>
    </form>
  )
}
