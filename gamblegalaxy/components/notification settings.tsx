"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Mail, Smartphone, Volume2, Trophy, Wallet, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NotificationPreferences {
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  bet_updates: boolean
  win_notifications: boolean
  deposit_confirmations: boolean
  withdrawal_updates: boolean
  security_alerts: boolean
  promotional_offers: boolean
  game_updates: boolean
  sure_odds_alerts: boolean
}

export default function NotificationSettings() {
  const { token } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    marketing_emails: false,
    bet_updates: true,
    win_notifications: true,
    deposit_confirmations: true,
    withdrawal_updates: true,
    security_alerts: true,
    promotional_offers: false,
    game_updates: true,
    sure_odds_alerts: true,
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/profile/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error)
    }
  }

  const updatePreferences = async (key: keyof NotificationPreferences, value: boolean) => {
    const updatedPreferences = { ...preferences, [key]: value }
    setPreferences(updatedPreferences)

    try {
      const response = await fetch("/api/profile/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedPreferences),
      })

      if (response.ok) {
        toast({
          title: "Settings Updated",
          description: "Your notification preferences have been saved",
        })
      } else {
        // Revert on error
        setPreferences(preferences)
        toast({
          title: "Update Failed",
          description: "Failed to update notification settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Revert on error
      setPreferences(preferences)
      toast({
        title: "Error",
        description: "An error occurred while updating settings",
        variant: "destructive",
      })
    }
  }

  const testNotification = async (type: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/profile/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      })

      if (response.ok) {
        toast({
          title: "Test Notification Sent! 🔔",
          description: `Check your ${type} for the test notification`,
        })
      } else {
        toast({
          title: "Test Failed",
          description: "Failed to send test notification",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while sending test notification",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Notification Channels */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Bell className="w-5 h-5 mr-2 text-blue-400" />
            Notification Channels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-400">Choose how you want to receive notifications from Gamble Galaxy.</p>

          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 glass rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-gray-400 text-sm">Receive notifications via email</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => testNotification("email")}
                  disabled={loading || !preferences.email_notifications}
                  variant="outline"
                  size="sm"
                  className="glass-button bg-transparent"
                >
                  Test
                </Button>
                <Switch
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) => updatePreferences("email_notifications", checked)}
                />
              </div>
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between p-4 glass rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">SMS Notifications</p>
                  <p className="text-gray-400 text-sm">Receive notifications via SMS</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => testNotification("sms")}
                  disabled={loading || !preferences.sms_notifications}
                  variant="outline"
                  size="sm"
                  className="glass-button bg-transparent"
                >
                  Test
                </Button>
                <Switch
                  checked={preferences.sms_notifications}
                  onCheckedChange={(checked) => updatePreferences("sms_notifications", checked)}
                />
              </div>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-4 glass rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-gray-400 text-sm">Receive browser push notifications</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => testNotification("push")}
                  disabled={loading || !preferences.push_notifications}
                  variant="outline"
                  size="sm"
                  className="glass-button bg-transparent"
                >
                  Test
                </Button>
                <Switch
                  checked={preferences.push_notifications}
                  onCheckedChange={(checked) => updatePreferences("push_notifications", checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Betting & Gaming Notifications */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
            Betting & Gaming
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bet_updates" className="text-white font-medium">
                  Bet Updates
                </Label>
                <p className="text-gray-400 text-sm">Get notified about your bet status changes</p>
              </div>
              <Switch
                id="bet_updates"
                checked={preferences.bet_updates}
                onCheckedChange={(checked) => updatePreferences("bet_updates", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="win_notifications" className="text-white font-medium">
                  Win Notifications
                </Label>
                <p className="text-gray-400 text-sm">Celebrate your wins with instant notifications</p>
              </div>
              <Switch
                id="win_notifications"
                checked={preferences.win_notifications}
                onCheckedChange={(checked) => updatePreferences("win_notifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="game_updates" className="text-white font-medium">
                  Game Updates
                </Label>
                <p className="text-gray-400 text-sm">New games, features, and updates</p>
              </div>
              <Switch
                id="game_updates"
                checked={preferences.game_updates}
                onCheckedChange={(checked) => updatePreferences("game_updates", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sure_odds_alerts" className="text-white font-medium">
                  Sure Odds Alerts
                </Label>
                <p className="text-gray-400 text-sm">Get notified when new sure odds are available</p>
              </div>
              <Switch
                id="sure_odds_alerts"
                checked={preferences.sure_odds_alerts}
                onCheckedChange={(checked) => updatePreferences("sure_odds_alerts", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Notifications */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-green-400" />
            Financial Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="deposit_confirmations" className="text-white font-medium">
                  Deposit Confirmations
                </Label>
                <p className="text-gray-400 text-sm">Confirm successful deposits to your wallet</p>
              </div>
              <Switch
                id="deposit_confirmations"
                checked={preferences.deposit_confirmations}
                onCheckedChange={(checked) => updatePreferences("deposit_confirmations", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="withdrawal_updates" className="text-white font-medium">
                  Withdrawal Updates
                </Label>
                <p className="text-gray-400 text-sm">Track your withdrawal requests and completions</p>
              </div>
              <Switch
                id="withdrawal_updates"
                checked={preferences.withdrawal_updates}
                onCheckedChange={(checked) => updatePreferences("withdrawal_updates", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Marketing */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
            Security & Marketing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="security_alerts" className="text-white font-medium">
                  Security Alerts
                </Label>
                <p className="text-gray-400 text-sm">Important security notifications (recommended)</p>
              </div>
              <Switch
                id="security_alerts"
                checked={preferences.security_alerts}
                onCheckedChange={(checked) => updatePreferences("security_alerts", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="promotional_offers" className="text-white font-medium">
                  Promotional Offers
                </Label>
                <p className="text-gray-400 text-sm">Special bonuses, promotions, and exclusive offers</p>
              </div>
              <Switch
                id="promotional_offers"
                checked={preferences.promotional_offers}
                onCheckedChange={(checked) => updatePreferences("promotional_offers", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing_emails" className="text-white font-medium">
                  Marketing Emails
                </Label>
                <p className="text-gray-400 text-sm">Newsletter and marketing communications</p>
              </div>
              <Switch
                id="marketing_emails"
                checked={preferences.marketing_emails}
                onCheckedChange={(checked) => updatePreferences("marketing_emails", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              Object.keys(preferences).forEach((key) => {
                updatePreferences(key as keyof NotificationPreferences, true)
              })
            }}
            variant="outline"
            className="glass-button bg-transparent"
          >
            Enable All
          </Button>
          <Button
            onClick={() => {
              Object.keys(preferences).forEach((key) => {
                if (key !== "security_alerts") {
                  updatePreferences(key as keyof NotificationPreferences, false)
                }
              })
            }}
            variant="outline"
            className="glass-button bg-transparent"
          >
            Disable All (Keep Security)
          </Button>
          <Button
            onClick={() => {
              const essentials = ["security_alerts", "deposit_confirmations", "withdrawal_updates", "win_notifications"]
              Object.keys(preferences).forEach((key) => {
                updatePreferences(key as keyof NotificationPreferences, essentials.includes(key))
              })
            }}
            variant="outline"
            className="glass-button bg-transparent"
          >
            Essential Only
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
