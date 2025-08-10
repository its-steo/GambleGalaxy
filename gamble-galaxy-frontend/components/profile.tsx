"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Shield, CreditCard, Trophy, Star, Edit, Camera, Phone, Mail, MapPin } from "lucide-react"
import { useNotification } from "./notification-system"

interface UserProfile {
  name: string
  email: string
  phone: string
  location: string
  joinDate: string
  verified: boolean
  level: number
  totalBets: number
  totalWins: number
  winRate: number
}

interface NotificationSettings {
  pushNotifications: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  gameUpdates: boolean
  promotions: boolean
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+254712345678",
    location: "Nairobi, Kenya",
    joinDate: "January 2024",
    verified: true,
    level: 5,
    totalBets: 156,
    totalWins: 89,
    winRate: 57.1,
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    gameUpdates: true,
    promotions: true,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(profile)
  const { addNotification } = useNotification()

  useEffect(() => {
    // Load profile from localStorage
    const savedProfile = localStorage.getItem("user_profile")
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile)
      setProfile(parsed)
      setEditForm(parsed)
    }

    const savedNotifications = localStorage.getItem("notification_settings")
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
    }
  }, [])

  const saveProfile = () => {
    setProfile(editForm)
    localStorage.setItem("user_profile", JSON.stringify(editForm))
    setIsEditing(false)

    addNotification({
      type: "success",
      title: "Profile Updated",
      message: "Your profile has been updated successfully",
    })
  }

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    const updated = { ...notifications, [key]: value }
    setNotifications(updated)
    localStorage.setItem("notification_settings", JSON.stringify(updated))

    addNotification({
      type: "info",
      title: "Settings Updated",
      message: "Your notification preferences have been saved",
    })
  }

  const getLevelBadge = (level: number) => {
    if (level >= 10) return { name: "Diamond", color: "bg-purple-500" }
    if (level >= 7) return { name: "Gold", color: "bg-yellow-500" }
    if (level >= 4) return { name: "Silver", color: "bg-gray-400" }
    return { name: "Bronze", color: "bg-orange-600" }
  }

  const levelBadge = getLevelBadge(profile.level)

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
              <Button size="sm" className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                {profile.verified && (
                  <Badge className="bg-green-500">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{profile.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={`${levelBadge.color} text-white`}>
                  <Star className="h-3 w-3 mr-1" />
                  Level {profile.level} - {levelBadge.name}
                </Badge>
                <span className="text-sm text-muted-foreground">Member since {profile.joinDate}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{profile.totalBets}</p>
            <p className="text-sm text-muted-foreground">Total Bets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{profile.totalWins}</p>
            <p className="text-sm text-muted-foreground">Total Wins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 mx-auto mb-2 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">%</span>
            </div>
            <p className="text-2xl font-bold">{profile.winRate}%</p>
            <p className="text-sm text-muted-foreground">Win Rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    ) : (
                      <span>{profile.name}</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    ) : (
                      <span>{profile.email}</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    ) : (
                      <span>{profile.phone}</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      />
                    ) : (
                      <span>{profile.location}</span>
                    )}
                  </div>
                </div>
              </div>
              {isEditing && (
                <div className="flex space-x-2">
                  <Button onClick={saveProfile}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => updateNotificationSetting("pushNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => updateNotificationSetting("emailNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                </div>
                <Switch
                  checked={notifications.smsNotifications}
                  onCheckedChange={(checked) => updateNotificationSetting("smsNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Game Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified about game results</p>
                </div>
                <Switch
                  checked={notifications.gameUpdates}
                  onCheckedChange={(checked) => updateNotificationSetting("gameUpdates", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Promotions</p>
                  <p className="text-sm text-muted-foreground">Receive promotional offers</p>
                </div>
                <Switch
                  checked={notifications.promotions}
                  onCheckedChange={(checked) => updateNotificationSetting("promotions", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Shield className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Phone className="h-4 w-4 mr-2" />
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Payment Methods
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent">
                <User className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
