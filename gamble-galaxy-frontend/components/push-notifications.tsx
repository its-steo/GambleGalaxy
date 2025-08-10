"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Bell, BellOff, Settings, Smartphone, Check, X, Clock, Trophy, Zap } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: "bet" | "win" | "promotion" | "system"
  timestamp: Date
  read: boolean
}

export default function PushNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Bet Won!",
      message: "Your bet on Manchester United won! +$125.50",
      type: "win",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
    },
    {
      id: "2",
      title: "New Promotion",
      message: "Weekend Cashback: Get 10% back on all losses",
      type: "promotion",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: false,
    },
    {
      id: "3",
      title: "Aviator Game",
      message: "Your auto-cashout triggered at 2.5x multiplier",
      type: "bet",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      read: true,
    },
    {
      id: "4",
      title: "System Update",
      message: "Platform maintenance completed successfully",
      type: "system",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      read: true,
    },
  ])

  const [settings, setSettings] = useState({
    betUpdates: true,
    winNotifications: true,
    promotions: true,
    systemAlerts: false,
    sound: true,
    vibration: true,
  })

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === "granted") {
        setNotificationsEnabled(true)
        // Send a test notification
        new Notification("BetMaster Pro", {
          body: "Push notifications are now enabled!",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
        })
      }
    }
  }

  const sendTestNotification = () => {
    if (permission === "granted") {
      new Notification("Test Notification", {
        body: "This is a test notification from BetMaster Pro",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      })
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "win":
        return <Trophy className="h-5 w-5 text-green-500" />
      case "bet":
        return <Zap className="h-5 w-5 text-blue-500" />
      case "promotion":
        return <Bell className="h-5 w-5 text-purple-500" />
      case "system":
        return <Settings className="h-5 w-5 text-gray-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Bell className="h-8 w-8" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your notification preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notification Settings */}
        <div className="space-y-6">
          {/* Permission Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Push Notifications
              </CardTitle>
              <CardDescription>Enable browser notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status:</span>
                <Badge variant={permission === "granted" ? "default" : "secondary"}>
                  {permission === "granted" ? "Enabled" : permission === "denied" ? "Blocked" : "Not Set"}
                </Badge>
              </div>

              {permission !== "granted" && (
                <Button onClick={requestPermission} className="w-full">
                  Enable Notifications
                </Button>
              )}

              {permission === "granted" && (
                <div className="space-y-2">
                  <Button onClick={sendTestNotification} variant="outline" className="w-full bg-transparent">
                    Send Test Notification
                  </Button>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications:</span>
                    <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Bet Updates</div>
                  <div className="text-xs text-gray-500">Notifications about your bets</div>
                </div>
                <Switch
                  checked={settings.betUpdates}
                  onCheckedChange={(checked) => setSettings({ ...settings, betUpdates: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Win Notifications</div>
                  <div className="text-xs text-gray-500">Get notified when you win</div>
                </div>
                <Switch
                  checked={settings.winNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, winNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Promotions</div>
                  <div className="text-xs text-gray-500">Special offers and bonuses</div>
                </div>
                <Switch
                  checked={settings.promotions}
                  onCheckedChange={(checked) => setSettings({ ...settings, promotions: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">System Alerts</div>
                  <div className="text-xs text-gray-500">Maintenance and updates</div>
                </div>
                <Switch
                  checked={settings.systemAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, systemAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Sound</div>
                  <div className="text-xs text-gray-500">Play notification sounds</div>
                </div>
                <Switch
                  checked={settings.sound}
                  onCheckedChange={(checked) => setSettings({ ...settings, sound: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Notifications</CardTitle>
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Mark All Read
                </Button>
              </div>
              <CardDescription>Your latest notifications and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <BellOff className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${
                        !notification.read ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{notification.title}</h3>
                              {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{notification.message}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {formatTime(notification.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
