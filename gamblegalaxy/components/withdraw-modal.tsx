"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, ArrowUpRight, AlertTriangle, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentBalance: number
}

export default function WithdrawModal({ isOpen, onClose, onSuccess, currentBalance }: WithdrawModalProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    bankName: "",
    accountName: "",
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"amount" | "details" | "confirm">("amount")

  const quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000]
  const minWithdrawal = 1000
  const maxWithdrawal = Math.min(currentBalance, 500000)

  const handleAmountNext = () => {
    const amountNum = Number.parseFloat(amount)
    if (!amount || amountNum < minWithdrawal) {
      toast({
        title: "Invalid Amount",
        description: `Minimum withdrawal amount is ₦${minWithdrawal.toLocaleString()}`,
        variant: "destructive",
      })
      return
    }

    if (amountNum > currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      })
      return
    }

    if (amountNum > maxWithdrawal) {
      toast({
        title: "Amount Too High",
        description: `Maximum withdrawal amount is ₦${maxWithdrawal.toLocaleString()}`,
        variant: "destructive",
      })
      return
    }

    setStep("details")
  }

  const handleDetailsNext = () => {
    if (!bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.accountName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all bank details",
        variant: "destructive",
      })
      return
    }

    if (bankDetails.accountNumber.length < 10) {
      toast({
        title: "Invalid Account Number",
        description: "Account number must be at least 10 digits",
        variant: "destructive",
      })
      return
    }

    setStep("confirm")
  }

  const handleWithdraw = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          bank_details: bankDetails,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Withdrawal Requested! 🎉",
          description: `Your withdrawal of ₦${amount} is being processed. Reference: ${data.reference}`,
        })
        onSuccess()
        handleClose()
      } else {
        const error = await response.json()
        toast({
          title: "Withdrawal Failed",
          description: error.error || "Failed to process withdrawal",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while processing your withdrawal",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep("amount")
    setAmount("")
    setBankDetails({ accountNumber: "", bankName: "", accountName: "" })
    onClose()
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
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <ArrowUpRight className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">Withdraw Money</CardTitle>
                      <p className="text-gray-400">Transfer funds to your bank account</p>
                    </div>
                  </div>
                  <Button onClick={handleClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Balance Display */}
                <div className="glass p-4 rounded-lg text-center">
                  <p className="text-gray-400 text-sm">Available Balance</p>
                  <p className="text-2xl font-bold text-white">₦{currentBalance.toLocaleString()}</p>
                </div>

                {/* Step 1: Amount */}
                {step === "amount" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div>
                      <label className="text-white font-semibold mb-3 block">Withdrawal Amount (₦)</label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter withdrawal amount"
                        className="glass-input text-white text-lg h-12"
                      />
                      <p className="text-gray-400 text-sm mt-2">
                        Min: ₦{minWithdrawal.toLocaleString()} • Max: ₦{maxWithdrawal.toLocaleString()}
                      </p>
                    </div>

                    {/* Quick Amounts */}
                    <div>
                      <p className="text-white font-semibold mb-3">Quick Amounts</p>
                      <div className="grid grid-cols-3 gap-3">
                        {quickAmounts
                          .filter((quickAmount) => quickAmount <= currentBalance)
                          .map((quickAmount) => (
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

                    <Button onClick={handleAmountNext} className="w-full bg-gradient-to-r from-red-500 to-pink-500">
                      Continue
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Bank Details */}
                {step === "details" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="text-center">
                      <p className="text-white font-semibold text-lg">
                        Withdraw ₦{Number.parseFloat(amount).toLocaleString()}
                      </p>
                      <p className="text-gray-400">Enter your bank account details</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-white font-semibold mb-2 block">Account Number</label>
                        <Input
                          type="text"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                          placeholder="Enter account number"
                          className="glass-input text-white"
                        />
                      </div>

                      <div>
                        <label className="text-white font-semibold mb-2 block">Bank Name</label>
                        <Input
                          type="text"
                          value={bankDetails.bankName}
                          onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                          placeholder="Enter bank name"
                          className="glass-input text-white"
                        />
                      </div>

                      <div>
                        <label className="text-white font-semibold mb-2 block">Account Name</label>
                        <Input
                          type="text"
                          value={bankDetails.accountName}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                          placeholder="Enter account name"
                          className="glass-input text-white"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button onClick={handleDetailsNext} className="flex-1 bg-gradient-to-r from-red-500 to-pink-500">
                        Continue
                      </Button>
                      <Button
                        onClick={() => setStep("amount")}
                        variant="outline"
                        className="glass-button bg-transparent"
                      >
                        Back
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Confirmation */}
                {step === "confirm" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="text-center">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <p className="text-white font-semibold text-lg">Confirm Withdrawal</p>
                      <p className="text-gray-400">Please review your withdrawal details</p>
                    </div>

                    {/* Withdrawal Summary */}
                    <div className="space-y-3">
                      <div className="glass p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Amount</span>
                          <span className="text-white font-bold text-lg">
                            ₦{Number.parseFloat(amount).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="glass p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400">Account Number</span>
                          <span className="text-white font-semibold">{bankDetails.accountNumber}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400">Bank Name</span>
                          <span className="text-white font-semibold">{bankDetails.bankName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Account Name</span>
                          <span className="text-white font-semibold">{bankDetails.accountName}</span>
                        </div>
                      </div>

                      <div className="glass p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Processing Time</span>
                          <span className="text-white">2-24 hours</span>
                        </div>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <div>
                          <h4 className="text-yellow-300 font-semibold mb-1">Important Notice</h4>
                          <p className="text-gray-300 text-sm">
                            Please ensure your bank details are correct. Incorrect details may result in failed
                            transactions and delays.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={handleWithdraw}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-red-500 to-pink-500"
                      >
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          "Confirm Withdrawal"
                        )}
                      </Button>
                      <Button
                        onClick={() => setStep("details")}
                        variant="outline"
                        className="glass-button bg-transparent"
                      >
                        Back
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
