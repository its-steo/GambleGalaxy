"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "../ui/button"
import { useAuth } from "@/lib/auth"
import { LogOut, Menu, X, Wallet, Bell, Settings, User } from "lucide-react"
import { WalletBalance } from "@/components/wallet/wallet-balance"

interface NavbarProps {
  onMobileMenuToggle?: () => void
  isMobileMenuOpen?: boolean
}

export function Navbar({ onMobileMenuToggle, isMobileMenuOpen }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl"
          : "bg-black/50 backdrop-blur-sm border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12 xs:h-14 sm:h-16">
          {/* Mobile Menu Button & Logo */}
          <div className="flex items-center space-x-1.5 xs:space-x-2 sm:space-x-4">
            {/* Mobile Menu Toggle - Only show on mobile */}
            <Button
              onClick={onMobileMenuToggle}
              className="lg:hidden bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 p-1.5 xs:p-2 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-300"
            >
              {isMobileMenuOpen ? (
                <X className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              ) : (
                <Menu className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              )}
            </Button>

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3 group">
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md xs:rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white font-bold text-xs xs:text-sm sm:text-base md:text-lg">G</span>
              </div>
              <span className="text-white font-bold text-sm xs:text-base sm:text-lg md:text-xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent hidden xs:block">
                <span className="hidden sm:inline">Gamble Galaxy</span>
                <span className="sm:hidden">Galaxy</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-8">
            <Link
              href="/games/aviator"
              className="text-gray-300 hover:text-white transition-colors duration-300 font-medium text-sm lg:text-base"
            >
              Aviator
            </Link>
            <Link
              href="/betting"
              className="text-gray-300 hover:text-white transition-colors duration-300 font-medium text-sm lg:text-base"
            >
              Sports Betting
            </Link>
            <Link
              href="/leaderboard"
              className="text-gray-300 hover:text-white transition-colors duration-300 font-medium text-sm lg:text-base"
            >
              Leaderboard
            </Link>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2 md:space-x-3">
            {isAuthenticated ? (
              <>
                {/* Wallet Balance - Hide on small screens */}
                <div className="hidden sm:block">
                  <WalletBalance />
                </div>

                {/* Notifications - Hide on small screens */}
                <Button
                  variant="ghost"
                  className="hidden sm:flex bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 p-1.5 sm:p-2 rounded-md sm:rounded-lg md:rounded-xl transition-all duration-300"
                >
                  <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>

                {/* User Profile */}
                <div className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md xs:rounded-lg sm:rounded-xl px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 hover:bg-white/20 transition-all duration-300">
                  {user?.avatar ? (
                    <img
                      src={user.avatar || "/placeholder.svg"}
                      alt={user.username}
                      className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white/20"
                    />
                  ) : (
                    <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{user?.username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="text-white text-xs sm:text-sm font-medium truncate max-w-16 sm:max-w-20 md:max-w-none">
                        {user?.username}
                      </span>
                      {user?.is_verified && (
                        <div
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"
                          title="Verified"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Settings - Hide on small screens */}
                <Button
                  variant="ghost"
                  className="hidden sm:flex bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 p-1.5 sm:p-2 rounded-md sm:rounded-lg md:rounded-xl transition-all duration-300"
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>

                {/* Logout */}
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/30 p-1.5 xs:p-2 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-300"
                >
                  <LogOut className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </>
            ) : (
              <div className="flex space-x-1.5 xs:space-x-2">
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-300 text-xs sm:text-sm px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-md xs:rounded-lg sm:rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 text-xs sm:text-sm px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile User Menu - Show when authenticated on mobile */}
      {isAuthenticated && (
        <div className="sm:hidden border-t border-white/10 bg-black/50 backdrop-blur-sm">
          <div className="px-2 xs:px-3 sm:px-4 py-2 xs:py-3 space-y-2 xs:space-y-3">
            {/* Mobile Wallet Balance */}
            <WalletBalance />

            {/* Mobile Quick Actions */}
            <div className="grid grid-cols-3 gap-1.5 xs:gap-2">
              <Button
                variant="ghost"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 rounded-md xs:rounded-lg transition-all duration-300 text-xs py-1.5 xs:py-2"
              >
                <Wallet className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" />
                Wallet
              </Button>
              <Button
                variant="ghost"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 rounded-md xs:rounded-lg transition-all duration-300 text-xs py-1.5 xs:py-2"
              >
                <Bell className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" />
                Alerts
              </Button>
              <Button
                variant="ghost"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 rounded-md xs:rounded-lg transition-all duration-300 text-xs py-1.5 xs:py-2"
              >
                <User className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
