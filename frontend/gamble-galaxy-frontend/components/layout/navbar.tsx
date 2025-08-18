"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "../ui/button"
import { useAuth } from "@/lib/auth"
import { LogOut } from "lucide-react"

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()

  // Check if user is verified - using type-safe approach
  const isUserVerified =
    user && typeof user === "object" && user !== null && "is_verified" in user
      ? Boolean((user as Record<string, unknown>).is_verified)
      : false

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-gray-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-1.5 xs:space-x-2 sm:space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-white font-bold text-sm xs:text-base sm:text-lg md:text-xl truncate hidden xs:block">
              Gamble Galaxy
            </span>
          </Link>

          {/* User Section */}
          <div className="flex items-center space-x-3 xs:space-x-3.5 sm:space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2">
                  {user?.avatar ? (
                    <Image
                      src={user.avatar || "/placeholder.svg"}
                      alt={user.username || "User avatar"}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                      unoptimized={user.avatar.startsWith("data:")} // Handle base64 or external images
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  <span className="text-white">{user?.username || "User"}</span>
                  {isUserVerified && <div className="w-2 h-2 bg-green-400 rounded-full" title="Verified User" />}
                </div>
                <Button variant="ghost" onClick={logout} className="text-gray-400 hover:text-white">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex space-x-1 xs:space-x-1.5 sm:space-x-2">
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="text-gray-400 hover:text-white text-xs xs:text-sm sm:text-base px-2 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs xs:text-sm sm:text-base px-2 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}