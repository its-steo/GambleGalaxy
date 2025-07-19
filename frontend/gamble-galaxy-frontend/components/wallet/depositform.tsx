"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getAuthHeader } from "@/lib/auth"
import { PiggyBank } from "lucide-react"
import { useWallet } from "@/context/WalletContext"

export function DepositForm() {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { refreshBalance } = useWallet()

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
          ...getAuthHeader(),
        },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json()
      if (res.ok) {
        toast(`✅ Deposit: KES ${amount}`)
        setAmount("")
        await refreshBalance()
      } else {
        toast(`❌ Failed: ${data.detail || "Try again"}`)
      }
    } catch {
      toast("❌ Network error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleDeposit}
      className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl shadow-lg p-6 space-y-4 text-white"
    >
      <div className="flex items-center space-x-2">
        <PiggyBank className="text-yellow-400 w-5 h-5" />
        <h3 className="text-lg font-semibold">Deposit Funds</h3>
      </div>
      <Input
        type="number"
        placeholder="Enter amount (KES)"
        className="bg-white/20 border-none placeholder:text-gray-300 text-white"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Processing..." : "Deposit"}
      </Button>
    </form>
  )
}
