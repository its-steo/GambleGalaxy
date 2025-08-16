"use client"

import { useEffect, useState } from "react"
import { AviatorGameSimplified } from "@/components/games/aviator-game-simplified"
import { useAuth } from "@/lib/auth"
import GlassSideNav from "@/components/layout/glass-side-nav"
import { Plane, Menu, X } from "lucide-react"
import { toast } from "sonner"

export default function AviatorPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [stars, setStars] = useState<{ left: string; top: string; delay: string; duration: string }[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Mouse tracking and stars generation (client-side only)
  useEffect(() => {
    const generatedStars = [...Array(35)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 4}s`,
      duration: `${2 + Math.random() * 4}s`,
    }))
    setStars(generatedStars)

    let timeoutId: NodeJS.Timeout
    const handleMouseMove = (e: MouseEvent) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }, 16) // 60fps throttling
    }

    // Only add mouse tracking on non-touch devices
    if (!("ontouchstart" in window)) {
      window.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const handleShareGame = () => {
    const shareText = `🚀 Playing Aviator on Gamble Galaxy! Join me for some high-flying action!\n\n${window.location.origin}/aviator`

    if (navigator.share) {
      navigator.share({
        title: "Aviator Game - Gamble Galaxy",
        text: shareText,
      })
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success("Game link copied to clipboard!", {
        className: "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white border-green-400 backdrop-blur-md",
      })
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
          <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-36 h-36 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center animate-pulse shadow-2xl shadow-purple-500/30">
                <Plane className="w-10 h-10 text-white" />
              </div>
              <div className="absolute inset-0 animate-spin rounded-2xl border-4 border-transparent border-t-purple-400/60 border-r-pink-400/40"></div>
            </div>
          </div>
          <h2 className="text-white text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Aviator Loading...
          </h2>
          <p className="text-gray-300 text-base sm:text-lg">Preparing your flight experience</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
          <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-36 h-36 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30">
            <Plane className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-white text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Login Required
          </h2>
          <p className="text-gray-300 text-base sm:text-lg mb-6">Please log in to start your Aviator journey</p>
          <button
            onClick={() => (window.location.href = "/auth/login")}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Main content once authenticated
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />

        {!("ontouchstart" in window) && (
          <div
            className="absolute w-24 h-24 sm:w-48 sm:h-48 lg:w-96 lg:h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl transition-all duration-1000 ease-out"
            style={{
              left: mousePosition.x - 48,
              top: mousePosition.y - 48,
            }}
          />
        )}

        <div className="absolute top-1/4 left-1/4 w-24 h-24 sm:w-36 sm:h-36 lg:w-72 lg:h-72 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-28 h-28 sm:w-40 sm:h-40 lg:w-80 lg:h-80 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: star.left,
              top: star.top,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </div>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-[60] lg:hidden bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white hover:bg-white/15 hover:scale-105 transition-all duration-300 shadow-lg shadow-black/25"
      >
        <div className="relative">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded blur-sm -z-10"></div>
        </div>
      </button>

      <div className="flex relative z-10">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed left-0 top-0 h-screen z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:block ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <GlassSideNav onShare={handleShareGame} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main game content */}
        <div className="flex-1 w-full lg:ml-0">
          <div className="relative z-10 pt-16 lg:pt-0 px-2 sm:px-4 lg:px-6">
            <AviatorGameSimplified />
          </div>
        </div>
      </div>
    </div>
  )
}
