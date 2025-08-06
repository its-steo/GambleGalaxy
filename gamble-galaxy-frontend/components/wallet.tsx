"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  WalletIcon,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Smartphone,
  History,
  TrendingUp,
} from "lucide-react"
import { useNotification } from "./notification-system"

interface Transaction {
  id: string
  type: "deposit" | "withdrawal" | "bet" | "win"
  amount: number
  description: string
  timestamp: Date
  status: "completed" | "pending" | "failed"
}

export default function Wallet() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const { addNotification } = useNotification()

  useEffect(() => {
    // Load balance and transactions
    const savedBalance = Number.parseFloat(localStorage.getItem("wallet_balance") || "1000")
    setBalance(savedBalance)

    const savedTransactions = localStorage.getItem("wallet_transactions")
    if (savedTransactions) {
      setTransactions(
        JSON.parse(savedTransactions).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        })),
      )
    } else {
      // Add some sample transactions
      const sampleTransactions: Transaction[] = [
        {
          id: "1",
          type: "deposit",
          amount: 1000,
          description: "M-Pesa Deposit",
          timestamp: new Date(Date.now() - 86400000),
          status: "completed",
        },
        {
          id: "2",
          type: "win",
          amount: 250,
          description: "Aviator Game Win",
          timestamp: new Date(Date.now() - 3600000),
          status: "completed",
        },
        {
          id: "3",
          type: "bet",
          amount: -100,
          description: "Sports Bet - Manchester United",
          timestamp: new Date(Date.now() - 1800000),
          status: "completed",
        },
      ]
      setTransactions(sampleTransactions)
      localStorage.setItem("wallet_transactions", JSON.stringify(sampleTransactions))
    }
  }, [])

  const paymentMethods = [
    { id: "mpesa", name: "M-Pesa", icon: Smartphone, fee: 0 },
    { id: "airtel", name: "Airtel Money", icon: Smartphone, fee: 0 },
    { id: "card", name: "Credit/Debit Card", icon: CreditCard, fee: 2.5 },
  ]

  const addTransaction = (transaction: Omit<Transaction, "id" | "timestamp">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: new Date(),
    }

    const updatedTransactions = [newTransaction, ...transactions]
    setTransactions(updatedTransactions)
    localStorage.setItem("wallet_transactions", JSON.stringify(updatedTransactions))
  }

  const handleDeposit = () => {
    if (!depositAmount || !selectedPaymentMethod) return

    const amount = Number.parseFloat(depositAmount)
    const method = paymentMethods.find((m) => m.id === selectedPaymentMethod)

    if (!method) return

    const fee = (amount * method.fee) / 100
    const totalAmount = amount - fee

    // Simulate processing
    setTimeout(() => {
      const newBalance = balance + totalAmount
      setBalance(newBalance)
      localStorage.setItem("wallet_balance", newBalance.toString())

      addTransaction({
        type: "deposit",
        amount: totalAmount,
        description: `${method.name} Deposit`,
        status: "completed",
      })

      addNotification({
        type: "success",
        title: "Deposit Successful",
        message: `KES ${totalAmount.toFixed(2)} has been added to your wallet`,
      })

      setDepositAmount("")
      setSelectedPaymentMethod("")
    }, 2000)

    addNotification({
      type: "info",
      title: "Processing Deposit",
      message: "Your deposit is being processed...",
    })
  }

  const handleWithdraw = () => {
    if (!withdrawAmount) return

    const amount = Number.parseFloat(withdrawAmount)

    if (amount > balance) {
      addNotification({
        type: "error",
        title: "Insufficient Balance",
        message: "You don't have enough funds for this withdrawal",
      })
      return
    }

    // Simulate processing
    setTimeout(() => {
      const newBalance = balance - amount
      setBalance(newBalance)
      localStorage.setItem("wallet_balance", newBalance.toString())

      addTransaction({
        type: "withdrawal",
        amount: -amount,
        description: "Withdrawal to M-Pesa",
        status: "completed",
      })

      addNotification({
        type: "success",
        title: "Withdrawal Successful",
        message: `KES ${amount.toFixed(2)} has been sent to your M-Pesa`,
      })

      setWithdrawAmount("")
    }, 2000)

    addNotification({
      type: "info",
      title: "Processing Withdrawal",
      message: "Your withdrawal is being processed...",
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case "win":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "bet":
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />
      default:
        return <History className="h-4 w-4" />
    }
  }

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return "text-green-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
        <p className="text-muted-foreground">Manage your funds</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Available Balance</p>
              <p className="text-3xl font-bold">KES {balance.toLocaleString()}</p>
            </div>
            <WalletIcon className="h-12 w-12 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button className="h-16 flex-col space-y-2 bg-transparent" variant="outline">
          <Plus className="h-6 w-6" />
          <span>Deposit</span>
        </Button>
        <Button className="h-16 flex-col space-y-2 bg-transparent" variant="outline">
          <Minus className="h-6 w-6" />
          <span>Withdraw</span>
        </Button>
      </div>

      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Funds</CardTitle>
              <CardDescription>Add money to your wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount (KES)</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Payment Method</label>
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <method.icon className="h-5 w-5" />
                        <span className="font-medium">{method.name}</span>
                      </div>
                      <Badge variant="secondary">{method.fee > 0 ? `${method.fee}% fee` : "No fee"}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleDeposit} disabled={!depositAmount || !selectedPaymentMethod} className="w-full">
                Deposit KES {depositAmount || "0"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Funds</CardTitle>
              <CardDescription>Send money to your M-Pesa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount (KES)</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Available: KES {balance.toLocaleString()}</p>
              </div>

              <Button onClick={handleWithdraw} disabled={!withdrawAmount} className="w-full">
                Withdraw KES {withdrawAmount || "0"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.timestamp.toLocaleDateString()} {transaction.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${getTransactionColor(transaction.type, transaction.amount)}`}>
                          {transaction.amount > 0 ? "+" : ""}KES {Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <Badge
                          variant={
                            transaction.status === "completed"
                              ? "default"
                              : transaction.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
