"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import LoadingSpinner from "@/components/loading-spinner"
import BottomNavigation from "@/components/bottom-navigation"
import GlassToaster from "@/components/glass-toaster"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showBottomNav, setShowBottomNav] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setShowBottomNav(true)
      } else if (currentScrollY < lastScrollY) {
        setShowBottomNav(false)
      }

      lastScrollY = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <main className="pb-20">{children}</main>
      <BottomNavigation show={showBottomNav} />
      <GlassToaster />
    </div>
  )
}
