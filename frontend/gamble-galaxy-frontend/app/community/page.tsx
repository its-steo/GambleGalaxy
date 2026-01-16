"use client"

import { Star, Users, MessageCircle, Heart, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"

export default function CommunityPage() {
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
                  <Users className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 mr-1 xs:mr-1.5 sm:mr-2 text-purple-400" />
                  Join Our Thriving Community
                </div>
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black text-white mb-4 xs:mb-5 sm:mb-6 md:mb-8 leading-tight px-2 xs:px-4">
                Welcome to Our{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse block xs:inline">
                  Community
                </span>
              </h1>

              <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 xs:mb-7 sm:mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed px-2 xs:px-4">
                Connect, share, and grow together in our{" "}
                <span className="text-purple-400 font-semibold">vibrant community space</span> where meaningful
                connections are made every day.
              </p>

              {/* Community Stats */}
              <div className="grid grid-cols-3 gap-2 xs:gap-3 sm:gap-4 lg:gap-6 max-w-4xl mx-auto px-2 xs:px-4">
                {[
                  { label: "Members", value: "2.5K+", icon: Users },
                  { label: "Reviews", value: "850+", icon: Star },
                  { label: "Rating", value: "4.9", icon: Heart },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl p-2 xs:p-3 sm:p-4 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105"
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

        {/* Reviews Section */}
        <section className="py-12 xs:py-14 sm:py-16 md:py-24 lg:py-32 relative px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-16 lg:mb-20">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 xs:mb-4 sm:mb-6">
                What Our Community Says
              </h2>
              <p className="text-gray-400 text-sm xs:text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
                Real stories from our amazing community members
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-8">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Community Member",
                  review:
                    "This community has been incredible! The support and connections I've made here have truly changed my perspective.",
                  rating: 5,
                  gradient: "from-purple-500 to-pink-500",
                },
                {
                  name: "Michael Chen",
                  role: "Active Contributor",
                  review:
                    "Amazing platform for sharing ideas and getting feedback. The community channels make it so easy to stay connected.",
                  rating: 5,
                  gradient: "from-blue-500 to-cyan-500",
                },
                {
                  name: "Emily Rodriguez",
                  role: "New Member",
                  review:
                    "Just joined last month and already feel so welcomed. The variety of discussions and helpful members is outstanding!",
                  rating: 5,
                  gradient: "from-green-500 to-emerald-500",
                },
                {
                  name: "David Park",
                  role: "Long-time Member",
                  review:
                    "Been here for over a year now. The quality of conversations and the genuine care people show for each other is remarkable.",
                  rating: 5,
                  gradient: "from-yellow-500 to-orange-500",
                },
                {
                  name: "Lisa Thompson",
                  role: "Community Moderator",
                  review:
                    "Love being part of this community! The diverse perspectives and collaborative spirit make every day interesting.",
                  rating: 5,
                  gradient: "from-pink-500 to-rose-500",
                },
                {
                  name: "James Wilson",
                  role: "Regular Participant",
                  review:
                    "The community channels are fantastic for quick discussions, and the review system helps maintain quality content.",
                  rating: 5,
                  gradient: "from-indigo-500 to-purple-500",
                },
              ].map((review, index) => (
                <Card
                  key={index}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                >
                  <CardContent className="p-4 xs:p-5 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-r ${review.gradient} rounded-full flex items-center justify-center`}
                      >
                        <span className="text-white font-bold text-sm xs:text-base">{review.name[0]}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm xs:text-base">{review.name}</h3>
                        <p className="text-xs xs:text-sm text-gray-400">{review.role}</p>
                      </div>
                    </div>

                    <div className="flex gap-1 mb-3">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 xs:w-4 xs:h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    <p className="text-gray-300 leading-relaxed text-xs xs:text-sm sm:text-base">{review.review}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Share Your Review */}
            <div className="mt-12 xs:mt-14 sm:mt-16 text-center">
              <Card className="max-w-md mx-auto bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105">
                <CardContent className="p-6 xs:p-7 sm:p-8">
                  <div className="w-12 h-12 xs:w-14 xs:h-14 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 xs:w-7 xs:h-7 text-white" />
                  </div>
                  <h3 className="text-lg xs:text-xl font-bold text-white mb-2">Share Your Experience</h3>
                  <p className="text-gray-400 text-sm xs:text-base mb-4">
                    Help others discover our community by sharing your story
                  </p>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2.5 font-semibold rounded-full transition-all duration-300 hover:scale-105">
                    Write a Review
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Community Channels */}
       <section className="py-12 xs:py-14 sm:py-16 md:py-24 lg:py-32 relative px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-16 lg:mb-20">
             <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 xs:mb-4 sm:mb-6">
               Join Our Community Channels
             </h2>
             <p className="text-gray-400 text-sm xs:text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
               Stay connected through our various communication channels
             </p>
           </div>
       
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-8">
             {/* WhatsApp */}
             <Card className="group relative overflow-hidden bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-sm border border-green-500/30 hover:border-green-400 transition-all duration-500 hover:scale-105">
               <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <CardContent className="relative p-4 xs:p-5 sm:p-6 md:p-8 text-center">
                 <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg xs:rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 xs:mb-4 sm:mb-6 group-hover:rotate-12 transition-transform duration-300">
                   <MessageCircle className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-white" />
                 </div>
                 <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-2 xs:mb-3 sm:mb-4">
                   WhatsApp Group
                 </h3>
                 <p className="text-gray-200 leading-relaxed text-xs xs:text-sm sm:text-base mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                   Join our active WhatsApp community for instant discussions and updates
                 </p>
                 <a
                   href="https://whatsapp.com/channel/0029Vb6NDms002TBLuk3721y"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="block"
                 >
                   <Button className="w-full bg-green-500 text-green-900 hover:bg-green-400 py-2.5 xs:py-3 text-sm xs:text-base sm:text-lg font-semibold rounded-lg xs:rounded-xl transition-all duration-300 hover:scale-105">
                     Join WhatsApp
                     <ExternalLink className="w-4 h-4 ml-2" />
                   </Button>
                 </a>
               </CardContent>
             </Card>
       
             {/* Telegram */}
             <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-sm border border-blue-500/30 hover:border-blue-400 transition-all duration-500 hover:scale-105">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <CardContent className="relative p-4 xs:p-5 sm:p-6 md:p-8 text-center">
                 <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg xs:rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 xs:mb-4 sm:mb-6 group-hover:rotate-12 transition-transform duration-300">
                   <MessageCircle className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-white" />
                 </div>
                 <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-2 xs:mb-3 sm:mb-4">
                   Telegram Channel
                 </h3>
                 <p className="text-gray-200 leading-relaxed text-xs xs:text-sm sm:text-base mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                   Get announcements and participate in structured discussions
                 </p>
                 <a
                   href="https://t.me/+u2YMOpPL0NVhMTc0"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="block"
                 >
                   <Button className="w-full bg-blue-500 text-blue-900 hover:bg-blue-400 py-2.5 xs:py-3 text-sm xs:text-base sm:text-lg font-semibold rounded-lg xs:rounded-xl transition-all duration-300 hover:scale-105">
                     Join Telegram
                     <ExternalLink className="w-4 h-4 ml-2" />
                   </Button>
                 </a>
               </CardContent>
             </Card>
       
             {/* Discord */}
             <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400 transition-all duration-500 hover:scale-105">
               <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <CardContent className="relative p-4 xs:p-5 sm:p-6 md:p-8 text-center">
                 <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg xs:rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 xs:mb-4 sm:mb-6 group-hover:rotate-12 transition-transform duration-300">
                   <Users className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-white" />
                 </div>
                 <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-2 xs:mb-3 sm:mb-4">
                   Discord Server
                 </h3>
                 <p className="text-gray-200 leading-relaxed text-xs xs:text-sm sm:text-base mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                   Voice chats, organized channels, and real-time collaboration
                 </p>
                 <a
                   href="https://discord.gg/75aaV2ZT"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="block"
                 >
                   <Button className="w-full bg-purple-500 text-purple-900 hover:bg-purple-400 py-2.5 xs:py-3 text-sm xs:text-base sm:text-lg font-semibold rounded-lg xs:rounded-xl transition-all duration-300 hover:scale-105">
                     Join Discord
                     <ExternalLink className="w-4 h-4 ml-2" />
                   </Button>
                 </a>
               </CardContent>
             </Card>
           </div>
       
           <div className="mt-12 xs:mt-14 sm:mt-16 text-center">
             <p className="text-gray-400 text-sm xs:text-base">
               Choose the platform that works best for you, or join them all to stay fully connected!
             </p>
           </div>
         </div>
       </section>
       
      </div>
    </div>
  )
}
