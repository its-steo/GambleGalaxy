import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plane, Trophy, Zap, Shield, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Gamble Galaxy
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Experience the thrill of next-generation betting with our cutting-edge Aviator game and comprehensive
              sports betting platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/games/aviator">
                <Button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3"
                >
                  <Plane className="w-5 h-5 mr-2" />
                  Play Aviator
                </Button>
              </Link>
              <Link href="/betting">
                <Button
                  variant="outline"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white px-8 py-3 bg-transparent"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Sports Betting
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose Gamble Galaxy?</h2>
            <p className="text-gray-400 text-lg">Experience the future of online betting</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
                <p className="text-gray-400">
                  Real-time betting with instant payouts and seamless gameplay experience.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Secure & Safe</h3>
                <p className="text-gray-400">
                  Advanced security measures to protect your funds and personal information.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Community Driven</h3>
                <p className="text-gray-400">Join thousands of players in our vibrant betting community.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Games Preview */}
      <section className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Featured Games</h2>
            <p className="text-gray-400 text-lg">Discover our exciting game collection</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Aviator Game Card */}
            <Card className="bg-gradient-to-br from-purple-900 to-pink-900 border-purple-500 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Plane className="w-8 h-8 text-white mr-3" />
                  <h3 className="text-2xl font-bold text-white">Aviator</h3>
                </div>
                <p className="text-gray-200 mb-6">
                  Watch the plane soar and cash out before it crashes! The ultimate test of timing and nerve.
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-300">
                    <div>
                      Max Multiplier: <span className="text-green-400 font-bold">50.00x</span>
                    </div>
                    <div>
                      Players Online: <span className="text-blue-400 font-bold">1,247</span>
                    </div>
                  </div>
                  <Link href="/games/aviator">
                    <Button className="bg-white text-purple-900 hover:bg-gray-100">Play Now</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Sports Betting Card */}
            <Card className="bg-gradient-to-br from-green-900 to-blue-900 border-green-500 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Trophy className="w-8 h-8 text-white mr-3" />
                  <h3 className="text-2xl font-bold text-white">Sports Betting</h3>
                </div>
                <p className="text-gray-200 mb-6">
                  Bet on your favorite teams with competitive odds and live match updates.
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-300">
                    <div>
                      Live Matches: <span className="text-green-400 font-bold">12</span>
                    </div>
                    <div>
                      Sure Odds Available: <span className="text-yellow-400 font-bold">Yes</span>
                    </div>
                  </div>
                  <Link href="/betting">
                    <Button className="bg-white text-green-900 hover:bg-gray-100">Bet Now</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Winning?</h2>
          <p className="text-gray-400 text-lg mb-8">
            Join Gamble Galaxy today and experience the future of online betting
          </p>
          <Link href="/auth/register">
            <Button
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-12 py-4 text-lg"
            >
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
