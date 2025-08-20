
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { toast } from "react-hot-toast";
import { Trophy } from "lucide-react";
import { api } from "@/lib/api";
//import type { TopWinner } from "@/lib/types";

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar?: string;
  winnings: number;
}

export default function LeaderboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleMouseMove = (e: MouseEvent) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }, 16);
    };

    if (!("ontouchstart" in window)) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      console.log("[v0] Fetching top winners...");
      const response = await api.getTopWinners();
      console.log("[v0] Top winners data received:", response);

      if (!response.data) {
        throw new Error(response.error || "Failed to load top winners");
      }

      // Map TopWinner to LeaderboardEntry
      const leaderboardData: LeaderboardEntry[] = response.data.map((winner, index) => ({
      rank: index + 1,
      username: winner.username ?? "Unknown",   // fallback so it's never undefined
      avatar: winner.avatar ?? undefined,
      winnings: Number(winner.win_amount ?? winner.amount ?? 0), // always number
    }));
    

      setLeaderboard(leaderboardData);
      setLoading(false);
    } catch (error) {
      console.error("[v0] Error fetching top winners:", error);
      toast.error("Failed to load leaderboard data");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchLeaderboard();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
          <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-36 h-36 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 text-center max-w-sm mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-4 sm:mb-6"></div>
          <p className="text-white text-lg sm:text-xl font-semibold mb-2">Loading Leaderboard...</p>
          <p className="text-gray-400 text-sm sm:text-base">Fetching top players</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
        </div>
        <div className="relative z-10 text-center max-w-md mx-auto">
          <h2 className="text-white text-xl sm:text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400 text-sm sm:text-base mb-6">Please log in to view the leaderboard</p>
        </div>
      </div>
    );
  }

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
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-2 leading-tight">
              Leaderboard{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Top Players
              </span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg">See who’s dominating the game</p>
          </div>
        </div>

        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-lg sm:text-xl">
              <Trophy className="w-5 h-5 mr-3 text-yellow-400" />
              Top Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 px-4 text-white font-semibold text-sm sm:text-base">Rank</th>
                    <th className="py-3 px-4 text-white font-semibold text-sm sm:text-base">Player</th>
                    <th className="py-3 px-4 text-white font-semibold text-sm sm:text-base">Winnings</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr
                      key={entry.rank}
                      className="border-b border-white/10 hover:bg-white/10 transition-colors duration-200"
                    >
                      <td className="py-3 px-4 text-white">
                        <span className="flex items-center">
                          {entry.rank === 1 && <Trophy className="w-5 h-5 text-yellow-400 mr-2" />}
                          {entry.rank === 2 && <Trophy className="w-5 h-5 text-gray-400 mr-2" />}
                          {entry.rank === 3 && <Trophy className="w-5 h-5 text-amber-600 mr-2" />}
                          {entry.rank > 3 && entry.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                          {entry.avatar ? (
                            <Image
                              src={entry.avatar}
                              alt={`${entry.username}'s avatar`}
                              width={32}
                              height={32}
                              className="w-full h-full rounded-full object-cover"
                              unoptimized
                            />
                          ) : (
                            entry.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-sm sm:text-base">{entry.username}</span>
                      </td>
                      <td className="py-3 px-4 text-green-400">
                        KES {entry.winnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {leaderboard.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                No top winners available at the moment.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
