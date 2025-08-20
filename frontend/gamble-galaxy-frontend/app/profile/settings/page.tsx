"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Settings,
  Shield,
  Bell,
  Wallet,
  Eye,
  Plane,
  Trophy,
  Phone,
  Mail,
  Lock,
  Camera,
  Save,
  AlertTriangle,
  Volume2,
  VolumeX,
  Smartphone,
  Globe,
  CreditCard,
  Key,
  UserCheck,
  Gamepad2,
  Target,
  RefreshCcw,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import { api } from "@/lib/api";

interface UserSettings {
  username: string;
  email: string;
  phone: string;
  avatar: string;
  aviatorAutoPlay: boolean;
  aviatorAutoCashOut: boolean;
  aviatorCashOutMultiplier: number;
  aviatorSoundEnabled: boolean;
  sportsOddsFormat: "decimal" | "fractional" | "american";
  sportsFavoriteSports: string[];
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  gameNotifications: boolean;
  promotionNotifications: boolean;
  profileVisibility: "public" | "private";
  showWinnings: boolean;
  showActivity: boolean;
}

export default function ProfileSettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { balance, isLoading: walletLoading, refreshBalance } = useWallet();
  const [settings, setSettings] = useState<UserSettings>({
    username: "",
    email: "",
    phone: "",
    avatar: "",
    aviatorAutoPlay: false,
    aviatorAutoCashOut: false,
    aviatorCashOutMultiplier: 2.0,
    aviatorSoundEnabled: true,
    sportsOddsFormat: "decimal",
    sportsFavoriteSports: [],
    twoFactorEnabled: false,
    loginNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    gameNotifications: true,
    promotionNotifications: false,
    profileVisibility: "public",
    showWinnings: true,
    showActivity: true,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const fetchUserProfile = async () => {
    try {
      console.log("[v0] Fetching user profile data...");
      const response = await api.getProfile();
      console.log("[v0] Profile data received:", response);

      if (!response.data) {
        throw new Error(response.error || "Failed to load profile data");
      }

      const { username = "", email = "", phone = "", avatar = "" } = response.data;
      setSettings((prev) => ({
        ...prev,
        username,
        email,
        phone,
        avatar,
      }));
      setLoading(false);
    } catch (error) {
      console.error("[v0] Error fetching profile:", error);
      toast.error("Failed to load profile data");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      fetchUserProfile();
      refreshBalance();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [user, isAuthenticated, authLoading, refreshBalance]);

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log("[v0] Saving settings:", settings);

      if (!settings.username || settings.username.length < 3) {
        throw new Error("Username must be at least 3 characters");
      }
      if (!settings.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
        throw new Error("Invalid email address");
      }
      if (settings.phone && !/^\+?\d{9,15}$/.test(settings.phone)) {
        throw new Error("Invalid phone number");
      }

      const profileUpdateData = {
        username: settings.username,
        email: settings.email,
        phone: settings.phone,
        avatar: settings.avatar,
      };
      const response = await api.updateProfile(profileUpdateData);
      if (!response.data) {
        throw new Error(response.error || "Failed to update profile");
      }

      if (avatarFile) {
        const uploadResponse = await api.uploadAvatar(avatarFile);
        if (!uploadResponse.data) {
          throw new Error(uploadResponse.error || "Failed to upload avatar");
        }
        const { avatar = "" } = uploadResponse.data;
        setSettings((prev) => ({ ...prev, avatar }));
        setAvatarFile(null);
        toast.success("Avatar uploaded successfully!");
      }

      console.log("[v0] Game/Notification/Privacy settings to be saved in future:", {
        aviatorAutoPlay: settings.aviatorAutoPlay,
        aviatorAutoCashOut: settings.aviatorAutoCashOut,
        aviatorCashOutMultiplier: settings.aviatorCashOutMultiplier,
        aviatorSoundEnabled: settings.aviatorSoundEnabled,
        sportsOddsFormat: settings.sportsOddsFormat,
        sportsFavoriteSports: settings.sportsFavoriteSports,
        twoFactorEnabled: settings.twoFactorEnabled,
        loginNotifications: settings.loginNotifications,
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        pushNotifications: settings.pushNotifications,
        gameNotifications: settings.gameNotifications,
        promotionNotifications: settings.promotionNotifications,
        profileVisibility: settings.profileVisibility,
        showWinnings: settings.showWinnings,
        showActivity: settings.showActivity,
      });

      toast.success("Profile updated successfully!");
      useAuth.getState().loadUser();
    } catch (error: unknown) {
      console.error("[v0] Error saving settings:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save settings. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setSettings((prev) => ({ ...prev, avatar: URL.createObjectURL(file) }));
    }
  };

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
          <p className="text-white text-lg sm:text-xl font-semibold mb-2">Loading Settings...</p>
          <p className="text-gray-400 text-sm sm:text-base">Preparing your preferences</p>
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
          <p className="text-gray-400 text-sm sm:text-base mb-6">Please log in to access your settings</p>
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
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 lg:mb-12">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-2 leading-tight">
              Profile{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Settings
              </span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg">Customize your gaming experience</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1 flex flex-wrap gap-1 sm:grid sm:grid-cols-3 md:grid-cols-5 w-full max-w-4xl overflow-x-auto">
              <TabsTrigger
                value="account"
                className="flex-1 min-w-[80px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg px-2 py-1 sm:px-3 sm:py-2 transition-all duration-300 text-xs sm:text-sm"
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
              <TabsTrigger
                value="games"
                className="flex-1 min-w-[80px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg px-2 py-1 sm:px-3 sm:py-2 transition-all duration-300 text-xs sm:text-sm"
              >
                <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Games</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex-1 min-w-[80px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg px-2 py-1 sm:px-3 sm:py-2 transition-all duration-300 text-xs sm:text-sm"
              >
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex-1 min-w-[80px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg px-2 py-1 sm:px-3 sm:py-2 transition-all duration-300 text-xs sm:text-sm"
              >
                <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                className="flex-1 min-w-[80px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg px-2 py-1 sm:px-3 sm:py-2 transition-all duration-300 text-xs sm:text-sm"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="account">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                    <User className="w-5 h-5 mr-3 text-purple-400" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                        {settings.avatar ? (
                          <Image
                            src={settings.avatar}
                            alt="Avatar"
                            width={80}
                            height={80}
                            className="w-full h-full rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          settings.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <button
                        onClick={() => document.getElementById("avatar-upload")?.click()}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
                      >
                        <Camera className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Profile Picture</h3>
                      <p className="text-gray-400 text-sm">Click the camera icon to upload</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username" className="text-white mb-2 block">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={settings.username}
                        onChange={(e) => setSettings((prev) => ({ ...prev, username: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                        placeholder="Enter your username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-white mb-2 block">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings((prev) => ({ ...prev, email: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-white mb-2 block">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={settings.phone}
                        onChange={(e) => setSettings((prev) => ({ ...prev, phone: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                    <Wallet className="w-5 h-5 mr-3 text-green-400" />
                    Wallet Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Current Balance</span>
                      <span className="text-green-400 font-bold text-xl">
                        {walletLoading ? "Loading..." : `KES ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">Your available gaming balance</p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={refreshBalance}
                      disabled={walletLoading}
                      variant="outline"
                      className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    >
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      {walletLoading ? "Refreshing..." : "Refresh Balance"}
                    </Button>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">Auto-deposit</p>
                          <p className="text-gray-400 text-sm">Automatically add funds when low</p>
                        </div>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="text-white font-medium">Low balance alerts</p>
                          <p className="text-gray-400 text-sm">Get notified when balance is low</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="games">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                    <Plane className="w-5 h-5 mr-3 text-red-400" />
                    Aviator Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <Plane className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Auto Play</p>
                        <p className="text-gray-400 text-sm">Automatically place bets</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.aviatorAutoPlay}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, aviatorAutoPlay: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Auto Cash Out</p>
                        <p className="text-gray-400 text-sm">Automatically cash out at multiplier</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.aviatorAutoCashOut}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, aviatorAutoCashOut: checked }))}
                    />
                  </div>

                  {settings.aviatorAutoCashOut && (
                    <div>
                      <Label htmlFor="cashout-multiplier" className="text-white mb-2 block">
                        Cash Out Multiplier
                      </Label>
                      <Input
                        id="cashout-multiplier"
                        type="number"
                        step="0.1"
                        min="1.1"
                        max="100"
                        value={settings.aviatorCashOutMultiplier}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            aviatorCashOutMultiplier: Number.parseFloat(e.target.value),
                          }))
                        }
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                        placeholder="2.0"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {settings.aviatorSoundEnabled ? (
                        <Volume2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <p className="text-white font-medium">Sound Effects</p>
                        <p className="text-gray-400 text-sm">Game sounds and notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.aviatorSoundEnabled}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, aviatorSoundEnabled: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                    <Trophy className="w-5 h-5 mr-3 text-yellow-400" />
                    Sports Betting Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="odds-format" className="text-white mb-2 block">
                      Odds Format
                    </Label>
                    <select
                      id="odds-format"
                      value={settings.sportsOddsFormat}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          sportsOddsFormat: e.target.value as "decimal" | "fractional" | "american",
                        }))
                      }
                      className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="decimal" className="bg-gray-800">
                        Decimal (2.50)
                      </option>
                      <option value="fractional" className="bg-gray-800">
                        Fractional (3/2)
                      </option>
                      <option value="american" className="bg-gray-800">
                        American (+150)
                      </option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-white mb-3 block">Favorite Sports</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Football", "Basketball", "Tennis", "Cricket", "Rugby", "Boxing"].map((sport) => (
                        <label
                          key={sport}
                          className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={settings.sportsFavoriteSports.includes(sport)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSettings((prev) => ({
                                  ...prev,
                                  sportsFavoriteSports: [...prev.sportsFavoriteSports, sport],
                                }));
                              } else {
                                setSettings((prev) => ({
                                  ...prev,
                                  sportsFavoriteSports: prev.sportsFavoriteSports.filter((s) => s !== sport),
                                }));
                              }
                            }}
                            className="rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500"
                          />
                          <span className="text-white text-sm">{sport}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                    <Shield className="w-5 h-5 mr-3 text-blue-400" />
                    Account Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Key className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-white font-medium">Two-Factor Authentication</p>
                        <p className="text-gray-400 text-sm">Add extra security to your account</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.twoFactorEnabled}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, twoFactorEnabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <UserCheck className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">Login Notifications</p>
                        <p className="text-gray-400 text-sm">Get notified of new logins</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.loginNotifications}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, loginNotifications: checked }))}
                    />
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="space-y-3">
                    <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20">
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                    <Button className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Deactivate Account
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                    <Shield className="w-5 h-5 mr-3 text-blue-400" />
                    Security Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                    <UserCheck className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Account Verified</p>
                      <p className="text-green-400 text-sm">Your account is verified</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                    <Key className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">2FA Status</p>
                      <p className="text-yellow-400 text-sm">{settings.twoFactorEnabled ? "Enabled" : "Disabled"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Last Login</p>
                      <p className="text-blue-400 text-sm">Today at 2:30 PM</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <Bell className="w-5 h-5 mr-3 text-yellow-400" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold mb-4">Communication</h3>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">Email Notifications</p>
                          <p className="text-gray-400 text-sm">Receive updates via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, emailNotifications: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-white font-medium">SMS Notifications</p>
                          <p className="text-gray-400 text-sm">Receive updates via SMS</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, smsNotifications: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-white font-medium">Push Notifications</p>
                          <p className="text-gray-400 text-sm">Browser notifications</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, pushNotifications: checked }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-white font-semibold mb-4">Content</h3>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Gamepad2 className="w-5 h-5 text-red-400" />
                        <div>
                          <p className="text-white font-medium">Game Notifications</p>
                          <p className="text-gray-400 text-sm">Game results and updates</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.gameNotifications}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, gameNotifications: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="text-white font-medium">Promotions</p>
                          <p className="text-gray-400 text-sm">Special offers and bonuses</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.promotionNotifications}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({ ...prev, promotionNotifications: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <Eye className="w-5 h-5 mr-3 text-green-400" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white mb-3 block">Profile Visibility</Label>
                  <select
                    value={settings.profileVisibility}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, profileVisibility: e.target.value as "public" | "private" }))
                    }
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="public" className="bg-gray-800">
                      Public - Anyone can see your profile
                    </option>
                    <option value="private" className="bg-gray-800">
                      Private - Only you can see your profile
                    </option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">Show Winnings</p>
                      <p className="text-gray-400 text-sm">Display your winnings on leaderboards</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.showWinnings}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, showWinnings: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Show Activity</p>
                      <p className="text-gray-400 text-sm">Display your recent activity</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.showActivity}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, showActivity: checked }))}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Data Privacy</h4>
                      <p className="text-gray-300 text-sm">
                        We respect your privacy and only collect data necessary to provide our services. Your personal
                        information is never shared with third parties without your consent.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}