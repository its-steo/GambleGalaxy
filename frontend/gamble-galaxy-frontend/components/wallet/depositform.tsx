"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { PiggyBank, DollarSign, Plus, Minus, Sparkles, CreditCard, Copy, CheckCircle } from "lucide-react"
import { useWallet } from "@/context/WalletContext"
import { getAuthHeader } from "@/lib/auth"

export function DepositForm() {
  const [amount, setAmount] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [mpesaCode, setMpesaCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPaybillDetails, setShowPaybillDetails] = useState(false)
  const { balance } = useWallet()
  const quickAmounts = [500, 1000, 2000, 5000, 10000]

  const handleStkPush = async (e: React.FormEvent) => {
    e.preventDefault()
    const depositAmount = Number(amount)

    if (!amount || isNaN(depositAmount) || depositAmount <= 0) {
      console.error("Invalid amount entered:", amount)
      toast.error("Invalid amount", {
        description: "Please enter a valid positive number for deposit.",
        className: "bg-red-500/90 text-white border-red-400",
      })
      return
    }

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
        deposit_method: "stk_push",
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
//
      //const res = await fetch("http://localhost:8000/api/wallet/deposit/", {
      //  method: "POST",
      //  headers: {
      //    "Content-Type": "application/json",
      //    ...getAuthHeader(),
      //  },
      //  body: JSON.stringify(payload),
      //})

      const data = await res.json()
      console.log("Deposit response:", { status: res.status, statusText: res.statusText, data })

      if (res.status === 202) {
        toast.info("STK Push Initiated", {
          description: `Please check your phone (${phoneNumber}) and complete the payment prompt. Awaiting admin approval.`,
          className: "bg-blue-500/90 text-white border-blue-400",
          duration: 10000,
        })
        setAmount("")
        setPhoneNumber("")
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

  const handleManualDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    const depositAmount = Number(amount)

    if (!amount || isNaN(depositAmount) || depositAmount <= 0) {
      toast.error("Please enter a valid deposit amount")
      return
    }

    if (!mpesaCode || !mpesaCode.match(/^[A-Z0-9]{10}$/)) {
      console.error("Invalid M-Pesa code entered:", mpesaCode)
      toast.error("Invalid M-Pesa code", {
        description: "Please enter a valid 10-character M-Pesa transaction code (e.g., ABC123DEF4).",
        className: "bg-red-500/90 text-white border-red-400",
      })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        amount: depositAmount,
        deposit_method: "manual",
        mpesa_code: mpesaCode,
        description: `Manual deposit of KES ${depositAmount.toLocaleString()}`,
      }
      console.log("Sending manual deposit request with payload:", payload)

      //const res = await fetch("https://gamblegalaxy.onrender.com/api/wallet/deposit/", {
      //  method: "POST",
      //  headers: {
      //    "Content-Type": "application/json",
      //    ...getAuthHeader(),
      //  },
      //  body: JSON.stringify(payload),
      //})

      const res = await fetch("http://localhost:8000/api/wallet/deposit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log("Manual deposit response:", { status: res.status, statusText: res.statusText, data })

      if (res.status === 202) {
        toast.info("Manual Deposit Submitted", {
          description: `Your deposit request with M-Pesa code ${mpesaCode} has been submitted. Awaiting admin approval.`,
          className: "bg-blue-500/90 text-white border-blue-400",
          duration: 10000,
        })
        setAmount("")
        setMpesaCode("")
        setShowPaybillDetails(true)
      } else {
        console.error("Manual deposit failed with status:", res.status, "data:", data)
        const errorMsg = data.detail || data.amount?.[0] || data.mpesa_code?.[0] || "Please try again later."
        toast.error("Deposit Failed", {
          description: errorMsg,
          className: "bg-red-500/90 text-white border-red-400",
        })
      }
    } catch (error) {
      console.error("Manual deposit network error:", error)
      toast.error("Network Error", {
        description: "Could not connect to the server. Please check your internet connection.",
        className: "bg-red-500/90 text-white border-red-400",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowPaybill = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid deposit amount")
      return
    }
    setShowPaybillDetails(true)
    toast.info("Paybill Details Generated", {
      description: "Follow the instructions below to complete your deposit",
      className: "bg-blue-500/90 text-white border-blue-400",
    })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`, {
      className: "bg-green-500/90 text-white border-green-400",
    })
  }

  const adjustAmount = (value: number) => {
    const newAmount = Number(amount || 0) + value
    if (newAmount >= 0) {
      setAmount(newAmount.toString())
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full mx-auto px-4 sm:px-0">
      <Card className="bg-white/5 border-white/10 rounded-lg sm:rounded-xl backdrop-blur-sm max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center">
            <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-green-400" />
            Deposit Funds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 justify-center">
            {quickAmounts.map((value) => (
              <Button
                key={value}
                variant="outline"
                onClick={() => setAmount(value.toString())}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-xs sm:text-sm rounded-lg sm:rounded-xl py-1 sm:py-2"
              >
                KES {value.toLocaleString()}
              </Button>
            ))}
          </div>

          <Tabs defaultValue="stk" className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-[360px] sm:max-w-[400px] mx-auto bg-white/10 rounded-lg sm:rounded-xl">
              <TabsTrigger
                value="stk"
                className="text-white text-xs sm:text-sm data-[state=active]:bg-green-500/30 data-[state=active]:text-white rounded-lg sm:rounded-xl py-2"
              >
                STK Push
              </TabsTrigger>
              <TabsTrigger
                value="manual"
                className="text-white text-xs sm:text-sm data-[state=active]:bg-blue-500/30 data-[state=active]:text-white rounded-lg sm:rounded-xl py-2"
              >
                Manual Deposit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stk" className="space-y-4 mt-4 sm:mt-6">
              <form onSubmit={handleStkPush} className="space-y-4">
                <div>
                  <Input
                    type="number"
                    placeholder="Enter amount (KES)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-green-400 focus:ring-green-400/20 text-sm sm:text-base rounded-lg sm:rounded-xl h-10 sm:h-12"
                  />
                  <p className="text-xs text-white/60 mt-1">Available balance: KES {balance.toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => adjustAmount(-500)}
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-lg sm:rounded-xl text-xs sm:text-sm h-10 sm:h-12"
                  >
                    <Minus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    500
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => adjustAmount(500)}
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-lg sm:rounded-xl text-xs sm:text-sm h-10 sm:h-12"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    500
                  </Button>
                </div>

                <div>
                  <Input
                    type="tel"
                    placeholder="Enter phone number (254XXXXXXXXX)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-green-400 focus:ring-green-400/20 text-sm sm:text-base rounded-lg sm:rounded-xl h-10 sm:h-12"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Send STK Push
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                    </div>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 mt-4 sm:mt-6">
              <Button
                onClick={handleShowPaybill}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-blue-500/25 text-sm sm:text-base md:text-lg"
              >
                <div className="flex items-center justify-center">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Get Paybill Details
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                </div>
              </Button>

              {showPaybillDetails && (
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl">
                  <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-5">
                    <CardTitle className="text-white flex items-center text-sm sm:text-base md:text-lg">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-400" />
                      Paybill Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
                    <div className="bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-xs sm:text-sm">Paybill Number:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-mono font-bold text-sm sm:text-base">516600</span>
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
                        <span className="text-white/70 text-xs sm:text-sm">Account Number:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-mono font-bold text-sm sm:text-base">938628</span>
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
                        <span className="text-white/70 text-xs sm:text-sm">Amount:</span>
                        <span className="text-white font-bold text-sm sm:text-base">KES {Number(amount).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-white/60 space-y-2">
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
                        <li>Enter the M-Pesa transaction code below</li>
                      </ol>
                      <p className="text-yellow-400 font-medium mt-3 text-xs sm:text-sm">
                        💡 Your deposit will be credited after admin verification
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <form onSubmit={handleManualDeposit} className="space-y-4">
                <div>
                  <Input
                    type="number"
                    placeholder="Enter amount (KES)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20 text-sm sm:text-base rounded-lg sm:rounded-xl h-10 sm:h-12"
                  />
                  <p className="text-xs text-white/60 mt-1">Available balance: KES {balance.toLocaleString()}</p>
                </div>

                <div>
                  <Input
                    type="text"
                    placeholder="Enter M-Pesa transaction code (e.g., ABC123DEF4)"
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20 text-sm sm:text-base rounded-lg sm:rounded-xl h-10 sm:h-12"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-blue-500/25 text-sm sm:text-base md:text-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Submit Manual Deposit
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                    </div>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}