// app/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, Trophy, Zap, Shield, Users, Star, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { Particles } from "@/components/particles";
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
      image: "/assets/images/aviator-game5.png",
      alt: "Aviator Game",
      background: "from-purple-900/30 via-pink-900/30 to-blue-900/30",
      cta: "Play Aviator Now",
      ctaLink: "/games/aviator",
    },
    {
      image: "/assets/images/player1.jpg",
      alt: "Player Winning",
      background: "from-green-900/30 via-blue-900/30 to-purple-900/30",
      cta: "Join the Winners",
      ctaLink: "/auth/register",
    },
    {
      image: "/assets/images/aviator-game4.png",
      alt: "Aviator Action",
      background: "from-red-900/30 via-purple-900/30 to-pink-900/30",
      cta: "Try Aviator Demo",
      ctaLink: "/aviator-demo",
    },
    {
      image: "/assets/images/player2.jpg",
      alt: "Excited Player",
      background: "from-blue-900/30 via-pink-900/30 to-purple-900/30",
      cta: "Start Betting",
      ctaLink: "/betting",
    },
    {
      image: "/assets/images/aviator-game3.jpg",
      alt: "Aviator Thrill",
      background: "from-purple-900/30 via-pink-900/30 to-blue-900/30",
      cta: "Play Aviator Now",
      ctaLink: "/games/aviator",
    },
    {
      image: "/assets/images/player3.jpg",
      alt: "Winner Celebration",
      background: "from-red-900/30 via-purple-900/30 to-pink-900/30",
      cta: "Join Now",
      ctaLink: "/auth/register",
    },
    {
      image: "/assets/images/aviator-game2.jpg",
      alt: "Aviator Gameplay",
      background: "from-green-900/30 via-blue-900/30 to-purple-900/30",
      cta: "Try Aviator Demo",
      ctaLink: "/aviator-demo",
    },
    {
      image: "/assets/images/player4.jpg",
      alt: "Player Victory",
      background: "from-blue-900/30 via-pink-900/30 to-purple-900/30",
      cta: "Start Winning",
      ctaLink: "/auth/register",
    },
    {
      image: "/assets/images/player6.jpg",
      alt: "Excited Player",
      background: "from-red-900/30 via-purple-900/30 to-pink-900/30",
      cta: "Join the Action",
      ctaLink: "/auth/register",
    },
  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: true,
    afterChange: (current: number) => setActiveSlide(current),
    //customPaging: (index: number) => (
    //  <div className="w-3 h-3 bg-white/30 rounded-full hover:bg-white/60 transition-all duration-300" />
    //),
    responsive: [
      {
        breakpoint: 1024,
        settings: { arrows: false, dots: true },
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
            className="absolute w-[20vw] h-[20vw] max-w-[200px] max-h-[200px] bg-purple-500/20 rounded-full blur-3xl transition-all duration-1000 ease-out"
            style={{
              left: `calc(${mousePosition.x}px - 10vw)`,
              top: `calc(${mousePosition.y}px - 10vw)`,
            }}
          />
          <div className="absolute top-1/4 left-1/4 w-[15vw] h-[15vw] max-w-[150px] max-h-[150px] bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[15vw] h-[15vw] max-w-[150px] max-h-[150px] bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <Particles />

        <div className="relative z-10">
          {/* Hero Section with Enhanced Carousel */}
          <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto w-full py-8 sm:py-12 lg:py-16">
              {/* Carousel */}
              <div className="mb-8 relative">
                <Slider {...sliderSettings}>
                  {slides.map((slide, index) => (
                    <div key={index} className="px-2">
                      <div className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[80vh] rounded-2xl overflow-hidden">
                        <Image
                          src={slide.image}
                          alt={slide.alt}
                          fill
                          sizes="100vw"
                          className="object-cover object-center"
                          priority={index === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10 flex items-end justify-center pb-6">
                          <Link href={slide.ctaLink}>
                            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-full font-semibold text-sm sm:text-base shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                              {slide.cta}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </Slider>
              </div>

              <div
                className={`text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white mb-4 leading-tight px-4 animate-fade-in">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    Gamble Galaxy
                  </span>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-200 mb-8 max-w-4xl mx-auto leading-relaxed px-4">
                  <span className="font-semibold text-purple-400">Soar to New Heights</span> with Aviator and Bet Big on Your Favorite Sports!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 px-4">
                  <Link href="/games/aviator">
                    <Button className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-base sm:text-lg font-semibold rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 w-full sm:w-auto">
                      <Plane className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
                      Play Aviator
                    </Button>
                  </Link>
                  <Link href="/betting">
                    <Button className="group bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 px-8 py-4 text-base sm:text-lg font-semibold rounded-full shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 w-full sm:w-auto">
                      <Trophy className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
                      Bet on Sports
                    </Button>
                  </Link>
                </div>

                {/* Live Jackpot Ticker */}
                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-md rounded-xl p-4 max-w-3xl mx-auto mb-8 border border-white/20">
                  <div className="flex items-center justify-center gap-2">
                    <DollarSign className="w-6 h-6 text-yellow-400 animate-pulse" />
                    <p className="text-lg sm:text-xl font-semibold text-white">
                      Current Jackpot: <span className="text-yellow-400">$127,894</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 sm:py-24 lg:py-32 relative px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-black/50">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
                  Why Gamble Galaxy?
                </h2>
                <p className="text-gray-300 text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto">
                  Unleash the thrill with cutting-edge betting technology
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: Zap,
                    title: "Blazing Speed",
                    description: "Instant deposits, withdrawals, and bets powered by blockchain.",
                  },
                  {
                    icon: Shield,
                    title: "Safe & Fair",
                    description: "Provably fair games with top-tier encryption.",
                  },
                  {
                    icon: Users,
                    title: "Vibrant Community",
                    description: "Join leaderboards, tournaments, and social betting.",
                  },
                ].map((feature, index) => (
                  <Card
                    key={index}
                    className="group relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 hover:border-purple-400 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="relative p-6">
                      <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                      <p className="text-gray-200 text-base">{feature.description}</p>
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
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
                  Explore Our Games
                </h2>
                <p className="text-gray-300 text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto">
                  Dive into thrilling games and unbeatable odds
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Aviator Card */}
                <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/60 to-pink-900/60 backdrop-blur-md border border-purple-500/40 hover:border-purple-500 transition-all duration-500 hover:scale-105 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="relative p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mr-3">
                        <Plane className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-white">Aviator</h3>
                    </div>
                    <p className="text-gray-200 mb-6 text-lg leading-relaxed">
                      Soar high and cash out before the plane crashes in this heart-pounding game!
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                        <div className="text-sm text-gray-300 mb-1">Max Multiplier</div>
                        <div className="text-2xl font-bold text-purple-400">100x</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                        <div className="text-sm text-gray-300 mb-1">Players Online</div>
                        <div className="text-2xl font-bold text-pink-400">1,234</div>
                      </div>
                    </div>
                    <Link href="/games/aviator">
                      <Button className="w-full bg-purple-700 hover:bg-purple-800 text-white py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105">
                        Play Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Sports Betting Card */}
                <Card className="group relative overflow-hidden bg-gradient-to-br from-green-900/60 to-blue-900/60 backdrop-blur-md border border-green-500/40 hover:border-green-500 transition-all duration-500 hover:scale-105 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/30 to-blue-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="relative p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center mr-3">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-white">Sports Betting</h3>
                    </div>
                    <p className="text-gray-200 mb-6 text-lg leading-relaxed">
                      Bet on your favorite teams with live updates and top odds.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                        <div className="text-sm text-gray-300 mb-1">Live Matches</div>
                        <div className="text-2xl font-bold text-green-400">24</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                        <div className="text-sm text-gray-300 mb-1">Best Odds</div>
                        <div className="text-2xl font-bold text-yellow-400">98.5%</div>
                      </div>
                    </div>
                    <Link href="/betting">
                      <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105">
                        Bet Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Recent Winners Section */}
          <section className="py-16 sm:py-24 lg:py-32 relative px-4 sm:px-6 lg:px-8 bg-gradient-to-t from-transparent to-black/50">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
                  Recent Winners
                </h2>
                <p className="text-gray-300 text-lg sm:text-xl md:text-2xl">
                  Join the ranks of our lucky winners!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    name: "Alex M.",
                    amount: "$12,450",
                    game: "Aviator",
                    time: "2 hours ago",
                  },
                  {
                    name: "Sarah K.",
                    amount: "$8,920",
                    game: "Sports Betting",
                    time: "4 hours ago",
                  },
                  {
                    name: "Mike R.",
                    amount: "$15,680",
                    game: "Aviator",
                    time: "6 hours ago",
                  },
                ].map((winner, index) => (
                  <Card
                    key={index}
                    className="bg-white/10 backdrop-blur-md border border-white/20 hover:border-yellow-400 transition-all duration-300 shadow-lg"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-base">{winner.name[0]}</span>
                        </div>
                        <div>
                          <div className="text-white font-semibold text-lg">{winner.name}</div>
                          <div className="text-yellow-400 text-sm">Won {winner.amount} in {winner.game}</div>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">{winner.time}</p>
                      <div className="flex text-yellow-400 mt-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-current" />
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
              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
                  Ready to Win Big?
                </h2>
                <p className="text-gray-200 text-lg sm:text-xl md:text-2xl mb-8 leading-relaxed">
                  Join Gamble Galaxy now and claim your exclusive welcome bonus!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/register">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 w-full sm:w-auto">
                      Sign Up Now
                    </Button>
                  </Link>
                  <Link href="/aviator-demo">
                    <Button className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 w-full sm:w-auto">
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