"use client"

import React from "react"
import WalletCard from "@/components/wallet/walletcard"
import { DepositForm } from "@/components/wallet/depositform"
import  WithdrawForm  from "@/components/wallet/withdrawalform"
import TransactionHistory from "@/components/wallet/transactionhistory"

export default function WalletPage() {
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Wallet</h1>

      {/* Wallet Overview */}
      <WalletCard />

      {/* Deposit and Withdraw Section */}
      <div className="grid md:grid-cols-2 gap-4">
        <DepositForm />
        <WithdrawForm />
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-xl font-semibold mt-6 mb-2">Transaction History</h2>
        <TransactionHistory />
      </div>
    </div>
  )
}
