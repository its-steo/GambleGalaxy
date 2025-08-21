"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import React from "react"
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
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { useMobileSafeHover } from "@/lib/mobile-utils"

interface SideNavProps {
  onShare: () => void
  onClose?: () => void
}

interface NavigationSectionProps {
  title: string
  icon: React.ReactNode
  items: Array<{
    name: string
    icon: React.ReactNode
    href: string
    [key: string]: unknown
  }>
  pathname: string
  onNavClick: () => void
  type: "primary" | "grid" | "list"
}

interface PrimaryNavItemProps {
  item: {
    name: string
    icon: React.ReactNode
    href: string
    gradient?: string
    iconBg?: string
    description?: string
    badge?: string
    [key: string]: unknown
  }
  isActive: boolean
  onNavClick: () => void
}

interface GridNavItemProps {
  item: {
    name: string
    icon: React.ReactNode
    href: string
    color?: string
    hoverColor?: string
    bgHover?: string
    badge?: string
    [key: string]: unknown
  }
  onNavClick: () => void
}

interface ListNavItemProps {
  item: {
    name: string
    icon: React.ReactNode
    href: string
    color?: string
    hoverColor?: string
    bgHover?: string
    badge?: string
    [key: string]: unknown
  }
  isActive: boolean
  onNavClick: () => void
}

const OptimizedSideNavBackground = React.memo(() => (
  <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/[0.02] to-white/5 backdrop-blur-xl border-r border-white/10 shadow-2xl">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>
  </div>
))

OptimizedSideNavBackground.displayName = "OptimizedSideNavBackground"

const useNavigationItems = () => {
  return React.useMemo(
    () => ({
      navItems: [
        {
          name: "Dashboard",
          icon: <Home className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />,
          href: "/dashboard",
          gradient: "from-indigo-500/20 via-purple-500/20 to-pink-500/20",
          iconBg: "bg-gradient-to-r from-indigo-500/30 to-purple-500/30",
          description: "Dashboard & Overview",
        },
        {
          name: "Aviator",
          icon: <Gamepad className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />,
          href: "/games/aviator",
          gradient: "from-purple-500/20 via-pink-500/20 to-red-500/20",
          iconBg: "bg-gradient-to-r from-purple-500/30 to-pink-500/30",
          description: "Crash Game Experience",
          badge: "Hot",
        },
        {
          name: "Sports Betting",
          icon: <BarChart2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />,
          href: "/betting",
          gradient: "from-green-500/20 via-emerald-500/20 to-teal-500/20",
          iconBg: "bg-gradient-to-r from-green-500/30 to-emerald-500/30",
          description: "Live Sports & Odds",
          badge: "Live",
        },
        {
          name: "Wallet",
          icon: <Wallet className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />,
          href: "/wallet",
          gradient: "from-blue-500/20 via-cyan-500/20 to-teal-500/20",
          iconBg: "bg-gradient-to-r from-blue-500/30 to-cyan-500/30",
          description: "Manage Funds",
        },
      ],
      quickActions: [
        {
          name: "Leaderboard",
          icon: <Trophy className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
          href: "/leaderboard",
          color: "text-yellow-400",
          hoverColor: "hover:text-yellow-300",
          bgHover: "hover:bg-yellow-500/10",
        },
        {
          name: "Bet History",
          icon: <History className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
          href: "/betting?tab=history",
          color: "text-gray-300",
          hoverColor: "hover:text-white",
          bgHover: "hover:bg-gray-500/10",
        },
        {
          name: "Sure Odds",
          icon: <Star className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
          href: "/betting?tab=sure-odds",
          color: "text-orange-400",
          hoverColor: "hover:text-orange-300",
          bgHover: "hover:bg-orange-500/10",
          badge: "Premium",
        },
        {
          name: "Live Stats",
          icon: <TrendingUp className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
          href: "/dashboard?tab=stats",
          color: "text-green-400",
          hoverColor: "hover:text-green-300",
          bgHover: "hover:bg-green-500/10",
        },
      ],
      communityItems: [
        {
          name: "Community",
          icon: <Users className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
          href: "/community",
          color: "text-purple-400",
          hoverColor: "hover:text-purple-300",
          bgHover: "hover:bg-purple-500/10",
        },
        {
          name: "Live Bets",
          icon: <Clock className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
          href: "/live-bets",
          color: "text-red-400",
          hoverColor: "hover:text-red-300",
          bgHover: "hover:bg-red-500/10",
          badge: "Live",
        },
        {
          name: "Quick Bet",
          icon: <Zap className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
          href: "/quick-bet",
          color: "text-yellow-400",
          hoverColor: "hover:text-yellow-300",
          bgHover: "hover:bg-yellow-500/10",
        },
        {
          name: "Achievements",
          icon: <Award className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />,
          href: "/achievements",
          color: "text-indigo-400",
          hoverColor: "hover:text-indigo-300",
          bgHover: "hover:bg-indigo-500/10",
        },
      ],
    }),
    [],
  )
}

const GlassSideNav = ({ onShare, onClose }: SideNavProps) => {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const { navItems, quickActions, communityItems } = useNavigationItems()

  const handleNavClick = React.useCallback(() => {
    if (onClose) onClose()
  }, [onClose])

  const handleLogout = React.useCallback(() => {
    logout()
    if (onClose) onClose()
  }, [logout, onClose])

  const handleShare = React.useCallback(() => {
    onShare()
    handleNavClick()
  }, [onShare, handleNavClick])

  const isUserVerified = React.useMemo(() => {
    return user && typeof user === "object" && user !== null && "is_verified" in user
      ? Boolean((user as Record<string, unknown>).is_verified)
      : false
  }, [user])

  return (
    <aside className="w-64 xs:w-72 sm:w-80 h-full relative overflow-hidden">
      <OptimizedSideNavBackground />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Enhanced Header */}
        <div className="p-3 xs:p-4 sm:p-6 border-b border-white/10 bg-white/5 backdrop-blur-sm">
          <Link
            href="/dashboard"
            onClick={handleNavClick}
            className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4 group touch-target"
          >
            <div className="relative">
              <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500/80 via-pink-500/80 to-red-500/80 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 border border-white/20 mobile-hover-fix">
                <span className="text-white font-black text-sm xs:text-base sm:text-lg md:text-xl">G</span>
              </div>
              <div className="absolute -top-0.5 -right-0.5 xs:-top-1 xs:-right-1 w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse border border-white/30" />
            </div>
            <div>
              <h2 className="text-base xs:text-lg sm:text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                <span className="hidden xs:inline">Gamble Galaxy</span>
                <span className="xs:hidden">Galaxy</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 font-medium">Premium Betting Platform</p>
            </div>
          </Link>

          {/* User Info */}
          {user && (
            <div className="mt-2 xs:mt-3 sm:mt-4 p-2 xs:p-2.5 sm:p-3 bg-white/10 backdrop-blur-md rounded-lg xs:rounded-xl sm:rounded-2xl border border-white/20 shadow-lg">
              <div className="flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3">
                <div className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500/80 to-cyan-500/80 backdrop-blur-sm rounded-md xs:rounded-lg sm:rounded-xl flex items-center justify-center border border-white/20">
                  <span className="text-white font-bold text-xs sm:text-sm">
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <p className="font-semibold text-white text-xs sm:text-sm truncate">{user.username || "User"}</p>
                    {isUserVerified && (
                      <div className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-500/80 to-emerald-500/80 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 border border-white/30">
                        <Crown className="w-1 h-1 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-300">{isUserVerified ? "Verified Member" : "Premium Member"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto smooth-scroll p-3 xs:p-4 sm:p-6 space-y-4 xs:space-y-5 sm:space-y-8">
          {/* Primary Navigation */}
          <NavigationSection
            title="Main Menu"
            icon={<Sparkles className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-purple-400" />}
            items={navItems}
            pathname={pathname}
            onNavClick={handleNavClick}
            type="primary"
          />

          {/* Quick Actions */}
          <NavigationSection
            title="Quick Actions"
            icon={<Target className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-blue-400" />}
            items={quickActions}
            pathname={pathname}
            onNavClick={handleNavClick}
            type="grid"
          />

          {/* Community */}
          <NavigationSection
            title="Community"
            icon={<Users className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-green-400" />}
            items={communityItems}
            pathname={pathname}
            onNavClick={handleNavClick}
            type="list"
          />

          {/* Enhanced Share Button */}
          <div className="pt-2 xs:pt-3 sm:pt-4 border-t border-white/20">
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 px-3 xs:px-4 sm:px-6 py-3 xs:py-4 sm:py-5 bg-gradient-to-r from-blue-500/80 via-purple-500/80 to-pink-500/80 hover:from-blue-600/90 hover:via-purple-600/90 hover:to-pink-600/90 text-white rounded-lg xs:rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl group backdrop-blur-sm border border-white/20 mobile-hover-fix touch-target min-h-[48px]"
            >
              <Share2 className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-bold text-xs xs:text-sm sm:text-base">Share Bet Slip</span>
              <Sparkles className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 group-hover:animate-pulse" />
            </button>
          </div>

          {/* Promotional Banner */}
          <div className="bg-gradient-to-r from-yellow-400/80 via-orange-500/80 to-red-500/80 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl p-2.5 xs:p-3 sm:p-4 text-white relative overflow-hidden border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-red-600/10 animate-pulse" />
            <div className="relative">
              <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 mb-1 xs:mb-1.5 sm:mb-2">
                <Gift className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                <span className="font-bold text-xs sm:text-sm">Special Offer!</span>
              </div>
              <p className="text-xs opacity-90 mb-1.5 xs:mb-2 sm:mb-3">Get 50% bonus on your next deposit</p>
              <button className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:bg-white/30 transition-all duration-300 border border-white/30">
                Claim Now
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Bottom Section */}
        <div className="p-3 xs:p-4 sm:p-6 border-t border-white/20 bg-white/5 backdrop-blur-sm">
          <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
            <Link
              href="/profile/settings/"
              onClick={handleNavClick}
              className="w-full flex items-center gap-1.5 xs:gap-2 sm:gap-3 px-2 xs:px-3 sm:px-4 py-3 xs:py-4 text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-sm border border-white/10 hover:border-white/20 group mobile-hover-fix touch-target"
            >
              <Settings className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-medium text-xs xs:text-sm sm:text-base text-gray-200 group-hover:text-white">
                Settings
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-1.5 xs:gap-2 sm:gap-3 px-2 xs:px-3 sm:px-4 py-3 xs:py-4 text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500/80 hover:to-pink-500/80 backdrop-blur-sm rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-lg group border border-white/10 hover:border-white/20 mobile-hover-fix touch-target"
            >
              <LogOut className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-medium text-xs xs:text-sm sm:text-base text-red-400 group-hover:text-white">
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

const NavigationSection = React.memo<NavigationSectionProps>(({ title, icon, items, pathname, onNavClick, type }) => (
  <div>
    <div className="flex items-center justify-between mb-3 xs:mb-4 sm:mb-6">
      <h3 className="text-xs sm:text-sm font-bold text-gray-300 uppercase tracking-wider">{title}</h3>
      {icon}
    </div>

    {type === "primary" && (
      <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
        {items.map((item) => (
          <PrimaryNavItem
            key={item.name}
            item={item}
            isActive={pathname === item.href || (item.href === "/betting" && pathname.startsWith("/betting"))}
            onNavClick={onNavClick}
          />
        ))}
      </div>
    )}

    {type === "grid" && (
      <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-3">
        {items.map((item) => (
          <GridNavItem key={item.name} item={item} onNavClick={onNavClick} />
        ))}
      </div>
    )}

    {type === "list" && (
      <div className="space-y-1 xs:space-y-1.5 sm:space-y-2">
        {items.map((item) => (
          <ListNavItem key={item.name} item={item} isActive={pathname === item.href} onNavClick={onNavClick} />
        ))}
      </div>
    )}
  </div>
))

NavigationSection.displayName = "NavigationSection"

const PrimaryNavItem = React.memo<PrimaryNavItemProps>(({ item, isActive, onNavClick }) => {
  const { hoverProps } = useMobileSafeHover()

  return (
    <Link
      href={item.href}
      onClick={onNavClick}
      className={`group relative flex items-center gap-2 xs:gap-3 sm:gap-4 px-2 xs:px-3 sm:px-4 py-3 xs:py-4 sm:py-5 rounded-lg xs:rounded-xl sm:rounded-2xl transition-all duration-300 border touch-target mobile-hover-fix ${
        isActive
          ? "bg-white/15 backdrop-blur-md shadow-lg border-white/30"
          : "hover:bg-white/10 hover:backdrop-blur-md hover:shadow-md border-white/10 hover:border-white/20"
      }`}
      {...hoverProps}
    >
      {/* Background Glow Effect */}
      {isActive && (
        <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-lg xs:rounded-xl sm:rounded-2xl`} />
      )}
      <div className="relative flex items-center gap-2 xs:gap-3 sm:gap-4 w-full">
        <div
          className={`p-2 xs:p-3 sm:p-4 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-300 backdrop-blur-sm border ${
            isActive ? `${item.iconBg} border-white/30` : "bg-white/10 group-hover:bg-white/15 border-white/20"
          }`}
        >
          <div className={isActive ? "text-white" : "text-gray-200 group-hover:text-white"}>{item.icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              className={`font-bold text-xs xs:text-sm sm:text-base truncate ${
                isActive ? "text-white" : "text-gray-200 group-hover:text-white"
              }`}
            >
              {item.name}
            </span>
            {item.badge && (
              <Badge
                className={`text-xs px-1 xs:px-1.5 sm:px-2 py-0.5 sm:py-1 flex-shrink-0 ml-1 xs:ml-2 backdrop-blur-sm border border-white/30 ${
                  item.badge === "Hot"
                    ? "bg-gradient-to-r from-red-500/80 to-pink-500/80 text-white"
                    : item.badge === "Live"
                      ? "bg-gradient-to-r from-green-500/80 to-emerald-500/80 text-white"
                      : "bg-gradient-to-r from-blue-500/80 to-cyan-500/80 text-white"
                }`}
              >
                {item.badge === "Hot" && <Flame className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />}
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
            isActive ? "text-white rotate-90" : "text-gray-400 group-hover:text-gray-200 group-hover:translate-x-1"
          }`}
        />
      </div>
    </Link>
  )
})

PrimaryNavItem.displayName = "PrimaryNavItem"

const GridNavItem = React.memo<GridNavItemProps>(({ item, onNavClick }) => {
  const { hoverProps } = useMobileSafeHover()

  return (
    <Link
      href={item.href}
      onClick={onNavClick}
      className={`relative flex flex-col items-center gap-1 xs:gap-1.5 sm:gap-2 p-3 xs:p-4 sm:p-5 rounded-lg xs:rounded-xl sm:rounded-2xl transition-all duration-300 border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:shadow-md ${item.bgHover} group hover:border-white/20 touch-target mobile-hover-fix`}
      {...hoverProps}
    >
      <div
        className={`p-2 xs:p-2.5 sm:p-3 rounded-md xs:rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm group-hover:bg-white/15 transition-all duration-300 border border-white/20`}
      >
        <div className={`${item.color} ${item.hoverColor} transition-colors duration-300`}>{item.icon}</div>
      </div>
      <div className="text-center">
        <span className="text-xs font-semibold text-gray-200 group-hover:text-white block truncate">{item.name}</span>
        {item.badge && (
          <Badge className="text-xs mt-0.5 xs:mt-1 bg-gradient-to-r from-orange-500/80 to-red-500/80 text-white backdrop-blur-sm border border-white/30">
            {item.badge}
          </Badge>
        )}
      </div>
    </Link>
  )
})

GridNavItem.displayName = "GridNavItem"

const ListNavItem = React.memo<ListNavItemProps>(({ item, isActive, onNavClick }) => {
  const { hoverProps } = useMobileSafeHover()

  return (
    <Link
      href={item.href}
      onClick={onNavClick}
      className={`flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-3 px-2 xs:px-3 sm:px-4 py-3 xs:py-4 rounded-md xs:rounded-lg sm:rounded-2xl transition-all duration-300 backdrop-blur-sm border touch-target mobile-hover-fix ${
        isActive
          ? "bg-white/10 shadow-md border-white/20"
          : `${item.bgHover} border-white/10 hover:border-white/20 hover:bg-white/10 hover:shadow-sm`
      } group`}
      {...hoverProps}
    >
      <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 min-w-0 flex-1">
        <div className={`${item.color} ${item.hoverColor} transition-colors duration-300`}>{item.icon}</div>
        <span className="text-xs sm:text-sm font-medium text-gray-200 group-hover:text-white truncate">
          {item.name}
        </span>
      </div>
      {item.badge && (
        <Badge className="text-xs bg-gradient-to-r from-red-500/80 to-pink-500/80 text-white flex-shrink-0 backdrop-blur-sm border border-white/30">
          <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-0.5 sm:mr-1 animate-pulse" />
          {item.badge}
        </Badge>
      )}
    </Link>
  )
})

ListNavItem.displayName = "ListNavItem"

export default React.memo(GlassSideNav)
