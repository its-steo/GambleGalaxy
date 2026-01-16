
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plane, Clock, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { ThemeProvider } from "@/components/themes/theme-provider"
//import { ThemeToggle } from "@/app/theme-toggle"

export default function AviatorDemoPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-black overflow-hidden relative">
      

        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
          <div className="absolute top-1/4 left-1/4 w-20 h-20 xs:w-24 xs:h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 lg:w-72 lg:h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 xs:w-28 xs:h-28 sm:w-40 sm:h-40 md:w-60 md:h-60 lg:w-80 lg:h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Floating Particles */}
        <div className="fixed inset-0 z-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto w-full py-8 xs:py-10 sm:py-12 md:py-16 lg:py-24 text-center">
            <div
              className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              <div className="inline-flex items-center px-2 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs sm:text-sm mb-3 xs:mb-4 sm:mb-6">
                <Clock className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 mr-1 xs:mr-1.5 sm:mr-2 text-yellow-400" />
                Coming Soon
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 xs:mb-5 sm:mb-6 md:mb-8 leading-tight px-2 xs:px-4">
                Aviator Demo{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse block xs:inline">
                  Coming Soon!
                </span>
              </h1>

              <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 xs:mb-7 sm:mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-2 xs:px-4">
                Get ready to experience the thrill of our Aviator game in demo mode! Test your skills, practice your strategy, and soar to new heights without risking a dime. Stay tuned for the launch!
              </p>

              <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 sm:gap-6 justify-center px-2 xs:px-4">
                <Link href="/games/aviator" className="w-full xs:w-auto">
                  <Button className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 xs:px-8 sm:px-12 py-2.5 xs:py-3 sm:py-4 text-sm xs:text-base sm:text-lg font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 w-full xs:w-auto">
                    <Plane className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 mr-1.5 xs:mr-2 sm:mr-3 group-hover:rotate-12 transition-transform" />
                    Play Aviator Now
                  </Button>
                </Link>
                <Link href="/" className="w-full xs:w-auto">
                  <Button className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 px-6 xs:px-8 sm:px-12 py-2.5 xs:py-3 sm:py-4 text-sm xs:text-base sm:text-lg font-semibold rounded-full shadow-2xl hover:shadow-white/10 transition-all duration-300 hover:scale-105 w-full xs:w-auto">
                    <Star className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 mr-1.5 xs:mr-2 sm:mr-3 group-hover:rotate-12 transition-transform" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ThemeProvider>
  )
}
