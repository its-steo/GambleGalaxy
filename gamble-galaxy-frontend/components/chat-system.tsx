"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, Users, Crown, Gift, Smile, MoreVertical } from "lucide-react"

interface ChatMessage {
  id: string
  username: string
  message: string
  timestamp: Date
  type: "message" | "system" | "tip"
  userLevel?: number
  amount?: number
}

interface User {
  username: string
  level: number
  isOnline: boolean
}

export default function ChatSystem() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [currentUser] = useState("You")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize with some sample messages
    const sampleMessages: ChatMessage[] = [
      {
        id: "1",
        username: "System",
        message: "Welcome to the community chat! 🎉",
        timestamp: new Date(Date.now() - 300000),
        type: "system",
      },
      {
        id: "2",
        username: "BetKing",
        message: "Just won 5000 on Aviator! 🚀",
        timestamp: new Date(Date.now() - 240000),
        type: "message",
        userLevel: 8,
      },
      {
        id: "3",
        username: "LuckyPlayer",
        message: "Anyone playing the Man U vs Liverpool match?",
        timestamp: new Date(Date.now() - 180000),
        type: "message",
        userLevel: 3,
      },
      {
        id: "4",
        username: "ProGamer",
        message: "Tipped 100 KES to the chat! 💰",
        timestamp: new Date(Date.now() - 120000),
        type: "tip",
        userLevel: 10,
        amount: 100,
      },
      {
        id: "5",
        username: "NewBie",
        message: "How do I play Aviator?",
        timestamp: new Date(Date.now() - 60000),
        type: "message",
        userLevel: 1,
      },
    ]
    setMessages(sampleMessages)

    // Sample online users
    const sampleUsers: User[] = [
      { username: "BetKing", level: 8, isOnline: true },
      { username: "LuckyPlayer", level: 3, isOnline: true },
      { username: "ProGamer", level: 10, isOnline: true },
      { username: "NewBie", level: 1, isOnline: true },
      { username: "SportsFan", level: 5, isOnline: true },
      { username: "AviatorAce", level: 7, isOnline: false },
    ]
    setOnlineUsers(sampleUsers)

    // Simulate new messages
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const randomUsers = ["BetKing", "LuckyPlayer", "SportsFan", "AviatorAce"]
        const randomMessages = [
          "Nice win! 🎉",
          "Anyone else playing?",
          "Good luck everyone!",
          "That was close!",
          "Let's go! 🚀",
          "Betting on the next match",
          "Aviator is on fire today!",
        ]

        const newMsg: ChatMessage = {
          id: Date.now().toString(),
          username: randomUsers[Math.floor(Math.random() * randomUsers.length)],
          message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
          timestamp: new Date(),
          type: "message",
          userLevel: Math.floor(Math.random() * 10) + 1,
        }

        setMessages((prev) => [...prev, newMsg])
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      username: currentUser,
      message: newMessage,
      timestamp: new Date(),
      type: "message",
      userLevel: 5,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  const getLevelBadge = (level: number) => {
    if (level >= 10) return { name: "Diamond", color: "bg-purple-500" }
    if (level >= 7) return { name: "Gold", color: "bg-yellow-500" }
    if (level >= 4) return { name: "Silver", color: "bg-gray-400" }
    return { name: "Bronze", color: "bg-orange-600" }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Community Chat</h1>
        <p className="text-muted-foreground">Connect with other players</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <CardTitle>Live Chat</CardTitle>
                </div>
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {onlineUsers.filter((u) => u.isOnline).length} online
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-3 pb-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-3">
                      {message.type === "system" ? (
                        <div className="w-full text-center">
                          <Badge variant="secondary" className="text-xs">
                            {message.message}
                          </Badge>
                        </div>
                      ) : message.type === "tip" ? (
                        <div className="w-full">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                            <Gift className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                            <p className="text-sm">
                              <span className="font-medium">{message.username}</span> tipped{" "}
                              <span className="font-bold text-yellow-600">KES {message.amount}</span> to the chat!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{message.username[0].toUpperCase()}</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{message.username}</span>
                              {message.userLevel && message.userLevel >= 7 && (
                                <Crown className="h-3 w-3 text-yellow-500" />
                              )}
                              {message.userLevel && (
                                <Badge className={`text-xs ${getLevelBadge(message.userLevel).color} text-white`}>
                                  L{message.userLevel}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                            </div>
                            <p className="text-sm break-words">{message.message}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Online Users */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Online Users</CardTitle>
              <CardDescription>{onlineUsers.filter((u) => u.isOnline).length} players online</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {onlineUsers
                    .filter((user) => user.isOnline)
                    .sort((a, b) => b.level - a.level)
                    .map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{user.username[0].toUpperCase()}</span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          </div>
                          <div>
                            <p className="text-sm font-medium flex items-center space-x-1">
                              <span>{user.username}</span>
                              {user.level >= 7 && <Crown className="h-3 w-3 text-yellow-500" />}
                            </p>
                            <Badge className={`text-xs ${getLevelBadge(user.level).color} text-white`}>
                              Level {user.level}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Actions */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Chat Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Gift className="h-4 w-4 mr-2" />
                Send Tip
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Smile className="h-4 w-4 mr-2" />
                Emojis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
