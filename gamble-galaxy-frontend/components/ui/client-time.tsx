"use client"

import { formatRelativeTime, formatTime } from "@/lib/utils"

interface ClientTimeProps {
  timestamp: string
  format?: "relative" | "full"
  className?: string
}

export function ClientTime({ timestamp, format = "full", className = "" }: ClientTimeProps) {
  const formattedTime = format === "relative" ? formatRelativeTime(timestamp) : formatTime(timestamp)

  return <span className={className}>{formattedTime}</span>
}
