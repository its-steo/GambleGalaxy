"use client"

import React, { useState, useEffect } from "react"
import WalletCard from "@/components/wallet/walletcard"
import { DepositForm } from "@/components/wallet/depositform"
import WithdrawForm from "@/components/wallet/withdrawalform"
import TransactionHistory from "@/components/wallet/transactionhistory"
import { WalletBalance } from "@/components/wallet/wallet-balance"
import { DollarSign, History, ArrowUpCircle, ArrowDownCircle, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function WalletPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<React.ReactElement[]>([])
  const [quickActions] = useState([
    { id: 1, name: "Deposit", icon: ArrowUpCircle, action: () => toast.info("Deposit action triggered!") },
    { id: 2, name: "Withdraw", icon: ArrowDownCircle, action: () => toast.info("Withdraw action triggered!") },
    { id: 3, name: "Transactions", icon: History, action: () => toast.info("View history action triggered!") },
    { id: 4, name: "Quick Pay", icon: Zap, action: () => toast.info("Quick Pay action triggered!") },
  ])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    const generatedParticles = Array.from({ length: 15 }).map((_, i) => {
      const left = `${Math.random() * 100}%`
      const top = `${Math.random() * 100}%`
      const delay = `${Math.random() * 3}s`
      const duration = `${2 + Math.random() * 3}s`

      return (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
          style={{ left, top, animationDelay: delay, animationDuration: duration }}
        />
      )
    })
    setParticles(generatedParticles)
  }, [])

  return (
    <div className="min-h-screen bg-black relative overflow-hidden pt-16 lg:pt-0">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
        <div
          className="absolute w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-purple-500/10 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 96,
            top: mousePosition.y - 96,
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-36 h-36 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        {particles}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            My{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Wallet
            </span>
          </h1>
          <WalletBalance />
        </div>

        {/* Wallet Overview */}
        <section className="mb-8 sm:mb-12">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 transition-all duration-300 hover:scale-[1.01]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-white text-xl sm:text-2xl flex items-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-green-400" />
                Account Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <WalletCard />
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="mb-8 sm:mb-12">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 transition-all duration-300 hover:scale-[1.01]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-white text-xl sm:text-2xl flex items-center">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-yellow-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  onClick={action.action}
                  className="flex flex-col items-center justify-center h-auto py-4 sm:py-6 bg-white/10 hover:bg-white/20 text-white rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 group"
                >
                  <action.icon className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-purple-400 group-hover:text-purple-300 transition-colors" />
                  <span className="text-sm sm:text-base font-semibold">{action.name}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Deposit and Withdraw Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 sm:mb-12">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 transition-all duration-300 hover:scale-[1.01]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-white text-xl sm:text-2xl flex items-center">
                <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-green-400" />
                Deposit Funds
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DepositForm />
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 transition-all duration-300 hover:scale-[1.01]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-white text-xl sm:text-2xl flex items-center">
                <ArrowDownCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-red-400" />
                Withdraw Funds
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <WithdrawForm />
            </CardContent>
          </Card>
        </section>

        {/* Transaction History */}
        <section>
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 transition-all duration-300 hover:scale-[1.01]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-white text-xl sm:text-2xl flex items-center">
                <History className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-400" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TransactionHistory />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
