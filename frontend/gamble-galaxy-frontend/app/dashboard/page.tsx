"use client"

import { motion } from "framer-motion"
import { ArrowUpRight, Trophy, Wallet, Clock } from "lucide-react"
import Link from "next/link"

export default function DashboardHome() {
  return (
    <div className="relative text-white min-h-screen overflow-hidden">
      {/* Subtle background animation (stars / blur effect) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-950 via-purple-900 to-indigo-950 animate-pulse bg-cover" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-6"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">🎯 Welcome to Gamble Galaxy</h1>
        <p className="text-purple-300 mb-8 text-lg">
          Your one-stop hub for smart betting, fast payouts, and real-time results.
        </p>

        {/* Hero Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card
            title="Total Bets"
            value="1,248"
            icon={<Trophy className="text-yellow-300" />}
            bg="from-yellow-500 via-yellow-600 to-yellow-700"
          />
          <Card
            title="Total Winnings"
            value="$12,950"
            icon={<Wallet className="text-green-300" />}
            bg="from-green-500 via-green-600 to-green-700"
          />
          <Card
            title="Recent Bets"
            value="12"
            icon={<Clock className="text-pink-300" />}
            bg="from-pink-500 via-pink-600 to-pink-700"
          />
        </div>

        {/* Quick Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bet History Preview */}
          <div className="bg-white/5 rounded-lg p-5 backdrop-blur-md border border-purple-500/20 shadow-lg">
            <h2 className="text-xl font-bold mb-4">🧾 Recent Bets</h2>
            <ul className="space-y-3">
              {[
                { match: "Chelsea vs Arsenal", status: "Won", amount: "$25" },
                { match: "Man Utd vs City", status: "Lost", amount: "$15" },
                { match: "Madrid vs Barca", status: "Pending", amount: "$40" },
              ].map((bet, index) => (
                <li
                  key={index}
                  className="flex justify-between text-sm p-3 rounded-md bg-white/10 hover:bg-white/20 transition"
                >
                  <span>{bet.match}</span>
                  <span
                    className={`${
                      bet.status === "Won"
                        ? "text-green-400"
                        : bet.status === "Lost"
                        ? "text-red-400"
                        : "text-yellow-300"
                    }`}
                  >
                    {bet.status}
                  </span>
                  <span>{bet.amount}</span>
                </li>
              ))}
            </ul>
            <Link href="/dashboard/betting/history" className="text-purple-300 mt-4 inline-block hover:underline">
              View All <ArrowUpRight size={14} className="inline" />
            </Link>
          </div>

          {/* Winning Trends (Placeholder for chart) */}
          <div className="bg-white/5 rounded-lg p-5 backdrop-blur-md border border-purple-500/20 shadow-lg">
            <h2 className="text-xl font-bold mb-4">📈 Winnings Overview</h2>
            <div className="w-full h-40 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl flex items-center justify-center text-white/70">
              <p className="text-lg">Chart Coming Soon</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/dashboard/betting/place"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-full hover:scale-105 transition"
          >
            🎰 Place a New Bet
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

// Mini Card Component
function Card({
  title,
  value,
  icon,
  bg,
}: {
  title: string
  value: string
  icon: React.ReactNode
  bg: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`p-5 rounded-xl bg-gradient-to-r ${bg} shadow-lg flex items-center justify-between`}
    >
      <div>
        <h3 className="text-sm text-white/80">{title}</h3>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
      <div className="bg-white/10 p-3 rounded-full">{icon}</div>
    </motion.div>
  )
}
