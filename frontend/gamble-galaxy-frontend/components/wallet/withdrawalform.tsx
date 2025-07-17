"use client"
import { useState } from "react"
import axios from "axios"

export default function WithdrawForm() {
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")

  const handleWithdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await axios.post("/api/wallet/withdraw/", {
        amount: parseFloat(amount),
        transaction_type: "withdraw",
        description: "User withdrawal"
      })
      setMessage("Withdrawal successful")
      setAmount("")
    } catch (err) {
      setMessage("Withdrawal failed")
    }
  }

  return (
    <form onSubmit={handleWithdraw} className="bg-gray-100 p-4 rounded shadow mb-4">
      <h3 className="text-lg font-semibold mb-2">Withdraw</h3>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="p-2 border rounded w-full mb-2"
        placeholder="Enter amount"
      />
      <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded">Withdraw</button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </form>
  )
}
