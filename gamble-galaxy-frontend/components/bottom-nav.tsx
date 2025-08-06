"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Trophy,
  Zap,
  Wallet,
  User,
  BarChart3,
  MessageCircle,
  Bell,
  CreditCard,
  Shield,
  Settings,
} from "lucide-react"

interface BottomNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const navItems = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "sports", label: "Sports", icon: Trophy },
    { id: "aviator", label: "Aviator", icon: Zap },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "profile", label: "Profile", icon: User },
  ]

  const secondaryItems = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 3 },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "tournaments", label: "Tournaments", icon: Trophy },
    { id: "security", label: "Security", icon: Shield },
    { id: "admin", label: "Admin", icon: Settings },
  ]

  return (
    <>
      {/* Primary Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col h-auto py-2 px-3 min-w-0"
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs truncate">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Navigation (Drawer/Menu) */}
      <div className="fixed top-20 right-4 z-40">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border rounded-lg shadow-lg p-2 space-y-1">
          {secondaryItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(item.id)}
              className="w-full justify-start relative"
            >
              <item.icon className="h-4 w-4 mr-2" />
              <span className="text-xs">{item.label}</span>
              {item.badge && (
                <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 text-xs">
                  {item.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    </>
  )
}
