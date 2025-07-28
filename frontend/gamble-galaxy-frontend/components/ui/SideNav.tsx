"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Gamepad,
  Wallet,
  BarChart2,
  Share2,
  LogOut,
  Trophy,
  History,
  Star,
  TrendingUp,
  Users,
  Clock,
  Zap,
  Award,
  Home,
  Settings,
  Crown,
  Sparkles,
  ChevronRight,
  Flame,
  Target,
  Gift,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

interface SideNavProps {
  onShare: () => void;
  onClose?: () => void;
}

const SideNav = ({ onShare, onClose }: SideNavProps) => {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
  };

  const navItems = [
    {
      name: "Home",
      icon: <Home className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />,
      href: "/",
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      bgColor: "bg-gradient-to-br from-indigo-50 to-purple-50",
      iconBg: "bg-gradient-to-r from-indigo-500 to-purple-500",
      description: "Dashboard & Overview",
    },
    {
      name: "Aviator",
      icon: <Gamepad className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />,
      href: "/games/aviator",
      gradient: "from-purple-500 via-pink-500 to-red-500",
      bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
      iconBg: "bg-gradient-to-r from-purple-500 to-pink-500",
      description: "Crash Game Experience",
      badge: "Hot",
    },
    {
      name: "Sports Betting",
      icon: <BarChart2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />,
      href: "/betting",
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
      iconBg: "bg-gradient-to-r from-green-500 to-emerald-500",
      description: "Live Sports & Odds",
      badge: "Live",
    },
    {
      name: "Wallet",
      icon: <Wallet className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />,
      href: "/wallet",
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
      iconBg: "bg-gradient-to-r from-blue-500 to-cyan-500",
      description: "Manage Funds",
    },
  ];

  const quickActions = [
    {
      name: "Leaderboard",
      icon: <Trophy className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
      href: "/leaderboard",
      color: "text-yellow-600",
      hoverColor: "hover:text-yellow-700",
      bgHover: "hover:bg-yellow-50",
    },
    {
      name: "Bet History",
      icon: <History className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
      href: "/betting?tab=history",
      color: "text-gray-600",
      hoverColor: "hover:text-gray-700",
      bgHover: "hover:bg-gray-50",
    },
    {
      name: "Sure Odds",
      icon: <Star className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
      href: "/betting?tab=sure-odds",
      color: "text-orange-600",
      hoverColor: "hover:text-orange-700",
      bgHover: "hover:bg-orange-50",
      badge: "Premium",
    },
    {
      name: "Live Stats",
      icon: <TrendingUp className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
      href: "/stats",
      color: "text-green-600",
      hoverColor: "hover:text-green-700",
      bgHover: "hover:bg-green-50",
    },
  ];

  const communityItems = [
    {
      name: "Community",
      icon: <Users className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
      href: "/community",
      color: "text-purple-600",
      hoverColor: "hover:text-purple-700",
      bgHover: "hover:bg-purple-50",
    },
    {
      name: "Live Bets",
      icon: <Clock className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
      href: "/live-bets",
      color: "text-red-600",
      hoverColor: "hover:text-red-700",
      bgHover: "hover:bg-red-50",
      badge: "Live",
    },
    {
      name: "Quick Bet",
      icon: <Zap className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
      href: "/quick-bet",
      color: "text-yellow-600",
      hoverColor: "hover:text-yellow-700",
      bgHover: "hover:bg-yellow-50",
    },
    {
      name: "Achievements",
      icon: <Award className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
      href: "/achievements",
      color: "text-indigo-600",
      hoverColor: "hover:text-indigo-700",
      bgHover: "hover:bg-indigo-50",
    },
  ];

  return (
    <aside className="w-64 xs:w-72 sm:w-80 h-full bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 border-r border-white/10 flex flex-col shadow-xl relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 xs:-top-20 xs:-right-20 sm:-top-40 sm:-right-40 w-20 h-20 xs:w-40 xs:h-40 sm:w-80 sm:h-80 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 xs:-bottom-20 xs:-left-20 sm:-bottom-40 sm:-left-40 w-20 h-20 xs:w-40 xs:h-40 sm:w-80 sm:h-80 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Enhanced Header */}
      <div className="relative p-3 xs:p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
        <Link href="/" onClick={handleNavClick} className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4 group">
          <div className="relative">
            <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-lg xs:rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
              <span className="text-white font-black text-sm xs:text-base sm:text-lg md:text-xl">G</span>
            </div>
            <div className="absolute -top-0.5 -right-0.5 xs:-top-1 xs:-right-1 w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse" />
          </div>
          <div>
            <h2 className="text-base xs:text-lg sm:text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              <span className="hidden xs:inline">Gamble Galaxy</span>
              <span className="xs:hidden">Galaxy</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Premium Betting Platform</p>
          </div>
        </Link>

        {/* User Info */}
        {user && (
          <div className="mt-2 xs:mt-3 sm:mt-4 p-2 xs:p-2.5 sm:p-3 bg-white/5 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl border border-white/10 shadow-sm">
            <div className="flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3">
              <div className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md xs:rounded-lg sm:rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">{user.username.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <p className="font-semibold text-white text-xs sm:text-sm truncate">{user.username}</p>
                  {user.is_verified && (
                    <div className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Crown className="w-1 h-1 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400">Premium Member</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto p-3 xs:p-4 sm:p-6 space-y-4 xs:space-y-5 sm:space-y-8 relative">
        {/* Primary Navigation */}
        <div>
          <div className="flex items-center justify-between mb-3 xs:mb-4 sm:mb-6">
            <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">Main Menu</h3>
            <Sparkles className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-purple-400" />
          </div>
          <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === "/betting" && pathname.startsWith("/betting"));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`group relative flex items-center gap-2 xs:gap-3 sm:gap-4 px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 md:py-4 rounded-lg xs:rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 ${
                    isActive
                      ? `${item.bgColor} shadow-lg border border-gray-200`
                      : "hover:bg-white/5 hover:shadow-md border border-transparent hover:border-white/10"
                  }`}
                >
                  {/* Background Glow Effect */}
                  {isActive && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-5 rounded-lg xs:rounded-xl sm:rounded-2xl`}
                    />
                  )}

                  <div className="relative flex items-center gap-2 xs:gap-3 sm:gap-4 w-full">
                    <div
                      className={`p-1.5 xs:p-2 sm:p-3 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-300 ${
                        isActive ? item.iconBg : "bg-white/5 group-hover:bg-white/10"
                      }`}
                    >
                      <div className={isActive ? "text-white" : "text-gray-300 group-hover:text-gray-200"}>
                        {item.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold text-xs xs:text-sm sm:text-base truncate ${
                            isActive ? "text-gray-800" : "text-gray-200 group-hover:text-white"
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.badge && (
                          <Badge
                            className={`text-xs px-1 xs:px-1.5 sm:px-2 py-0.5 sm:py-1 flex-shrink-0 ml-1 xs:ml-2 ${
                              item.badge === "Hot"
                                ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                                : item.badge === "Live"
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                  : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                            }`}
                          >
                            {item.badge === "Hot" && (
                              <Flame className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                            )}
                            {item.badge === "Live" && (
                              <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-0.5 sm:mr-1 animate-pulse" />
                            )}
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">{item.description}</p>
                    </div>
                    <ChevronRight
                      className={`w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 transition-all duration-300 flex-shrink-0 ${
                        isActive
                          ? "text-gray-600 rotate-90"
                          : "text-gray-500 group-hover:text-gray-400 group-hover:translate-x-1"
                      }`}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">Quick Actions</h3>
            <Target className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-3">
            {quickActions.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                className={`relative flex flex-col items-center gap-1 xs:gap-1.5 sm:gap-2 p-2 xs:p-3 sm:p-4 rounded-lg xs:rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 border border-white/10 bg-white/5 hover:shadow-md ${item.bgHover} group`}
              >
                <div
                  className={`p-1 xs:p-1.5 sm:p-2 rounded-md xs:rounded-lg sm:rounded-xl bg-white/10 group-hover:bg-white/20 transition-all duration-300`}
                >
                  <div className={`${item.color} ${item.hoverColor} transition-colors duration-300`}>{item.icon}</div>
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold text-gray-200 group-hover:text-white block truncate">
                    {item.name}
                  </span>
                  {item.badge && (
                    <Badge className="text-xs mt-0.5 xs:mt-1 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Community */}
        <div>
          <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">Community</h3>
            <Users className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-green-400" />
          </div>
          <div className="space-y-1 xs:space-y-1.5 sm:space-y-2">
            {communityItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-3 px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 ${
                  pathname === item.href
                    ? "bg-white/5 shadow-md border border-white/10"
                    : `${item.bgHover} border border-transparent hover:border-white/10 hover:bg-white/5 hover:shadow-sm`
                } group`}
              >
                <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className={`${item.color} ${item.hoverColor} transition-colors duration-300`}>{item.icon}</div>
                  <span className="text-xs sm:text-sm font-medium text-gray-200 group-hover:text-white truncate">
                    {item.name}
                  </span>
                </div>
                {item.badge && (
                  <Badge className="text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white flex-shrink-0">
                    <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-0.5 sm:mr-1 animate-pulse" />
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Enhanced Share Button */}
        <div className="pt-2 xs:pt-3 sm:pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              onShare();
              handleNavClick();
            }}
            className="w-full flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-lg xs:rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl group"
          >
            <Share2 className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-bold text-xs xs:text-sm sm:text-base">Share Bet Slip</span>
            <Sparkles className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 group-hover:animate-pulse" />
          </button>
        </div>

        {/* Promotional Banner */}
        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-lg xs:rounded-xl sm:rounded-2xl p-2.5 xs:p-3 sm:p-4 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-red-600/20 animate-pulse" />
          <div className="relative">
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 mb-1 xs:mb-1.5 sm:mb-2">
              <Gift className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              <span className="font-bold text-xs sm:text-sm">Special Offer!</span>
            </div>
            <p className="text-xs opacity-90 mb-1.5 xs:mb-2 sm:mb-3">Get 50% bonus on your next deposit</p>
            <button className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:bg-white/30 transition-all duration-300">
              Claim Now
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Section */}
      <div className="p-3 xs:p-4 sm:p-6 border-t border-white/10 bg-gradient-to-r from-gray-900 to-gray-950">
        <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
          <button className="w-full flex items-center gap-1.5 xs:gap-2 sm:gap-3 px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-sm border border-transparent hover:border-white/10 group">
            <Settings className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-medium text-xs xs:text-sm sm:text-base text-gray-200 group-hover:text-white">
              Settings
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-1.5 xs:gap-2 sm:gap-3 px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-red-500 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-lg group"
          >
            <LogOut className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-medium text-xs xs:text-sm sm:text-base text-red-400 group-hover:text-white">
              Logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SideNav;