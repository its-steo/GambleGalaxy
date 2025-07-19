"use client"

import React from "react"
import WalletCard from "@/components/wallet/walletcard"
import { DepositForm } from "@/components/wallet/depositform"
import WithdrawForm from "@/components/wallet/withdrawalform"
import TransactionHistory from "@/components/wallet/transactionhistory"
import { WalletBalance } from "@/components/wallet/wallet-balance"

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto space-y-10 text-gray-100">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">My Wallet</h1>
          <WalletBalance />
        </div>

        {/* Wallet Overview */}
        <section className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl shadow-lg p-5 sm:p-6">
          <WalletCard />
        </section>

        {/* Deposit and Withdraw Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl shadow-lg p-5 sm:p-6">
            <DepositForm />
          </div>
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl shadow-lg p-5 sm:p-6">
            <WithdrawForm />
          </div>
        </section>

        {/* Transaction History */}
        <section className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl shadow-lg p-5 sm:p-6">
          <h2 className="text-2xl font-semibold mb-4">Transaction History</h2>
          <TransactionHistory />
        </section>
      </div>
    </div>
  )
}
