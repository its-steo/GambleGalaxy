//"use client"
//
//import { useEffect, useState } from "react"
//import { AviatorGameSimplified } from "@/components/games/aviator-game-simplified"
//import { useAuth } from "@/lib/auth"
//import GlassSideNav from "@/components/layout/glass-side-nav"
//import { Plane, Menu, X } from "lucide-react"
//import { toast } from "sonner"
//
//export default function AviatorPage() {
//  const { isAuthenticated, isLoading: authLoading } = useAuth()
//  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
//  const [stars, setStars] = useState<{ left: string; top: string; delay: string; duration: string }[]>([])
//  const [sidebarOpen, setSidebarOpen] = useState(false)
//
//  // Mouse tracking and stars generation (client-side only)
//  useEffect(() => {
//    const generatedStars = [...Array(35)].map(() => ({
//      left: `${Math.random() * 100}%`,
//      top: `${Math.random() * 100}%`,
//      delay: `${Math.random() * 4}s`,
//      duration: `${2 + Math.random() * 4}s`,
//    }))
//    setStars(generatedStars)
//
//    // Mouse tracking with performance optimization
//    const handleMouseMove = (e: MouseEvent) => {
//      requestAnimationFrame(() => {
//        setMousePosition({ x: e.clientX, y: e.clientY })
//      })
//    }
//
//    window.addEventListener("mousemove", handleMouseMove)
//    return () => window.removeEventListener("mousemove", handleMouseMove)
//  }, [])
//
//  const handleShareGame = () => {
//    const shareText = `🚀 Playing Aviator on Gamble Galaxy! Join me for some high-flying action!\n\n${window.location.origin}/aviator`
//
//    if (navigator.share) {
//      navigator.share({
//        title: "Aviator Game - Gamble Galaxy",
//        text: shareText,
//      })
//    } else {
//      navigator.clipboard.writeText(shareText)
//      toast.success("Game link copied to clipboard!", {
//        className: "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white border-green-400 backdrop-blur-md",
//      })
//    }
//  }
//
//  if (authLoading) {
//    return (
//      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4">
//        <div className="fixed inset-0 z-0">
//          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/25 to-blue-900/30" />
//          <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
//          <div className="absolute bottom-1/4 right-1/4 w-60 h-60 sm:w-80 sm:h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
//          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-64 sm:h-64 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-500" />
//        </div>
//
//        <div className="relative z-10 text-center">
//          <div className="relative mb-8">
//            <div className="w-20 h-20 mx-auto mb-6 relative">
//              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center animate-pulse shadow-2xl shadow-purple-500/30">
//                <Plane className="w-10 h-10 text-white" />
//              </div>
//              <div className="absolute inset-0 animate-spin rounded-2xl border-4 border-transparent border-t-purple-400/60 border-r-pink-400/40"></div>
//            </div>
//          </div>
//          <h2 className="text-white text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
//            Aviator Loading...
//          </h2>
//          <p className="text-gray-300 text-base sm:text-lg">Preparing your flight experience</p>
//        </div>
//      </div>
//    )
//  }
//
//  if (!isAuthenticated) {
//    return (
//      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4">
//        <div className="fixed inset-0 z-0">
//          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/25 to-blue-900/30" />
//          <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
//          <div className="absolute bottom-1/4 right-1/4 w-60 h-60 sm:w-80 sm:h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
//        </div>
//
//        <div className="relative z-10 text-center">
//          <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30">
//            <Plane className="w-10 h-10 text-white" />
//          </div>
//          <h2 className="text-white text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
//            Login Required
//          </h2>
//          <p className="text-gray-300 text-base sm:text-lg mb-6">Please log in to start your Aviator journey</p>
//          <button
//            onClick={() => (window.location.href = "/auth/login")}
//            className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105"
//          >
//            Go to Login
//          </button>
//        </div>
//      </div>
//    )
//  }
//
//  // Main content once authenticated
//  return (
//    <div className="min-h-screen bg-black relative overflow-hidden">
//      <div className="fixed inset-0 z-0">
//        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/25 to-blue-900/30" />
//
//        {/* Mouse-following gradients */}
//        {mousePosition.x !== 0 || mousePosition.y !== 0 ? (
//          <>
//            <div
//              className="absolute w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-purple-500/20 rounded-full blur-3xl transition-all duration-700 ease-out"
//              style={{
//                left: mousePosition.x - 128,
//                top: mousePosition.y - 128,
//              }}
//            />
//            <div
//              className="absolute w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 bg-pink-500/15 rounded-full blur-2xl transition-all duration-1000 ease-out"
//              style={{
//                left: mousePosition.x - 96,
//                top: mousePosition.y - 96,
//              }}
//            />
//          </>
//        ) : null}
//
//        {/* Static background gradients */}
//        <div className="absolute top-1/4 left-1/4 w-40 h-40 sm:w-56 sm:h-56 lg:w-80 lg:h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
//        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
//        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-500" />
//      </div>
//
//      <div className="fixed inset-0 z-0">
//        {stars.map((star, i) => (
//          <div
//            key={i}
//            className={`absolute rounded-full animate-pulse ${
//              i % 4 === 0
//                ? "w-1.5 h-1.5 bg-white/40"
//                : i % 4 === 1
//                  ? "w-1 h-1 bg-purple-300/30"
//                  : i % 4 === 2
//                    ? "w-0.5 h-0.5 bg-pink-300/35"
//                    : "w-2 h-2 bg-blue-300/25"
//            }`}
//            style={{
//              left: star.left,
//              top: star.top,
//              animationDelay: star.delay,
//              animationDuration: star.duration,
//            }}
//          />
//        ))}
//      </div>
//
//      <button
//        onClick={() => setSidebarOpen(!sidebarOpen)}
//        className="fixed top-4 left-4 z-[60] lg:hidden bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white hover:bg-white/15 hover:scale-105 transition-all duration-300 shadow-lg shadow-black/25"
//      >
//        <div className="relative">
//          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded blur-sm -z-10"></div>
//        </div>
//      </button>
//
//      <div className="flex relative z-10">
//        {/* Mobile overlay */}
//        {sidebarOpen && (
//          <div
//            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
//            onClick={() => setSidebarOpen(false)}
//          />
//        )}
//
//        {/* Sidebar */}
//        <div
//          className={`fixed left-0 top-0 h-screen z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:block ${
//            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
//          }`}
//        >
//          <GlassSideNav onShare={handleShareGame} onClose={() => setSidebarOpen(false)} />
//        </div>
//
//        {/* Main game content */}
//        <div className="flex-1 w-full lg:ml-0">
//          <div className="relative z-10 pt-16 lg:pt-0 px-2 sm:px-4 lg:px-6">
//            <AviatorGameSimplified />
//          </div>
//        </div>
//      </div>
//    </div>
//  )
//}
"use client"

import { useEffect, useState } from "react"
import { AviatorGameSimplified } from "@/components/games/aviator-game-simplified"
import { useAuth } from "@/lib/auth"
import GlassSideNav from "@/components/layout/glass-side-nav"
import { Plane, Menu, X } from "lucide-react"
import { toast } from "sonner"
import { useMobileOptimizedTracking, useMobileViewport, preventIOSZoom, isMobile } from "@/lib/mobile-utils"

export default function AviatorPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { position: mousePosition, isTouch } = useMobileOptimizedTracking()
  const [stars, setStars] = useState<{ left: string; top: string; delay: string; duration: string }[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useMobileViewport()
  preventIOSZoom()

  useEffect(() => {
    const starCount = isMobile() ? 15 : 35 // Fewer stars on mobile
    const generatedStars = [...Array(starCount)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 4}s`,
      duration: `${2 + Math.random() * 4}s`,
    }))
    setStars(generatedStars)
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
      <div className="min-h-screen mobile-vh-fix bg-black relative overflow-hidden flex items-center justify-center px-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/25 to-blue-900/30" />
          <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 bg-pink-500/20 rounded-full blur-2xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 text-center">
          <div className="relative mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center animate-pulse shadow-2xl shadow-purple-500/30">
                <Plane className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="absolute inset-0 animate-spin rounded-2xl border-4 border-transparent border-t-purple-400/60 border-r-pink-400/40"></div>
            </div>
          </div>
          <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Aviator Loading...
          </h2>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg">Preparing your flight experience</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen mobile-vh-fix bg-black relative overflow-hidden flex items-center justify-center px-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/25 to-blue-900/30" />
          <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 bg-pink-500/20 rounded-full blur-2xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-8 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30">
            <Plane className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Login Required
          </h2>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg mb-6">
            Please log in to start your Aviator journey
          </p>
          <button
            onClick={() => (window.location.href = "/auth/login")}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 mobile-hover-fix touch-target min-h-[48px]"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Main content once authenticated
  return (
    <div className="min-h-screen mobile-vh-fix bg-black relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/25 to-blue-900/30" />

        {!isTouch && mousePosition.x !== 0 && mousePosition.y !== 0 && (
          <>
            <div
              className="absolute w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 bg-purple-500/20 rounded-full blur-2xl transition-all duration-700 ease-out hidden md:block"
              style={{
                left: mousePosition.x - 96,
                top: mousePosition.y - 96,
              }}
            />
            <div
              className="absolute w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-pink-500/15 rounded-full blur-xl transition-all duration-1000 ease-out hidden md:block"
              style={{
                left: mousePosition.x - 64,
                top: mousePosition.y - 64,
              }}
            />
          </>
        )}

        {/* Static background gradients */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-80 lg:h-80 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-48 sm:h-48 md:w-72 md:h-72 lg:w-96 lg:h-96 bg-pink-500/20 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>

      <div className="fixed inset-0 z-0">
        {stars.map((star, i) => (
          <div
            key={i}
            className={`absolute rounded-full animate-pulse mobile-simple-animation ${
              i % 4 === 0
                ? "w-1.5 h-1.5 bg-white/40"
                : i % 4 === 1
                  ? "w-1 h-1 bg-purple-300/30"
                  : i % 4 === 2
                    ? "w-0.5 h-0.5 bg-pink-300/35"
                    : "w-2 h-2 bg-blue-300/25"
            }`}
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
        className="fixed top-4 left-4 z-[60] lg:hidden bg-white/10 backdrop-blur-optimized border border-white/20 rounded-xl p-3 text-white hover:bg-white/15 transition-all duration-300 shadow-lg shadow-black/25 mobile-hover-fix touch-target"
      >
        <div className="relative">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded blur-sm -z-10"></div>
        </div>
      </button>

      <div className="flex relative z-10">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            onTouchStart={() => setSidebarOpen(false)}
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

