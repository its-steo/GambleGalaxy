"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plane, Trophy, Zap, Shield, Users, Star, TrendingUp, Award } from "lucide-react"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
        <div
          className="absolute w-24 h-24 xs:w-32 xs:h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 lg:w-96 lg:h-96 bg-purple-500/10 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 48,
            top: mousePosition.y - 48,
          }}
        />
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

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full py-8 xs:py-10 sm:py-12 md:py-16 lg:py-24">
            <div
              className={`text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              <div className="mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                <div className="inline-flex items-center px-2 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs sm:text-sm mb-3 xs:mb-4 sm:mb-6">
                  <Star className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 mr-1 xs:mr-1.5 sm:mr-2 text-yellow-400" />
                  #1 Rated Betting Platform
                </div>
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black text-white mb-4 xs:mb-5 sm:mb-6 md:mb-8 leading-tight px-2 xs:px-4">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse block xs:inline">
                  Gamble Galaxy
                </span>
              </h1>

              <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 xs:mb-7 sm:mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed px-2 xs:px-4">
                Experience the <span className="text-purple-400 font-semibold">ultimate thrill</span> of next-generation
                betting with our cutting-edge Aviator game and comprehensive sports betting platform.
              </p>

              <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 sm:gap-6 justify-center mb-8 xs:mb-10 sm:mb-12 md:mb-16 px-2 xs:px-4">
                <Link href="/games/aviator" className="w-full xs:w-auto">
                  <Button className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 xs:px-8 sm:px-12 py-2.5 xs:py-3 sm:py-4 text-sm xs:text-base sm:text-lg font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 w-full xs:w-auto">
                    <Plane className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 mr-1.5 xs:mr-2 sm:mr-3 group-hover:rotate-12 transition-transform" />
                    Play Aviator
                  </Button>
                </Link>
                <Link href="/betting" className="w-full xs:w-auto">
                  <Button className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 px-6 xs:px-8 sm:px-12 py-2.5 xs:py-3 sm:py-4 text-sm xs:text-base sm:text-lg font-semibold rounded-full shadow-2xl hover:shadow-white/10 transition-all duration-300 hover:scale-105 w-full xs:w-auto">
                    <Trophy className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 mr-1.5 xs:mr-2 sm:mr-3 group-hover:rotate-12 transition-transform" />
                    Sports Betting
                  </Button>
                </Link>
              </div>

              {/* Live Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 lg:gap-6 max-w-4xl mx-auto px-2 xs:px-4">
                {[
                  { label: "Active Players", value: "12,847", icon: Users },
                  { label: "Games Played", value: "2.4M+", icon: Plane },
                  { label: "Total Winnings", value: "$45.2M", icon: TrendingUp },
                  { label: "Avg Payout", value: "2.3x", icon: Award },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl p-2 xs:p-3 sm:p-4 border border-white/10"
                  >
                    <stat.icon className="w-3 h-3 xs:w-4 xs:h-4 sm:w-6 sm:h-6 text-purple-400 mx-auto mb-1 xs:mb-2" />
                    <div className="text-sm xs:text-base sm:text-lg md:text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 xs:py-14 sm:py-16 md:py-24 lg:py-32 relative px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-16 lg:mb-20">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 xs:mb-4 sm:mb-6">
                Why Choose Gamble Galaxy?
              </h2>
              <p className="text-gray-400 text-sm xs:text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
                Experience the future of online betting with cutting-edge technology
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-8">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description:
                    "Real-time betting with instant payouts and seamless gameplay experience powered by advanced algorithms.",
                  gradient: "from-yellow-500 to-orange-500",
                },
                {
                  icon: Shield,
                  title: "Secure & Safe",
                  description:
                    "Military-grade encryption and advanced security measures to protect your funds and personal information.",
                  gradient: "from-green-500 to-emerald-500",
                },
                {
                  icon: Users,
                  title: "Community Driven",
                  description:
                    "Join thousands of players in our vibrant betting community with live chat and tournaments.",
                  gradient: "from-blue-500 to-cyan-500",
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                >
                  <CardContent className="p-4 xs:p-5 sm:p-6 md:p-8 text-center">
                    <div
                      className={`w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${feature.gradient} rounded-lg xs:rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 xs:mb-4 sm:mb-6 group-hover:rotate-12 transition-transform duration-300`}
                    >
                      <feature.icon className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-2 xs:mb-3 sm:mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed text-xs xs:text-sm sm:text-base">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Games Preview */}
        <section className="py-12 xs:py-14 sm:py-16 md:py-24 lg:py-32 relative px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-16 lg:mb-20">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 xs:mb-4 sm:mb-6">
                Featured Games
              </h2>
              <p className="text-gray-400 text-sm xs:text-base sm:text-lg md:text-xl">
                Discover our exciting game collection
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xs:gap-7 sm:gap-8 md:gap-12">
              {/* Aviator Game Card */}
              <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400 transition-all duration-500 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-4 xs:p-5 sm:p-6 md:p-8 lg:p-10">
                  <div className="flex items-center mb-3 xs:mb-4 sm:mb-6">
                    <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg xs:rounded-xl flex items-center justify-center mr-2 xs:mr-3 sm:mr-4">
                      <Plane className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white">Aviator</h3>
                  </div>
                  <p className="text-gray-200 mb-4 xs:mb-5 sm:mb-6 md:mb-8 text-sm xs:text-base sm:text-lg leading-relaxed">
                    Watch the plane soar and cash out before it crashes! The ultimate test of timing and nerve with
                    multipliers up to 1000x.
                  </p>
                  <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                    <div className="bg-white/10 rounded-lg xs:rounded-xl p-2 xs:p-3 sm:p-4 backdrop-blur-sm">
                      <div className="text-xs sm:text-sm text-gray-300 mb-1">Max Multiplier</div>
                      <div className="text-lg xs:text-xl sm:text-2xl font-bold text-green-400">1000.00x</div>
                    </div>
                    <div className="bg-white/10 rounded-lg xs:rounded-xl p-2 xs:p-3 sm:p-4 backdrop-blur-sm">
                      <div className="text-xs sm:text-sm text-gray-300 mb-1">Players Online</div>
                      <div className="text-lg xs:text-xl sm:text-2xl font-bold text-blue-400">1,247</div>
                    </div>
                  </div>
                  <Link href="/games/aviator">
                    <Button className="w-full bg-white text-purple-900 hover:bg-gray-100 py-2.5 xs:py-3 text-sm xs:text-base sm:text-lg font-semibold rounded-lg xs:rounded-xl transition-all duration-300 hover:scale-105">
                      Play Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Sports Betting Card */}
              <Card className="group relative overflow-hidden bg-gradient-to-br from-green-900/50 to-blue-900/50 backdrop-blur-sm border border-green-500/30 hover:border-green-400 transition-all duration-500 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-4 xs:p-5 sm:p-6 md:p-8 lg:p-10">
                  <div className="flex items-center mb-3 xs:mb-4 sm:mb-6">
                    <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg xs:rounded-xl flex items-center justify-center mr-2 xs:mr-3 sm:mr-4">
                      <Trophy className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white">Sports Betting</h3>
                  </div>
                  <p className="text-gray-200 mb-4 xs:mb-5 sm:mb-6 md:mb-8 text-sm xs:text-base sm:text-lg leading-relaxed">
                    Bet on your favorite teams with competitive odds, live match updates, and instant settlements.
                  </p>
                  <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                    <div className="bg-white/10 rounded-lg xs:rounded-xl p-2 xs:p-3 sm:p-4 backdrop-blur-sm">
                      <div className="text-xs sm:text-sm text-gray-300 mb-1">Live Matches</div>
                      <div className="text-lg xs:text-xl sm:text-2xl font-bold text-green-400">24</div>
                    </div>
                    <div className="bg-white/10 rounded-lg xs:rounded-xl p-2 xs:p-3 sm:p-4 backdrop-blur-sm">
                      <div className="text-xs sm:text-sm text-gray-300 mb-1">Best Odds</div>
                      <div className="text-lg xs:text-xl sm:text-2xl font-bold text-yellow-400">98.5%</div>
                    </div>
                  </div>
                  <Link href="/betting">
                    <Button className="w-full bg-blue text-green-900 hover:bg-gray-100 py-2.5 xs:py-3 text-sm xs:text-base sm:text-lg font-semibold rounded-lg xs:rounded-xl transition-all duration-300 hover:scale-105">
                      Bet Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-12 xs:py-14 sm:py-16 md:py-24 lg:py-32 relative px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-16 lg:mb-20">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 xs:mb-4 sm:mb-6">
                What Players Say
              </h2>
              <p className="text-gray-400 text-sm xs:text-base sm:text-lg md:text-xl">
                Join thousands of satisfied players
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-8">
              {[
                {
                  name: "Alex M.",
                  amount: "$12,450",
                  text: "Best Aviator experience ever! The interface is smooth and payouts are instant.",
                },
                {
                  name: "Sarah K.",
                  amount: "$8,920",
                  text: "Love the sports betting section. Great odds and live updates keep me engaged.",
                },
                {
                  name: "Mike R.",
                  amount: "$15,680",
                  text: "Been playing for months. Reliable, secure, and the community is amazing!",
                },
              ].map((testimonial, index) => (
                <Card
                  key={index}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 transition-all duration-300"
                >
                  <CardContent className="p-4 xs:p-5 sm:p-6 md:p-8">
                    <div className="flex items-center mb-3 xs:mb-4">
                      <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2 xs:mr-3 sm:mr-4">
                        <span className="text-white font-bold text-xs xs:text-sm sm:text-base">
                          {testimonial.name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm sm:text-base">{testimonial.name}</div>
                        <div className="text-green-400 text-xs sm:text-sm">Won {testimonial.amount}</div>
                      </div>
                    </div>
                    <p className="text-gray-300 italic text-xs xs:text-sm sm:text-base">`{testimonial.text}`</p>
                    <div className="flex text-yellow-400 mt-3 xs:mt-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 xs:py-14 sm:py-16 md:py-24 lg:py-32 relative px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-xl xs:rounded-2xl sm:rounded-3xl p-6 xs:p-7 sm:p-8 md:p-12 border border-white/10">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 xs:mb-4 sm:mb-6">
                Ready to Start Winning?
              </h2>
              <p className="text-gray-300 text-sm xs:text-base sm:text-lg md:text-xl mb-6 xs:mb-7 sm:mb-8 md:mb-10 leading-relaxed">
                Join Gamble Galaxy today and experience the future of online betting with exclusive bonuses and rewards
              </p>
              <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 sm:gap-6 justify-center">
                <Link href="/auth/register" className="w-full xs:w-auto">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 xs:px-8 sm:px-12 py-2.5 xs:py-3 sm:py-4 text-base xs:text-lg sm:text-xl font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 w-full xs:w-auto">
                    Get Started Now
                  </Button>
                </Link>
                <Link href="/demo" className="w-full xs:w-auto">
                  <Button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 px-6 xs:px-8 sm:px-12 py-2.5 xs:py-3 sm:py-4 text-base xs:text-lg sm:text-xl font-semibold rounded-full transition-all duration-300 hover:scale-105 w-full xs:w-auto">
                    Try Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
