"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import type { TopWinner } from "@/lib/types"

export function useTopWinners() {
  const [topWinners, setTopWinners] = useState<TopWinner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refreshTopWinners = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("🏆 Fetching top winners...")
      const response = await api.getTopWinners()

      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data && Array.isArray(response.data)) {
        console.log("✅ Top winners loaded:", response.data.length, "winners")
        setTopWinners(response.data)
        setLastUpdated(new Date())

        // Dispatch event for other components to listen
        window.dispatchEvent(
          new CustomEvent("topWinnersUpdated", {
            detail: { winners: response.data },
          }),
        )
      } else {
        console.warn("⚠️ No top winners data received")
        setTopWinners([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load top winners"
      console.error("❌ Error loading top winners:", errorMessage)
      setError(errorMessage)
      setTopWinners([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    refreshTopWinners()
  }, [refreshTopWinners])

  // Listen for external updates
  useEffect(() => {
    const handleTopWinnersUpdate = (event: CustomEvent) => {
      if (event.detail?.winners) {
        console.log("🔄 Received top winners update from external source")
        setTopWinners(event.detail.winners)
        setLastUpdated(new Date())
      }
    }

    window.addEventListener("topWinnersUpdated", handleTopWinnersUpdate as EventListener)

    return () => {
      window.removeEventListener("topWinnersUpdated", handleTopWinnersUpdate as EventListener)
    }
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing top winners...")
      refreshTopWinners()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [refreshTopWinners])

  return {
    topWinners,
    isLoading,
    error,
    lastUpdated,
    refresh: refreshTopWinners,
  }
}
