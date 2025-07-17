"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
export function DepositForm() {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || isNaN(Number(amount))) {
      toast("Invalid amount")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/wallet/deposit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ amount }),
      })

      const data = await res.json()

      if (res.ok) {
        toast(`Deposit successful: KES ${amount}`)
        setAmount("")
      } else {
        toast(`Deposit failed: ${data.detail || "Try again"}`)
      }
    } catch (error) {
      toast(`Network error: Try again later`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleDeposit} className="bg-white p-4 rounded-xl shadow space-y-4">
      <h3 className="text-lg font-semibold">Deposit Funds</h3>
      <Input
        type="number"
        placeholder="Enter amount (KES)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Processing..." : "Deposit"}
      </Button>
    </form>
  )
}
