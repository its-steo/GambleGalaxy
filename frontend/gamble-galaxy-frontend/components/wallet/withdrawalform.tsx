//"use client"
//
//import { useState } from "react"
//import { Button } from "@/components/ui/button"
//import { Input } from "@/components/ui/input"
//import { Label } from "@/components/ui/label"
//import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
//import { toast } from "sonner"
//import { useWallet } from "@/context/WalletContext"
//import { getAuthHeader } from "@/lib/auth"
//
//export default function WithdrawForm() {
//  const [amount, setAmount] = useState("")
//  const [accountDetails, setAccountDetails] = useState("")
//  const [withdrawalMethod, setWithdrawalMethod] = useState("")
//  const [isLoading, setIsLoading] = useState(false)
//
//  const { balance, refreshBalance } = useWallet()
//
//  const handleWithdraw = async () => {
//    if (!amount || !accountDetails || !withdrawalMethod) {
//      toast.error("Please fill in all fields")
//      return
//    }
//
//    const withdrawAmount = Number.parseFloat(amount)
//    if (withdrawAmount <= 0) {
//      toast.error("Please enter a valid amount")
//      return
//    }
//
//    if (withdrawAmount > balance) {
//      toast.error("Insufficient balance")
//      return
//    }
//
//    setIsLoading(true)
//    try {
//      const response = await fetch("/api/wallet/withdraw", {
//        method: "POST",
//        headers: {
//          "Content-Type": "application/json",
//          ...getAuthHeader(),
//        },
//        body: JSON.stringify({
//          amount: withdrawAmount,
//          ...(withdrawalMethod === "mpesa" ? { phoneNumber: accountDetails } : { accountNumber: accountDetails }),
//          withdrawalMethod,
//        }),
//      })
//
//      if (!response.ok) {
//        const errorData = await response.json()
//        throw new Error(errorData.message || "Withdrawal failed")
//      }
//
//     // const data = await response.json()
//
//      await refreshBalance()
//
//      toast.success("Withdrawal request submitted successfully!")
//      setAmount("")
//      setAccountDetails("")
//      setWithdrawalMethod("")
//    } catch (error) {
//      console.error("Withdrawal error:", error)
//      toast.error(error instanceof Error ? error.message : "Failed to process withdrawal. Please try again.")
//    } finally {
//      setIsLoading(false)
//    }
//  }
//
//  const getFieldConfig = () => {
//    if (withdrawalMethod === "mpesa") {
//      return {
//        label: "Phone Number",
//        placeholder: "254XXXXXXXXX",
//        type: "tel",
//      }
//    } else if (withdrawalMethod === "bank") {
//      return {
//        label: "Account Number",
//        placeholder: "Enter bank account number",
//        type: "text",
//      }
//    }
//    return {
//      label: "Phone Number / Account Number",
//      placeholder: "Select withdrawal method first",
//      type: "text",
//    }
//  }
//
//  const fieldConfig = getFieldConfig()
//
//  return (
//    <div className="space-y-4">
//      <div>
//        <Label htmlFor="withdraw-amount" className="text-white/90 text-sm font-medium">
//          Amount (KES)
//        </Label>
//        <Input
//          id="withdraw-amount"
//          type="number"
//          placeholder="Enter amount"
//          value={amount}
//          onChange={(e) => setAmount(e.target.value)}
//          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-red-400 focus:ring-red-400/20"
//        />
//        <p className="text-xs text-white/60 mt-1">Available balance: KES {balance.toLocaleString()}</p>
//      </div>
//
//      <div>
//        <Label htmlFor="withdrawal-method" className="text-white/90 text-sm font-medium">
//          Withdrawal Method
//        </Label>
//        <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
//          <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-red-400 focus:ring-red-400/20">
//            <SelectValue placeholder="Select method" />
//          </SelectTrigger>
//          <SelectContent className="bg-gray-900 border-white/20">
//            <SelectItem value="mpesa" className="text-white hover:bg-white/10">
//              M-Pesa
//            </SelectItem>
//            <SelectItem value="bank" className="text-white hover:bg-white/10">
//              Bank Transfer
//            </SelectItem>
//          </SelectContent>
//        </Select>
//      </div>
//
//      <div>
//        <Label htmlFor="withdraw-account" className="text-white/90 text-sm font-medium">
//          {fieldConfig.label}
//        </Label>
//        <Input
//          id="withdraw-account"
//          type={fieldConfig.type}
//          placeholder={fieldConfig.placeholder}
//          value={accountDetails}
//          onChange={(e) => setAccountDetails(e.target.value)}
//          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-red-400 focus:ring-red-400/20"
//          disabled={!withdrawalMethod}
//        />
//      </div>
//
//      <Button
//        onClick={handleWithdraw}
//        disabled={isLoading}
//        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
//      >
//        {isLoading ? (
//          <div className="flex items-center">
//            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//            Processing...
//          </div>
//        ) : (
//          "Withdraw Funds"
//        )}
//      </Button>
//    </div>
//  )
//}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useWallet } from "@/context/WalletContext"
import { getAuthHeader } from "@/lib/auth"
//import { headers } from "next/dist/server/request/headers"

export default function WithdrawForm() {
  const [amount, setAmount] = useState("")
  const [accountDetails, setAccountDetails] = useState("")
  const [withdrawalMethod, setWithdrawalMethod] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { balance, refreshBalance } = useWallet()

  const handleWithdraw = async () => {
    if (!amount || !accountDetails || !withdrawalMethod) {
      toast.error("Please fill in all fields")
      return
    }

    const withdrawAmount = Number.parseFloat(amount)
    if (withdrawAmount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (withdrawAmount > balance) {
      toast.error("Insufficient balance")
      return
    }

    setIsLoading(true)
    try {
    const response = await fetch("https://gamblegalaxy.onrender.com/api/wallet/withdraw/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        amount: withdrawAmount,
        ...(withdrawalMethod === "mpesa" ? { phoneNumber: accountDetails } : { accountNumber: accountDetails }),
        withdrawalMethod,
      }),
    })
//
    //const response = await fetch("http://localhost:8000/api/wallet/withdraw/", {
    //  method: "POST",
    //  headers: {
    //    "Content-Type": "application/json",
    //    ...getAuthHeader(),
    //  },
    //  body: JSON.stringify({
    //    amount: withdrawAmount,
    //    ...(withdrawalMethod === "mpesa" ? { phoneNumber: accountDetails } : { accountNumber: accountDetails }),
    //    withdrawalMethod,
    //  }),
    //})

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Withdrawal failed")
      }

      await refreshBalance()

      toast.success("Withdrawal request submitted successfully! Awaiting admin approval.")
      setAmount("")
      setAccountDetails("")
      setWithdrawalMethod("")
    } catch (error) {
      console.error("Withdrawal error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to process withdrawal. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getFieldConfig = () => {
    if (withdrawalMethod === "mpesa") {
      return {
        label: "Phone Number",
        placeholder: "254XXXXXXXXX",
        type: "tel",
      }
    } else if (withdrawalMethod === "bank") {
      return {
        label: "Account Number",
        placeholder: "Enter bank account number",
        type: "text",
      }
    }
    return {
      label: "Phone Number / Account Number",
      placeholder: "Select withdrawal method first",
      type: "text",
    }
  }

  const fieldConfig = getFieldConfig()

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="withdraw-amount" className="text-white/90 text-sm font-medium">
          Amount (KES)
        </Label>
        <Input
          id="withdraw-amount"
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-red-400 focus:ring-red-400/20"
        />
        <p className="text-xs text-white/60 mt-1">Available balance: KES {balance.toLocaleString()}</p>
      </div>

      <div>
        <Label htmlFor="withdrawal-method" className="text-white/90 text-sm font-medium">
          Withdrawal Method
        </Label>
        <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-red-400 focus:ring-red-400/20">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-white/20">
            <SelectItem value="mpesa" className="text-white hover:bg-white/10">
              M-Pesa
            </SelectItem>
            <SelectItem value="bank" className="text-white hover:bg-white/10">
              Bank Transfer
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="withdraw-account" className="text-white/90 text-sm font-medium">
          {fieldConfig.label}
        </Label>
        <Input
          id="withdraw-account"
          type={fieldConfig.type}
          placeholder={fieldConfig.placeholder}
          value={accountDetails}
          onChange={(e) => setAccountDetails(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-red-400 focus:ring-red-400/20"
          disabled={!withdrawalMethod}
        />
      </div>

      <Button
        onClick={handleWithdraw}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          "Withdraw Funds"
        )}
      </Button>
    </div>
  )
}