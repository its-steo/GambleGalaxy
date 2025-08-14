"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { PiggyBank, DollarSign, Plus, Minus, Sparkles, Smartphone, CreditCard, Copy, CheckCircle } from "lucide-react"
import { useWallet } from "@/context/WalletContext"
import { getAuthHeader } from "@/lib/auth"

export function DepositForm() {
  const [amount, setAmount] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPaybillDetails, setShowPaybillDetails] = useState(false)
  //const [ setAccountNumber] = useState("")
  const { refreshBalance, balance } = useWallet()
  const quickAmounts = [500, 1000, 2000, 5000, 10000]

  const handleStkPush = async (e: React.FormEvent) => {
    e.preventDefault()
    const depositAmount = Number(amount)

    // Validate amount
    if (!amount || isNaN(depositAmount) || depositAmount <= 0) {
      console.error("Invalid amount entered:", amount)
      toast.error("Invalid amount", {
        description: "Please enter a valid positive number for deposit.",
        className: "bg-red-500/90 text-white border-red-400",
      })
      return
    }

    // Validate phone number
    if (!phoneNumber || !phoneNumber.match(/^254\d{9}$/)) {
      console.error("Invalid phone number entered:", phoneNumber)
      toast.error("Invalid phone number", {
        description: "Please enter a valid phone number starting with '254' (e.g., 254712345678).",
        className: "bg-red-500/90 text-white border-red-400",
      })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        amount: depositAmount,
        phone_number: phoneNumber,
        description: `Deposit of KES ${depositAmount.toLocaleString()}`,
      }
      console.log("Sending deposit request with payload:", payload)

      const res = await fetch("https://gamblegalaxy.onrender.com/api/wallet/deposit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log("Deposit response:", { status: res.status, statusText: res.statusText, data })

      if (res.status === 202) {
        toast.info("STK Push Initiated", {
          description: `Please check your phone (${phoneNumber}) and complete the payment prompt to deposit KES ${depositAmount.toLocaleString()}.`,
          className: "bg-blue-500/90 text-white border-blue-400",
          duration: 10000,
        })
        setAmount("")
        setPhoneNumber("")
        setTimeout(async () => {
          console.log("Polling for balance update after STK Push...")
          await refreshBalance()
          console.log("Updated balance:", balance)
          toast.success("Balance Updated", {
            description: `Your wallet balance is now KES ${balance.toLocaleString()}.`,
            className: "bg-green-500/90 text-white border-green-400",
          })
        }, 30000)
      } else {
        console.error("Deposit failed with status:", res.status, "data:", data)
        const errorMsg = data.detail || data.amount?.[0] || data.phone_number?.[0] || "Please try again later."
        toast.error("Deposit Failed", {
          description: errorMsg,
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

  const handleManualDeposit = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid deposit amount")
      return
    }

    // Generate unique account number for tracking
    //const newAccountNumber = `GG${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`
    //setAccountNumber(newAccountNumber)
    setShowPaybillDetails(true)

    toast.info("Paybill Details Generated", {
      description: "Follow the instructions below to complete your deposit",
      className: "bg-blue-500/90 text-white border-blue-400",
    })
  }

  const adjustAmount = (increment: boolean) => {
    const current = Number.parseFloat(amount) || 0
    const newAmount = increment ? current + 100 : Math.max(0, current - 100)
    setAmount(newAmount.toString())
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`, {
      className: "bg-green-500/90 text-white border-green-400",
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6 text-white">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
          <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold">Deposit Funds</h3>
      </div>

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

      <Tabs defaultValue="stk" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl">
          <TabsTrigger
            value="stk"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white text-white/70 rounded-lg sm:rounded-xl transition-all duration-300"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            STK Push
          </TabsTrigger>
          <TabsTrigger
            value="manual"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-white/70 rounded-lg sm:rounded-xl transition-all duration-300"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Manual Paybill
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stk" className="space-y-4 mt-6">
          <form onSubmit={handleStkPush} className="space-y-4">
            <div>
              <label
                htmlFor="phone-number"
                className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2"
              >
                Phone Number (e.g., 254712345678)
              </label>
              <Input
                id="phone-number"
                type="text"
                placeholder="254XXXXXXXXX"
                className="w-full bg-white/10 border-white/20 placeholder:text-gray-400 text-white text-base sm:text-lg rounded-lg sm:rounded-xl h-10 sm:h-12 focus:border-purple-400 transition-all duration-300"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
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
                  Send STK Push
                  <Sparkles className="w-4 h-4 ml-2" />
                </div>
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4 mt-6">
          <Button
            onClick={handleManualDeposit}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-blue-500/25 text-base sm:text-lg"
          >
            <div className="flex items-center justify-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Get Paybill Details
              <Sparkles className="w-4 h-4 ml-2" />
            </div>
          </Button>
        </TabsContent>
      </Tabs>

      {showPaybillDetails && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 backdrop-blur-sm rounded-lg sm:rounded-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-base sm:text-lg">
              <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
              Paybill Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/10 rounded-lg sm:rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm sm:text-base">Paybill Number:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-mono font-bold text-base sm:text-lg">516600</span>
                  <Button
                    variant="ghost"
                    onClick={() => copyToClipboard("516600", "Paybill number")}
                    className="h-8 w-8 p-0 hover:bg-white/20 rounded-lg"
                  >
                    <Copy className="w-3 h-3 text-white/70" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm sm:text-base">Account Number:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-mono font-bold text-base sm:text-lg">{938628}</span>
                  <Button
                    variant="ghost"
                    onClick={() => copyToClipboard("938628", "Account number")}
                    className="h-8 w-8 p-0 hover:bg-white/20 rounded-lg"
                  >
                    <Copy className="w-3 h-3 text-white/70" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm sm:text-base">Amount:</span>
                <span className="text-white font-bold text-base sm:text-lg">KES {Number(amount).toLocaleString()}</span>
              </div>
            </div>
            <div className="text-sm text-white/60 space-y-2">
              <p className="font-semibold text-white/80">Steps to complete payment:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2 text-xs sm:text-sm">
                <li>Go to M-Pesa menu on your phone</li>
                <li>Select `Lipa na M-Pesa`</li>
                <li>Select `Pay Bill`</li>
                <li>Enter the paybill number above</li>
                <li>Enter the account number above</li>
                <li>Enter the amount: KES {Number(amount).toLocaleString()}</li>
                <li>Enter your M-Pesa PIN</li>
                <li>Confirm the transaction</li>
              </ol>
              <p className="text-yellow-400 font-medium mt-3 text-xs sm:text-sm">
                💡 Your deposit will be credited within 5-10 minutes after successful payment
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
