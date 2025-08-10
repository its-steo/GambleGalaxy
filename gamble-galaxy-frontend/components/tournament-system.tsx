"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Users, Clock, Star, Crown } from "lucide-react"

export default function TournamentSystem() {
  const tournaments = [
    {
      id: 1,
      name: "Weekly Football Championship",
      type: "Sports",
      participants: 247,
      maxParticipants: 500,
      prizePool: 10000,
      entryFee: 25,
      status: "active",
      timeLeft: "2d 14h 32m",
    },
    {
      id: 2,
      name: "Aviator Masters",
      type: "Aviator",
      participants: 156,
      maxParticipants: 200,
      prizePool: 5000,
      entryFee: 50,
      status: "upcoming",
      timeLeft: "5d 8h 15m",
    },
    {
      id: 3,
      name: "Mixed Games Tournament",
      type: "Mixed",
      participants: 89,
      maxParticipants: 100,
      prizePool: 2500,
      entryFee: 10,
      status: "active",
      timeLeft: "1d 6h 45m",
    },
  ]

  const leaderboard = [
    { rank: 1, name: "PlayerOne", points: 2450, prize: "$2,500" },
    { rank: 2, name: "BetMaster", points: 2380, prize: "$1,500" },
    { rank: 3, name: "LuckyWinner", points: 2250, prize: "$1,000" },
    { rank: 4, name: "SportsFan", points: 2100, prize: "$500" },
    { rank: 5, name: "GameChanger", points: 1950, prize: "$250" },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Tournament System</h1>
        <p className="text-muted-foreground">Compete with other players and win big prizes</p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {tournaments
            .filter((t) => t.status === "active")
            .map((tournament) => (
              <Card key={tournament.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        {tournament.name}
                      </CardTitle>
                      <CardDescription>{tournament.type} Tournament</CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{tournament.status.toUpperCase()}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <Trophy className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
                      <p className="text-lg font-bold">${tournament.prizePool.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Prize Pool</p>
                    </div>
                    <div className="text-center">
                      <Users className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                      <p className="text-lg font-bold">
                        {tournament.participants}/{tournament.maxParticipants}
                      </p>
                      <p className="text-xs text-muted-foreground">Participants</p>
                    </div>
                    <div className="text-center">
                      <Star className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                      <p className="text-lg font-bold">${tournament.entryFee}</p>
                      <p className="text-xs text-muted-foreground">Entry Fee</p>
                    </div>
                    <div className="text-center">
                      <Clock className="h-6 w-6 mx-auto mb-1 text-red-500" />
                      <p className="text-lg font-bold">{tournament.timeLeft}</p>
                      <p className="text-xs text-muted-foreground">Time Left</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Participants</span>
                      <span>
                        {tournament.participants}/{tournament.maxParticipants}
                      </span>
                    </div>
                    <Progress value={(tournament.participants / tournament.maxParticipants) * 100} />
                  </div>

                  <Button className="w-full">Join Tournament - ${tournament.entryFee}</Button>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {tournaments
            .filter((t) => t.status === "upcoming")
            .map((tournament) => (
              <Card key={tournament.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    {tournament.name}
                  </CardTitle>
                  <CardDescription>Starts in {tournament.timeLeft}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">${tournament.prizePool.toLocaleString()} Prize Pool</p>
                      <p className="text-sm text-muted-foreground">Entry Fee: ${tournament.entryFee}</p>
                    </div>
                    <Button variant="outline">Register</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Current Leaderboard
              </CardTitle>
              <CardDescription>Weekly Football Championship</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((player) => (
                  <div key={player.rank} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          player.rank === 1
                            ? "bg-yellow-500 text-white"
                            : player.rank === 2
                              ? "bg-gray-400 text-white"
                              : player.rank === 3
                                ? "bg-orange-500 text-white"
                                : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {player.rank}
                      </div>
                      <div>
                        <p className="font-semibold">{player.name}</p>
                        <p className="text-sm text-muted-foreground">{player.points} points</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{player.prize}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
