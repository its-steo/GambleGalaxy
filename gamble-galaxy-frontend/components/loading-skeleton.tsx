"use client"

import { motion } from "framer-motion"

interface SkeletonProps {
  className?: string
  variant?: "text" | "rectangular" | "circular"
  width?: string | number
  height?: string | number
}

export function Skeleton({ className = "", variant = "rectangular", width, height }: SkeletonProps) {
  const baseClasses = "bg-gradient-to-r from-white/10 via-white/20 to-white/10 animate-pulse"

  const variantClasses = {
    text: "h-4 rounded",
    rectangular: "rounded-xl",
    circular: "rounded-full",
  }

  const style = {
    width: width || "100%",
    height: height || (variant === "text" ? "1rem" : "auto"),
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Header Skeleton */}
      <div className="text-center py-8">
        <Skeleton className="h-10 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>

      {/* Balance Card Skeleton */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton variant="circular" width={48} height={48} />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Skeleton */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="flex items-center space-x-3">
                <Skeleton variant="circular" width={32} height={32} />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MatchSkeleton() {
  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="text-center mb-4">
        <Skeleton className="h-6 w-48 mx-auto" />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-3 bg-white/5 rounded-xl">
            <Skeleton className="h-4 w-4 mx-auto mb-2" />
            <Skeleton className="h-5 w-8 mx-auto" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-2 bg-white/5 rounded-lg">
            <Skeleton className="h-3 w-12 mx-auto mb-1" />
            <Skeleton className="h-4 w-8 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
