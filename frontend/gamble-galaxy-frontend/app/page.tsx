"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, Trophy, Zap, Shield, Users, Star, TrendingUp, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/themes/theme-provider";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const slides = [
    {
      image: "/assets/images/aviator-game3.jpg", // Replace with actual Aviator game image
      alt: "Aviator Game",
      background: "from-purple-900/20 via-pink-900/20 to-blue-900/20",
    },
    {
      image: "/assets/images/player1.jpg", // Replace with actual player image
      alt: "Player Winning",
      background: "from-green-900/20 via-blue-900/20 to-purple-900/20",
    },
    {
      image: "/assets/images/player2.jpg", // Replace with actual player image
      alt: "Excited Player",
      background: "from-red-900/20 via-purple-900/20 to-pink-900/20",
    },
    {
      image: "/assets/images/aviator-game2.jpg", // Replace with actual player image
      alt: "Excited Player",
      background: "from-red-900/20 via-purple-900/20 to-pink-900/20",
    },
    {
      image: "/assets/images/player3.jpg", // Replace with actual player image
      alt: "Excited Player",
      background: "from-red-900/20 via-purple-900/20 to-pink-900/20",
    },
      {
      image: "/assets/images/aviator-game3.jpg", // Replace with actual Aviator game image
      alt: "Aviator Game",
      background: "from-purple-900/20 via-pink-900/20 to-blue-900/20",
    },
    {
      image: "/assets/images/player4.jpg", // Replace with actual player image
      alt: "Excited Player",
      background: "from-red-900/20 via-purple-900/20 to-pink-900/20",
    },
     {
      image: "/assets/images/player6.jpg", // Replace with actual player image
      alt: "Excited Player",
      background: "from-red-900/20 via-purple-900/20 to-pink-900/20",
    },
  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    afterChange: (current: number) => setActiveSlide(current),
    responsive: [
      {
        breakpoint: 1024,
        settings: { arrows: false },
      },
      {
        breakpoint: 640,
        settings: { arrows: false, dots: true },
      },
    ],
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-black overflow-hidden relative">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
          <div
            className={`absolute inset-0 bg-gradient-to-br transition-all duration-1000 ${slides[activeSlide].background}`}
          />
          <div
            className="absolute w-[20vw] h-[20vw] max-w-[200px] max-h-[200px] bg-purple-500/10 rounded-full blur-3xl transition-all duration-1000 ease-out"
            style={{
              left: `calc(${mousePosition.x}px - 10vw)`,
              top: `calc(${mousePosition.y}px - 10vw)`,
            }}
          />
          <div className="absolute top-1/4 left-1/4 w-[15vw] h-[15vw] max-w-[150px] max-h-[150px] bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[15vw] h-[15vw] max-w-[150px] max-h-[150px] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Floating Particles */}
        <div className="fixed inset-0 z-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-[0.5vw] h-[0.5vw] max-w-[4px] max-h-[4px] bg-white/20 rounded-full animate-pulse"
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
          {/* Hero Section with Carousel */}
          <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto w-full py-8 sm:py-12 lg:py-16">
              {/* Carousel */}
              <div className="mb-8">
                <Slider {...sliderSettings}>
                  {slides.map((slide, index) => (
                    <div key={index} className="px-2">
                      <div className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] rounded-2xl overflow-hidden">
                        <img
                          src={slide.image}
                          alt={slide.alt}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                    </div>
                  ))}
                </Slider>
              </div>

              <div
                className={`text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              >
                <div className="mb-6">
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm mb-4">
                    <Star className="w-4 h-4 mr-2 text-yellow-400" />
                    #1 Rated Betting Platform
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-6 leading-tight px-4">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse block sm:inline">
                    Gamble Galaxy
                  </span>
                </h1>

                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed px-4">
                  Experience the <span className="text-purple-400 font-semibold">ultimate thrill</span> of next-generation
                  betting with our cutting-edge Aviator game and comprehensive sports betting platform.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 px-4">
                  <Link href="/games/aviator" className="w-full sm:w-auto">
                    <Button className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-base font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 w-full sm:w-auto">
                      <Plane className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                      Play Aviator
                    </Button>
                  </Link>
                  <Link href="/betting" className="w-full sm:w-auto">
                    <Button className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 px-8 py-3 text-base font-semibold rounded-full shadow-2xl hover:shadow-white/10 transition-all duration-300 hover:scale-105 w-full sm:w-auto">
                      <Trophy className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                      Sports Betting
                    </Button>
                  </Link>
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto px-4">
                  {[
                    { label: "Active Players", value: "12,847", icon: Users },
                    { label: "Games Played", value: "2.4M+", icon: Plane },
                    { label: "Total Winnings", value: "$45.2M", icon: TrendingUp },
                    { label: "Avg Payout", value: "2.3x", icon: Award },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                    >
                      <stat.icon className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-lg md:text-xl font-bold text-white">{stat.value}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 sm:py-24 lg:py-32 relative px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                  Why Choose Gamble Galaxy?
                </h2>
                <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
                  Experience the future of online betting with cutting-edge technology
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: Zap,
                    title: "Lightning Fast",
                    description: "Instant deposits, withdrawals, and bet settlements powered by blockchain technology.",
                  },
                  {
                    icon: Shield,
                    title: "Secure & Fair",
                    description: "Provably fair games with end-to-end encryption and transparent algorithms.",
                  },
                  {
                    icon: Users,
                    title: "Community Driven",
                    description: "Join tournaments, leaderboards, and social betting with friends.",
                  },
                ].map((feature, index) => (
                  <Card
                    key={index}
                    className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="relative p-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="w-6 h-6 text-purple-300" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                      <p className="text-gray-300 text-base">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Games Section */}
          <section className="py-16 sm:py-24 lg:py-32 relative px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                  Popular Games
                </h2>
                <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
                  Dive into our exciting selection of games and betting options
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Aviator Card */}
                <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400 transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="relative p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
                        <Plane className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Aviator</h3>
                    </div>
                    <p className="text-gray-200 mb-6 text-base leading-relaxed">
                      Watch your multiplier soar! Cash out before the plane flies away in this thrilling crash game.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <div className="text-sm text-gray-300 mb-1">Max Multiplier</div>
                        <div className="text-xl font-bold text-purple-400">100x</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <div className="text-sm text-gray-300 mb-1">Players Online</div>
                        <div className="text-xl font-bold text-pink-400">1,234</div>
                      </div>
                    </div>
                    <Link href="/games/aviator">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-base font-semibold rounded-xl transition-all duration-300 hover:scale-105">
                        Play Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Sports Betting Card */}
                <Card className="group relative overflow-hidden bg-gradient-to-br from-green-900/50 to-blue-900/50 backdrop-blur-sm border border-green-500/30 hover:border-green-400 transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="relative p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mr-3">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Sports Betting</h3>
                    </div>
                    <p className="text-gray-200 mb-6 text-base leading-relaxed">
                      Bet on your favorite teams with competitive odds, live match updates, and instant settlements.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <div className="text-sm text-gray-300 mb-1">Live Matches</div>
                        <div className="text-xl font-bold text-green-400">24</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <div className="text-sm text-gray-300 mb-1">Best Odds</div>
                        <div className="text-xl font-bold text-yellow-400">98.5%</div>
                      </div>
                    </div>
                    <Link href="/betting">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold rounded-xl transition-all duration-300 hover:scale-105">
                        Bet Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-16 sm:py-24 lg:py-32 relative px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                  What Players Say
                </h2>
                <p className="text-gray-400 text-base sm:text-lg md:text-xl">
                  Join thousands of satisfied players
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">{testimonial.name[0]}</span>
                        </div>
                        <div>
                          <div className="text-white font-semibold text-base">{testimonial.name}</div>
                          <div className="text-green-400 text-sm">Won {testimonial.amount}</div>
                        </div>
                      </div>
                      <p className="text-gray-300 italic text-base">{`"${testimonial.text}"`}</p>
                      <div className="flex text-yellow-400 mt-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 sm:py-24 lg:py-32 relative px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                  Ready to Start Winning?
                </h2>
                <p className="text-gray-300 text-base sm:text-lg md:text-xl mb-8 leading-relaxed">
                  Join Gamble Galaxy today and experience the future of online betting with exclusive bonuses and rewards
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/register" className="w-full sm:w-auto">
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-base font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 w-full sm:w-auto">
                      Get Started Now
                    </Button>
                  </Link>
                  <Link href="/aviator-demo" className="w-full sm:w-auto">
                    <Button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 px-8 py-3 text-base font-semibold rounded-full transition-all duration-300 hover:scale-105 w-full sm:w-auto">
                      Try Demo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ThemeProvider>
  );
}