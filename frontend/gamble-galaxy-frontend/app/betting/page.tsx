"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { MatchCard } from "@/components/betting/match-card";
import { BetSlip } from "@/components/betting/bet_slip";
import { SureOddsModal } from "@/components/betting/sure-odds-modal";
import {
  Trophy,
  History,
  Star,
  Search,
  Filter,
} from "lucide-react";
import type { Match, Bet } from "@/lib/types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface BetSlipItem {
  match: Match;
  selectedOption: "home_win" | "draw" | "away_win";
}

export default function BettingPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [betHistory, setBetHistory] = useState<Bet[]>([]);
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, "home_win" | "draw" | "away_win">>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sureOddsOpen, setSureOddsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadMatches();
    if (isAuthenticated) loadBetHistory();
  }, [isAuthenticated]);

  const loadMatches = async () => {
    try {
      const response = await api.getMatches();
      if (response.data) setMatches(response.data);
    } catch {
      toast.error("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const loadBetHistory = async () => {
    try {
      const response = await api.getBetHistory();
      if (response.data) setBetHistory(response.data);
    } catch {
      console.error("Failed to load bet history");
    }
  };

  const handleAddToBetSlip = (match: Match, option: "home_win" | "draw" | "away_win") => {
    const existingIndex = betSlip.findIndex((item) => item.match.id === match.id);

    if (existingIndex >= 0) {
      const updatedSlip = [...betSlip];
      updatedSlip[existingIndex].selectedOption = option;
      setBetSlip(updatedSlip);
    } else {
      setBetSlip([...betSlip, { match, selectedOption: option }]);
    }

    setSelectedOptions((prev) => ({ ...prev, [match.id]: option }));
  };

  const handleRemoveFromBetSlip = (matchId: number) => {
    setBetSlip((prev) => prev.filter((item) => item.match.id !== matchId));
    setSelectedOptions((prev) => {
      const updated = { ...prev };
      delete updated[matchId];
      return updated;
    });
  };

  const handleClearBetSlip = () => {
    setBetSlip([]);
    setSelectedOptions({});
  };

  const filteredMatches = matches.filter((match) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      match.home_team.toLowerCase().includes(search) ||
      match.away_team.toLowerCase().includes(search);
    const matchesStatus = statusFilter === "all" || match.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "won":
        return "bg-green-500";
      case "lost":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            <Trophy className="inline w-10 h-10 mr-2 text-purple-400" />
            Sports Betting
          </h1>
          <p className="text-gray-300 text-md md:text-lg">Bet on your favorite teams with competitive odds</p>
        </div>

        <Tabs defaultValue="matches" className="space-y-6">
          <TabsList className="grid grid-cols-3 bg-gray-800 rounded-lg overflow-hidden">
            <TabsTrigger value="matches"><Trophy className="w-4 h-4 mr-1" />Live Matches</TabsTrigger>
            <TabsTrigger value="history" disabled={!isAuthenticated}><History className="w-4 h-4 mr-1" />My Bets</TabsTrigger>
            <TabsTrigger value="sure-odds" disabled={!isAuthenticated}><Star className="w-4 h-4 mr-1" />Sure Odds</TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search teams..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
                        >
                          <option value="all">All Matches</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="first_half">Live</option>
                          <option value="fulltime">Finished</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onAddToBetSlip={handleAddToBetSlip}
                        selectedOptions={selectedOptions}
                      />
                    ))
                  ) : (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-8 text-center">
                        <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                        <p className="text-gray-400">No matches found</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <BetSlip
                    items={betSlip}
                    onRemoveItem={handleRemoveFromBetSlip}
                    onClearAll={handleClearBetSlip}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  My Betting History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {betHistory.length > 0 ? (
                  <div className="space-y-4">
                    {betHistory.map((bet) => (
                      <div key={bet.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-white font-medium">Bet #{bet.id}</span>
                            <span className={`px-2 py-1 rounded text-xs text-white ${getStatusBadgeColor(bet.status)}`}>
                              {bet.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">KES {parseFloat(bet.amount).toFixed(2)}</div>
                            <div className="text-gray-400 text-sm">Odds: {parseFloat(bet.total_odds).toFixed(2)}</div>
                            {bet.status === "pending" && (
                              <div className="text-yellow-400 text-sm mt-1">
                                Expected Payout: KES {(parseFloat(bet.amount) * parseFloat(bet.total_odds)).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-300">
                          {bet.selections.map((selection, index) => (
                            <div key={index}>
                              {selection.match.home_team} vs {selection.match.away_team} - {selection.selected_option.replace("_", " ")}
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          Placed: {new Date(bet.placed_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No betting history found</p>
                    <p className="text-sm">Place your first bet to see it here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sure-odds">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Sure Odds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Star className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                  <h3 className="text-xl font-bold text-white mb-2">Premium Sure Odds</h3>
                  <p className="text-gray-400 mb-6">Get guaranteed winning predictions from our expert analysts</p>
                  <Button
                    onClick={() => setSureOddsOpen(true)}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    View Sure Odds
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <SureOddsModal isOpen={sureOddsOpen} onClose={() => setSureOddsOpen(false)} />
    </div>
  );
}
