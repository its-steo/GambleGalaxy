"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CreditCard, Smartphone, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotification } from "./notification-system"

interface PaymentMethod {
  id: string
  name: string
  type: "mobile" | "card" | "bank"
  icon: React.ReactNode
  fees: number
  minAmount: number
  maxAmount: number
  processingTime: string
  available: boolean
}

interface Transaction {
  id: string
  amount: number
  method: string
  status: "pending" | "completed" | "failed"
  timestamp: Date
  reference: string
}

export default function PaymentIntegration() {
  const [amount, setAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const { addNotification } = useNotification()

  const paymentMethods: PaymentMethod[] = [
    {
      id: "mpesa",
      name: "M-Pesa",
      type: "mobile",
      icon: <Smartphone className="text-green-500" size={24} />,
      fees: 0,
      minAmount: 10,
      maxAmount: 150000,
      processingTime: "Instant",
      available: true,
    },
    {
      id: "airtel",
      name: "Airtel Money",
      type: "mobile",
      icon: <Smartphone className="text-red-500" size={24} />,
      fees: 0,
      minAmount: 10,
      maxAmount: 100000,
      processingTime: "Instant",
      available: true,
    },
    {
      id: "visa",
      name: "Visa Card",
      type: "card",
      icon: <CreditCard className="text-blue-500" size={24} />,
      fees: 2.5,
      minAmount: 100,
      maxAmount: 500000,
      processingTime: "1-3 minutes",
      available: true,
    },
    {
      id: "mastercard",
      name: "Mastercard",
      type: "card",
      icon: <CreditCard className="text-orange-500" size={24} />,
      fees: 2.5,
      minAmount: 100,
      maxAmount: 500000,
      processingTime: "1-3 minutes",
      available: true,
    },
  ]

  useEffect(() => {
    // Load transaction history
    const savedTransactions = localStorage.getItem("transactions")
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions))
    }
  }, [])

  const calculateFees = (amount: number, method: PaymentMethod) => {
    return method.fees > 0 ? (amount * method.fees) / 100 : 0
  }

  const processPayment = async () => {
    if (!selectedMethod || !amount) return

    const method = paymentMethods.find((m) => m.id === selectedMethod)
    if (!method) return

    const amountNum = Number.parseFloat(amount)
    if (amountNum < method.minAmount || amountNum > method.maxAmount) {
      addNotification({
        type: "error",
        title: "Invalid Amount",
        message: `Amount must be between ${method.minAmount} and ${method.maxAmount}`,
      })
      return
    }

    setIsProcessing(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const transaction: Transaction = {
        id: `TXN${Date.now()}`,
        amount: amountNum,
        method: method.name,
        status: Math.random() > 0.1 ? "completed" : "failed",
        timestamp: new Date(),
        reference: `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      }

      const updatedTransactions = [transaction, ...transactions]
      setTransactions(updatedTransactions)
      localStorage.setItem("transactions", JSON.stringify(updatedTransactions))

      if (transaction.status === "completed") {
        // Update wallet balance
        const currentBalance = Number.parseFloat(localStorage.getItem("wallet_balance") || "0")
        const newBalance = currentBalance + amountNum
        localStorage.setItem("wallet_balance", newBalance.toString())

        addNotification({
          type: "success",
          title: "Payment Successful!",
          message: `KES ${amountNum} has been added to your wallet`,
        })

        // Reset form
        setAmount("")
        setPhoneNumber("")
        setCardDetails({ number: "", expiry: "", cvv: "", name: "" })
        setSelectedMethod("")
      } else {
        addNotification({
          type: "error",
          title: "Payment Failed",
          message: "Please try again or contact support",
        })
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Payment Error",
        message: "An error occurred while processing your payment",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const selectedMethodData = paymentMethods.find((m) => m.id === selectedMethod)
  const fees = selectedMethodData && amount ? calculateFees(Number.parseFloat(amount), selectedMethodData) : 0
  const total = amount ? Number.parseFloat(amount) + fees : 0

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Payment Center</h1>
        <p className="text-muted-foreground">Secure deposits and withdrawals</p>
      </div>

      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Deposit Funds
              </CardTitle>
              <CardDescription>Add money to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Payment Method</label>
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedMethod === method.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {method.icon}
                        <span className="font-medium">{method.name}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{method.fees > 0 ? `${method.fees}% fee` : "No fees"}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{method.processingTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full" disabled={!amount || !selectedMethod}>
                Deposit ${amount || "0.00"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Funds</CardTitle>
              <CardDescription>Transfer money from your account</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Withdrawal options will be available here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="text-white font-bold text-lg mb-4">Recent Transactions</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  {transaction.status === "completed" && <CheckCircle className="text-green-500" size={20} />}
                  {transaction.status === "pending" && <Clock className="text-yellow-500" size={20} />}
                  {transaction.status === "failed" && <XCircle className="text-red-500" size={20} />}
                  <div>
                    <div className="text-white font-medium">KES {transaction.amount.toLocaleString()}</div>
                    <div className="text-white/60 text-sm">{transaction.method}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-medium ${
                      transaction.status === "completed"
                        ? "text-green-400"
                        : transaction.status === "pending"
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {transaction.status.toUpperCase()}
                  </div>
                  <div className="text-white/60 text-xs">{transaction.timestamp.toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
