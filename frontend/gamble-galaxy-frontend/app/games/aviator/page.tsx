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
    // Generate stars
    const generatedStars = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 3}s`,
    }))
    setStars(generatedStars)

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
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

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 relative overflow-hidden flex items-center justify-center px-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
          <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-60 h-60 sm:w-80 sm:h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 text-center">
          <div className="relative mb-6">
            {/* Aviator themed loading */}
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center animate-pulse">
                <Plane className="w-8 h-8 text-white" />
              </div>
              <div className="absolute inset-0 animate-spin rounded-xl border-4 border-transparent border-t-red-500/50"></div>
            </div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-red-400/30 mx-auto"></div>
          </div>
          <h2 className="text-white text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Aviator Loading...
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">Checking authentication</p>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 relative overflow-hidden flex items-center justify-center px-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
          <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-60 h-60 sm:w-80 sm:h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-white text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Login Required
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-4">Please log in to play Aviator</p>
          <button
            onClick={() => (window.location.href = "/auth/login")}
            className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Main content once authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 relative overflow-hidden">
      {/* Interactive background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
        {mousePosition.x !== 0 || mousePosition.y !== 0 ? (
          <div
            className="absolute w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-purple-500/10 rounded-full blur-3xl transition-all duration-1000 ease-out"
            style={{
              left: mousePosition.x - 96,
              top: mousePosition.y - 96,
            }}
          />
        ) : null}
        <div className="absolute top-1/4 left-1/4 w-36 h-36 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Animated stars */}
      <div className="fixed inset-0 z-0">
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
        className="fixed top-4 left-4 z-[60] lg:hidden bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 rounded-xl p-3 text-white hover:bg-white/30 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
        style={{
          boxShadow: "0 8px 32px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="relative">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded blur-sm -z-10"></div>
        </div>
      </button>

      <div className="flex relative z-10">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div
          className={`fixed left-0 top-0 h-screen z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:block ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <GlassSideNav onShare={handleShareGame} onClose={() => setSidebarOpen(false)} />
        </div>

        <div className="flex-1 w-full lg:ml-0">
          <div className="relative z-10 pt-16 lg:pt-0 px-2 sm:px-4 lg:px-6">
            <AviatorGameSimplified />
          </div>
        </div>
      </div>
    </div>
  )
}
