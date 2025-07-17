"use client"

import { useState } from "react"
import Link from "next/link"
// Update the import path if Button is located elsewhere, for example:
import { Button } from "../ui/button"
// Or, if using absolute imports, ensure tsconfig.json has "paths" configured for "@"
// If the file does not exist, create 'components/ui/button.tsx' or 'components/ui/button/index.tsx' with the Button component.
import { useAuth } from "@/lib/auth"
import { LogOut, Menu, X, Wallet, Gamepad2, Trophy } from "lucide-react"
import { WalletBalance } from "@/components/wallet/wallet-balance"

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-gray-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-white font-bold text-xl">Gamble Galaxy</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/games/aviator"
              className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Aviator</span>
            </Link>
            <Link
              href="/betting"
              className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Sports Betting</span>
            </Link>
            <Link
              href="/wallet"
              className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Wallet</span>
            </Link>
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <WalletBalance />
                <div className="flex items-center space-x-2">
                  {user?.avatar ? (
                    <img src={user.avatar || "/placeholder.svg"} alt={user.username} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{user?.username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <span className="text-white">{user?.username}</span>
                  {user?.is_verified && <div className="w-2 h-2 bg-green-400 rounded-full" title="Verified" />}
                </div>
                <Button variant="ghost" onClick={logout} className="text-gray-400 hover:text-white">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col space-y-4">
              <Link href="/games/aviator" className="text-gray-300 hover:text-white flex items-center space-x-2">
                <Gamepad2 className="w-4 h-4" />
                <span>Aviator</span>
              </Link>
              <Link href="/betting" className="text-gray-300 hover:text-white flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>Sports Betting</span>
              </Link>
              <Link href="/wallet" className="text-gray-300 hover:text-white flex items-center space-x-2">
                <Wallet className="w-4 h-4" />
                <span>Wallet</span>
              </Link>

              {isAuthenticated ? (
                <div className="pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-white">{user?.username}</span>
                      {user?.is_verified && <div className="w-2 h-2 bg-green-400 rounded-full" />}
                    </div>
                    <Button variant="ghost" onClick={logout}>
                      Logout
                    </Button>
                  </div>
                  <div className="mt-2">
                    <WalletBalance />
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2 pt-4 border-t border-gray-800">
                  <Link href="/auth/login">
                    <Button variant="ghost">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
