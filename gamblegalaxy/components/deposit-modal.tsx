"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, CreditCard, Smartphone, Building, ArrowRight, Copy, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface PaymentMethod {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  minAmount: number
  maxAmount: number
  processingTime: string
  available: boolean
}

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"amount" | "method" | "payment">("amount")
  const [paymentDetails, setPaymentDetails] = useState<any>(null)

  const paymentMethods: PaymentMethod[] = [
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      icon: <CreditCard className="w-6 h-6 text-blue-400" />,
      description: "Direct bank transfer - Instant",
      minAmount: 100,
      maxAmount: 1000000,
      processingTime: "Instant",
      available: true,
    },
    {
      id: "mobile_money",
      name: "Mobile Money",
      icon: <Smartphone className="w-6 h-6 text-purple-400" />,
      description: "MTN, Airtel, 9mobile",
      minAmount: 50,
      maxAmount: 500000,
      processingTime: "1-5 minutes",
      available: true,
    },
    {
      id: "ussd",
      name: "USSD",
      icon: <Building className="w-6 h-6 text-orange-400" />,
      description: "*737# and other USSD codes",
      minAmount: 100,
      maxAmount: 200000,
      processingTime: "Instant",
      available: true,
    },
  ]

  const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000]

  const handleAmountNext = () => {
    if (!amount || Number.parseFloat(amount) < 50) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit amount is ₦50",
        variant: "destructive",
      })
      return
    }
    setStep("method")
  }

  const handleMethodSelect = (methodId: string) => {
    const method = paymentMethods.find((m) => m.id === methodId)
    if (!method?.available) return

    const amountNum = Number.parseFloat(amount)
    if (amountNum < method.minAmount || amountNum > method.maxAmount) {
      toast({
        title: "Invalid Amount",
        description: `Amount must be between ₦${method.minAmount.toLocaleString()} and ₦${method.maxAmount.toLocaleString()}`,
        variant: "destructive",
      })
      return
    }

    setSelectedMethod(methodId)
    initiatePayment(methodId)
  }

  const initiatePayment = async (methodId: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          method: methodId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentDetails(data)
        setStep("payment")
        toast({
          title: "Payment Initiated",
          description: "Follow the instructions to complete your deposit",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Payment Failed",
          description: error.error || "Failed to initiate payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while processing your request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    })
  }

  const handleClose = () => {
    setStep("amount")
    setAmount("")
    setSelectedMethod(null)
    setPaymentDetails(null)
    onClose()
  }

  const handleSuccess = () => {
    toast({
      title: "Deposit Successful! 🎉",
      description: `₦${amount} has been added to your wallet`,
    })
    onSuccess()
    handleClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">Deposit Money</CardTitle>
                      <p className="text-gray-400">Add funds to your wallet</p>
                    </div>
                  </div>
                  <Button onClick={handleClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Step 1: Amount */}
                {step === "amount" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div>
                      <label className="text-white font-semibold mb-3 block">Enter Amount (₦)</label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter deposit amount"
                        className="glass-input text-white text-lg h-12"
                      />
                      <p className="text-gray-400 text-sm mt-2">Minimum: ₦50 • Maximum: ₦1,000,000</p>
                    </div>

                    {/* Quick Amounts */}
                    <div>
                      <p className="text-white font-semibold mb-3">Quick Amounts</p>
                      <div className="grid grid-cols-3 gap-3">
                        {quickAmounts.map((quickAmount) => (
                          <Button
                            key={quickAmount}
                            onClick={() => setAmount(quickAmount.toString())}
                            variant="outline"
                            className="glass-button bg-transparent"
                          >
                            ₦{quickAmount.toLocaleString()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleAmountNext}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Payment Method */}
                {step === "method" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="text-center">
                      <p className="text-white font-semibold text-lg">
                        Deposit ₦{Number.parseFloat(amount).toLocaleString()}
                      </p>
                      <p className="text-gray-400">Choose your payment method</p>
                    </div>

                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <Button
                          key={method.id}
                          onClick={() => handleMethodSelect(method.id)}
                          disabled={!method.available || loading}
                          className="w-full glass-button bg-transparent h-auto p-4 justify-start hover:bg-white/10"
                        >
                          <div className="flex items-center space-x-4 w-full">
                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                              {method.icon}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-white font-semibold">{method.name}</p>
                              <p className="text-gray-400 text-sm">{method.description}</p>
                              <p className="text-gray-500 text-xs">{method.processingTime}</p>
                            </div>
                            <div className="text-right">
                              <Badge
                                className={
                                  method.available
                                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                                    : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                                }
                              >
                                {method.available ? "Available" : "Coming Soon"}
                              </Badge>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>

                    <Button
                      onClick={() => setStep("amount")}
                      variant="outline"
                      className="w-full glass-button bg-transparent"
                    >
                      Back
                    </Button>
                  </motion.div>
                )}

                {/* Step 3: Payment Instructions */}
                {step === "payment" && paymentDetails && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="text-center">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <p className="text-white font-semibold text-lg">Payment Instructions</p>
                      <p className="text-gray-400">
                        Complete your ₦{Number.parseFloat(amount).toLocaleString()} deposit
                      </p>
                    </div>

                    {/* Payment Details */}
                    <div className="space-y-4">
                      {paymentDetails.account_number && (
                        <div className="glass p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-400 text-sm">Account Number</p>
                              <p className="text-white font-bold text-lg">{paymentDetails.account_number}</p>
                            </div>
                            <Button
                              onClick={() => copyToClipboard(paymentDetails.account_number)}
                              variant="ghost"
                              size="sm"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {paymentDetails.bank_name && (
                        <div className="glass p-4 rounded-lg">
                          <p className="text-gray-400 text-sm">Bank Name</p>
                          <p className="text-white font-semibold">{paymentDetails.bank_name}</p>
                        </div>
                      )}

                      {paymentDetails.reference && (
                        <div className="glass p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-400 text-sm">Reference</p>
                              <p className="text-white font-bold">{paymentDetails.reference}</p>
                            </div>
                            <Button onClick={() => copyToClipboard(paymentDetails.reference)} variant="ghost" size="sm">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="glass p-4 rounded-lg">
                        <p className="text-gray-400 text-sm">Amount to Pay</p>
                        <p className="text-green-400 font-bold text-2xl">
                          ₦{Number.parseFloat(amount).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <h4 className="text-blue-300 font-semibold mb-2">Instructions:</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Transfer the exact amount to the account above</li>
                        <li>• Use the reference code for faster processing</li>
                        <li>• Your account will be credited within 5 minutes</li>
                        <li>• Contact support if payment is not reflected</li>
                      </ul>
                    </div>

                    <div className="flex space-x-3">
                      <Button onClick={handleSuccess} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500">
                        I've Made Payment
                      </Button>
                      <Button onClick={handleClose} variant="outline" className="glass-button bg-transparent">
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
