// app/dashboard/layout.tsx
"use client"

import { ReactNode, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  User,
  Trophy,
  Wallet,
  Gamepad,
  Settings,
  Menu,
  X,
} from "lucide-react"

const navItems = [
  { href: "/dashboard/profile", label: "Profile", icon: <User size={20} /> },
  { href: "/dashboard/betting", label: "Betting", icon: <Trophy size={20} /> },
  { href: "/dashboard/wallet", label: "Wallet", icon: <Wallet size={20} /> },
  { href: "/dashboard/games", label: "Games", icon: <Gamepad size={20} /> },
  { href: "/dashboard/settings", label: "Settings", icon: <Settings size={20} /> },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: open ? 0 : -300 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 h-full w-64 bg-black/20 backdrop-blur-md p-4 z-40 border-r border-purple-500/30`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">🚀 My Dashboard</h2>
          <X className="cursor-pointer" onClick={() => setOpen(false)} />
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all cursor-pointer ${
                  pathname === item.href ? "bg-purple-600" : "hover:bg-purple-500/30"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </motion.div>
            </Link>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <button
          className="text-white fixed top-4 left-4 z-50 bg-purple-700 p-2 rounded-full shadow-md md:hidden"
          onClick={() => setOpen(true)}
        >
          <Menu size={20} />
        </button>
        {children}
      </main>
    </div>
  )
}
