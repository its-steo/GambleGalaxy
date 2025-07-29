"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWebSocket } from "@/lib/websocket"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import {
  Plane,
  TrendingUp,
  Users,
  Trophy,
  Plus,
  Minus,
  DollarSign,
  Banknote,
  Clock,
  History,
  Zap,
  Activity,
  ChevronUp,
  ChevronDown,
  Target,
  Rocket,
  X,
  Crown,
  Star,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { WalletBalance } from "@/components/wallet/wallet-balance"
import type { TopWinner } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define interfaces for type safety
interface Round {
  multiplier: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

interface TrailPoint {
  x: number
  y: number
  opacity: number
  size: number
}

interface StarType {
  x: number
  y: number
  size: number
  opacity: number
  twinkle: number
}

interface Position {
  x: number
  y: number
}

interface Velocity {
  x: number
  y: number
}

export function AviatorGame() {
  const { user } = useAuth()
  const {
    connect,
    disconnect,
    isConnected,
    currentMultiplier,
    currentRoundId,
    isRoundActive,
    cashOut,
    placeBet,
    walletBalance: wsBalance,
    livePlayers,
    recentCashouts,
  } = useWebSocket()

  const [betAmount1, setBetAmount1] = useState("100")
  const [betAmount2, setBetAmount2] = useState("100")
  const [autoCashout1, setAutoCashout1] = useState("")
  const [autoCashout2, setAutoCashout2] = useState("")
  const [hasBet1, setHasBet1] = useState(false)
  const [hasBet2, setHasBet2] = useState(false)
  const [topWinners, setTopWinners] = useState<TopWinner[]>([])
  const [pastCrashes, setPastCrashes] = useState<number[]>([])
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [isBettingPhase, setIsBettingPhase] = useState(true)
  const [roundCountdown, setRoundCountdown] = useState(5)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [showLazerSignal, setShowLazerSignal] = useState(false)
  const [isLoadingPremiumOdds, setIsLoadingPremiumOdds] = useState(false)
  const [premiumSureOdd, setPremiumSureOdd] = useState<number | null>(null)
  const [hasPurchasedPremium, setHasPurchasedPremium] = useState(false)
  const [showCrashScreen, setShowCrashScreen] = useState(false)
  const [lastCrashRoundId, setLastCrashRoundId] = useState<string | null>(null)
  const [gamePhase, setGamePhase] = useState<"waiting" | "flying" | "crashed">("waiting")

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const prevRoundActiveRef = useRef<boolean>(isRoundActive)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const planePositionRef = useRef<Position>({ x: 80, y: 300 })
  const lastMultiplierRef = useRef<number>(1.0)
  const trailPointsRef = useRef<TrailPoint[]>([])
  const particlesRef = useRef<Particle[]>([])
  const starsRef = useRef<StarType[]>([])
  const velocityRef = useRef<Velocity>({ x: 0, y: 0 })
  const smoothMultiplierRef = useRef<number>(1.0)
  const lazerSignalTimer = useRef<NodeJS.Timeout | null>(null)
  const crashMultiplierRef = useRef<number>(1.0)
  const isAnimatingRef = useRef<boolean>(false)

  const checkExistingPremiumOdds = useCallback(async () => {
    try {
      const response = await api.getSureOddStatus()
      if (response.data) {
        const { has_pending } = response.data
        const sureOddResponse = await api.getSureOdd()
        if (sureOddResponse.data && sureOddResponse.data.odd_value) {
          setPremiumSureOdd(sureOddResponse.data.odd_value)
          setHasPurchasedPremium(true)
        }
        if (has_pending && !sureOddResponse.data?.odd_value) {
          setIsLoadingPremiumOdds(true)
          pollForPremiumOdd()
        }
      }
    } catch (error) {
      console.error("❌ Error checking existing premium odds:", error)
    }
  }, [setPremiumSureOdd, setHasPurchasedPremium, setIsLoadingPremiumOdds])

  const fetchWalletBalance = useCallback(async () => {
    if (user) {
      try {
        console.log("💰 Fetching wallet balance for user:", user.id)
        const res = await api.getWallet()
        console.log("💰 Wallet balance API response:", res)
        if (res.data && res.data.balance !== undefined) {
          const newBalance = Number(res.data.balance)
          console.log("💰 Setting wallet balance to:", newBalance)
          setWalletBalance(newBalance)
        } else {
          console.warn("⚠️ Invalid wallet balance response:", res)
        }
      } catch (error) {
        console.error("❌ Error fetching wallet balance:", error)
        toast.error("Failed to load wallet balance", { description: "Please check your connection." })
      }
    }
  }, [user, setWalletBalance])

  const startLazerSignalTimer = useCallback(() => {
    if (lazerSignalTimer.current) {
      clearInterval(lazerSignalTimer.current)
    }
    const timer = setInterval(
      () => {
        if (!showLazerSignal) {
          setShowLazerSignal(true)
          console.log("⚡ Lazer Signal appeared!")
        }
      },
      5 * 60 * 1000,
    )
    lazerSignalTimer.current = timer
  }, [showLazerSignal, setShowLazerSignal])

  const handleDismissLazerSignal = useCallback(() => {
    setShowLazerSignal(false)
  }, [setShowLazerSignal])

  const handleRoundEnd = useCallback(async () => {
    try {
      console.log("🏁 Handling round end, current multiplier:", currentMultiplier)

      // Set crash phase and store crash multiplier
      setGamePhase("crashed")
      crashMultiplierRef.current = smoothMultiplierRef.current
      setShowCrashScreen(true)
      setLastCrashRoundId(currentRoundId !== null ? String(currentRoundId) : null)

      // Play crash sound
      try {
        const response = await fetch("/sounds/crash.mp3", { method: "HEAD" })
        if (response.ok) {
          const audio = new Audio("/sounds/crash.mp3")
          await audio.play()
        }
      } catch (err) {
        console.warn("🔇 Crash sound not available:", err)
      }

      // Update past crashes with the actual crash multiplier after a short delay
      setTimeout(async () => {
        const actualCrashMultiplier = crashMultiplierRef.current
        setPastCrashes((prev) => [actualCrashMultiplier, ...prev].slice(0, 12))

        // Fetch updated crashes from server
        try {
          const crashesRes = await api.getPastCrashes()
          if (crashesRes.data) {
            setPastCrashes(crashesRes.data.map((round: Round) => round.multiplier).slice(0, 12))
          }
        } catch (error) {
          console.error("❌ Error fetching past crashes:", error)
        }
      }, 1000)

      // Hide crash screen after delay
      setTimeout(() => {
        setShowCrashScreen(false)
        setGamePhase("waiting")
      }, 3000)
    } catch (error) {
      console.error("❌ Error in handleRoundEnd:", error)
    }
  }, [currentMultiplier, currentRoundId, setPastCrashes, setShowCrashScreen, setLastCrashRoundId])

  const adjustColorBrightness = useCallback((color: string, amount: number) => {
    const hex = color.replace("#", "")
    const r = Math.max(0, Math.min(255, Number.parseInt(hex.substr(0, 2), 16) + amount))
    const g = Math.max(0, Math.min(255, Number.parseInt(hex.substr(2, 2), 16) + amount))
    const b = Math.max(0, Math.min(255, Number.parseInt(hex.substr(4, 2), 16) + amount))
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
  }, [])

  const getMultiplierColor = useCallback((multiplier: number) => {
    if (multiplier < 1.5) return "#ff4757"
    if (multiplier < 2) return "#ff6b35"
    if (multiplier < 5) return "#ffa502"
    if (multiplier < 10) return "#2ed573"
    if (multiplier < 20) return "#1e90ff"
    if (multiplier < 50) return "#a55eea"
    return "#ff6b6b"
  }, [])

  const initCanvas = useCallback(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Reset animation state
    planePositionRef.current = { x: 80, y: canvas.height - 80 }
    trailPointsRef.current = []
    particlesRef.current = []
    velocityRef.current = { x: 0, y: 0 }
    isAnimatingRef.current = true

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const drawGame = () => {
      if (!ctx || !canvas || !isAnimatingRef.current) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Background
      const time = Date.now() * 0.0008
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width,
      )
      gradient.addColorStop(0, `hsl(${240 + Math.sin(time) * 8}, 65%, ${10 + Math.sin(time * 0.5) * 2}%)`)
      gradient.addColorStop(0.4, `hsl(${250 + Math.cos(time * 0.7) * 12}, 55%, ${14 + Math.cos(time * 0.3) * 3}%)`)
      gradient.addColorStop(0.8, `hsl(${260 + Math.sin(time * 0.5) * 15}, 45%, ${8 + Math.sin(time * 0.8) * 2}%)`)
      gradient.addColorStop(1, `hsl(${270 + Math.cos(time * 0.3) * 8}, 35%, ${5 + Math.cos(time) * 1}%)`)

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Stars
      starsRef.current.forEach((star) => {
        star.twinkle += 0.03
        const twinkleOpacity = star.opacity * (0.4 + 0.6 * Math.sin(star.twinkle))
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"
      ctx.lineWidth = 1
      const gridSize = 50
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Update multiplier smoothing
      if (gamePhase === "flying") {
        const targetMultiplier = Number.isFinite(currentMultiplier) ? currentMultiplier : 1.0
        const smoothingFactor = 0.3 // Increased for more responsiveness
        smoothMultiplierRef.current += (targetMultiplier - smoothMultiplierRef.current) * smoothingFactor

        // Ensure we don't lag too far behind
        if (Math.abs(targetMultiplier - smoothMultiplierRef.current) > 0.05) {
          smoothMultiplierRef.current = targetMultiplier * 0.9 + smoothMultiplierRef.current * 0.1
        }
      }

      // Plane movement and animation
      if (gamePhase === "flying") {
        // Calculate plane movement based on multiplier
        const targetSpeed = 1.5 + smoothMultiplierRef.current * 0.8
        const acceleration = 0.15
        velocityRef.current.x += (targetSpeed - velocityRef.current.x) * acceleration
        planePositionRef.current.x += velocityRef.current.x

        // Calculate Y position based on multiplier (plane goes up as multiplier increases)
        const baseY = canvas.height - 80
        const multiplierFactor = Math.log(Math.max(1, smoothMultiplierRef.current)) * 60
        const targetY = Math.max(30, baseY - multiplierFactor)
        const yDiff = targetY - planePositionRef.current.y
        velocityRef.current.y += yDiff * 0.03
        velocityRef.current.y *= 0.9
        planePositionRef.current.y += velocityRef.current.y

        // Keep plane within bounds
        if (planePositionRef.current.x > canvas.width - 60) {
          planePositionRef.current.x = canvas.width - 60
        }

        // Generate particles for engine trail
        if (Math.random() < 0.7) {
          const angle = Math.atan2(velocityRef.current.y, velocityRef.current.x)
          particlesRef.current.push({
            x: planePositionRef.current.x - 30 + Math.cos(angle + Math.PI) * 15,
            y: planePositionRef.current.y + Math.sin(angle + Math.PI) * 15 + (Math.random() - 0.5) * 6,
            vx: -2 - Math.random() * 1.5 + Math.cos(angle + Math.PI) * 1.5,
            vy: (Math.random() - 0.5) * 2 + Math.sin(angle + Math.PI) * 1.5,
            life: 45,
            maxLife: 45,
          })
        }

        // Add trail points
        trailPointsRef.current.push({
          x: planePositionRef.current.x,
          y: planePositionRef.current.y,
          opacity: 1,
          size: 2 + smoothMultiplierRef.current * 0.2,
        })

        if (trailPointsRef.current.length > 150) {
          trailPointsRef.current.shift()
        }
      } else if (gamePhase === "crashed") {
        // During crash, make plane fall down
        velocityRef.current.y += 0.5 // Gravity
        velocityRef.current.x *= 0.98 // Slow down horizontally
        planePositionRef.current.x += velocityRef.current.x
        planePositionRef.current.y += velocityRef.current.y

        // Generate crash particles
        if (Math.random() < 0.8) {
          particlesRef.current.push({
            x: planePositionRef.current.x + (Math.random() - 0.5) * 40,
            y: planePositionRef.current.y + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 60,
            maxLife: 60,
          })
        }
      }

      // Update and render particles
      particlesRef.current = particlesRef.current.filter((particle: Particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vx *= 0.98
        particle.vy *= 0.98
        particle.life--

        const alpha = (particle.life / particle.maxLife) * 0.9
        const size = (particle.life / particle.maxLife) * 3

        const particleGradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, size * 2)
        if (gamePhase === "crashed") {
          // Red/orange particles for crash
          particleGradient.addColorStop(0, `rgba(255, ${60 + alpha * 100}, ${20 + alpha * 40}, ${alpha})`)
          particleGradient.addColorStop(0.7, `rgba(255, ${40 + alpha * 80}, ${10 + alpha * 20}, ${alpha * 0.6})`)
          particleGradient.addColorStop(1, `rgba(255, 20, 0, 0)`)
        } else {
          // Normal engine particles
          particleGradient.addColorStop(0, `rgba(255, ${120 + alpha * 135}, ${60 + alpha * 60}, ${alpha})`)
          particleGradient.addColorStop(0.7, `rgba(255, ${80 + alpha * 100}, ${40 + alpha * 40}, ${alpha * 0.6})`)
          particleGradient.addColorStop(1, `rgba(255, 60, 20, 0)`)
        }

        ctx.fillStyle = particleGradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
        ctx.fill()

        return particle.life > 0
      })

      // Update trail opacity
      trailPointsRef.current.forEach((point, index) => {
        point.opacity = (index / trailPointsRef.current.length) * 0.95
      })

      // Draw trail
      if (trailPointsRef.current.length > 2) {
        const trailColor = getMultiplierColor(smoothMultiplierRef.current)
        ctx.lineWidth = 10
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.shadowColor = trailColor
        ctx.shadowBlur = 20
        ctx.globalAlpha = gamePhase === "crashed" ? 0.3 : 0.6
        ctx.strokeStyle = trailColor
        ctx.beginPath()
        ctx.moveTo(trailPointsRef.current[0].x, trailPointsRef.current[0].y)
        for (let i = 1; i < trailPointsRef.current.length - 1; i++) {
          const current = trailPointsRef.current[i]
          const next = trailPointsRef.current[i + 1]
          const cpx = (current.x + next.x) / 2
          const cpy = (current.y + next.y) / 2
          ctx.quadraticCurveTo(current.x, current.y, cpx, cpy)
        }
        ctx.stroke()

        ctx.lineWidth = 4
        ctx.shadowBlur = 10
        ctx.globalAlpha = gamePhase === "crashed" ? 0.5 : 0.8
        ctx.stroke()

        ctx.lineWidth = 2
        ctx.shadowBlur = 5
        ctx.globalAlpha = 1
        ctx.strokeStyle = `rgba(255, 255, 255, ${gamePhase === "crashed" ? 0.6 : 0.95})`
        ctx.stroke()

        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }

      // Draw plane
      const planeSize = 60
      ctx.save()
      ctx.translate(planePositionRef.current.x, planePositionRef.current.y)
      const angle = Math.atan2(velocityRef.current.y, velocityRef.current.x) * 0.4
      ctx.rotate(angle)

      // Plane shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)"
      ctx.shadowBlur = 12
      ctx.shadowOffsetX = 6
      ctx.shadowOffsetY = 6
      ctx.fillRect(-planeSize / 2, -12, planeSize, 24)

      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Main plane body
      const planeGradient = ctx.createLinearGradient(-planeSize / 2, -12, -planeSize / 2, 12)
      if (gamePhase === "crashed") {
        planeGradient.addColorStop(0, "#8b0000")
        planeGradient.addColorStop(0.3, "#a52a2a")
        planeGradient.addColorStop(0.7, "#dc143c")
        planeGradient.addColorStop(1, "#ff0000")
      } else {
        planeGradient.addColorStop(0, "#ff6b6b")
        planeGradient.addColorStop(0.3, "#ff5252")
        planeGradient.addColorStop(0.7, "#f44336")
        planeGradient.addColorStop(1, "#d32f2f")
      }
      ctx.fillStyle = planeGradient
      ctx.fillRect(-planeSize / 2, -12, planeSize, 24)

      // Plane highlights
      ctx.fillStyle = `rgba(255, 255, 255, ${gamePhase === "crashed" ? 0.2 : 0.4})`
      ctx.fillRect(-planeSize / 2, -10, planeSize, 6)
      ctx.fillStyle = `rgba(255, 255, 255, ${gamePhase === "crashed" ? 0.1 : 0.2})`
      ctx.fillRect(-planeSize / 2, -6, planeSize, 2)

      // Nose
      const noseGradient = ctx.createLinearGradient(planeSize / 2, -6, planeSize / 2 + 20, 0)
      noseGradient.addColorStop(0, gamePhase === "crashed" ? "#8b0000" : "#e53935")
      noseGradient.addColorStop(0.5, gamePhase === "crashed" ? "#a52a2a" : "#c62828")
      noseGradient.addColorStop(1, gamePhase === "crashed" ? "#dc143c" : "#b71c1c")
      ctx.fillStyle = noseGradient
      ctx.beginPath()
      ctx.moveTo(planeSize / 2, 0)
      ctx.lineTo(planeSize / 2 + 20, -5)
      ctx.lineTo(planeSize / 2 + 20, 5)
      ctx.closePath()
      ctx.fill()

      // Wings
      const wingGradient = ctx.createLinearGradient(-planeSize / 4, -30, -planeSize / 4, 30)
      wingGradient.addColorStop(0, gamePhase === "crashed" ? "#8b0000" : "#d32f2f")
      wingGradient.addColorStop(0.3, gamePhase === "crashed" ? "#a52a2a" : "#c62828")
      wingGradient.addColorStop(0.7, gamePhase === "crashed" ? "#dc143c" : "#b71c1c")
      wingGradient.addColorStop(1, gamePhase === "crashed" ? "#ff0000" : "#a00000")
      ctx.fillStyle = wingGradient
      ctx.fillRect(-planeSize / 4, -30, planeSize / 2, 60)

      ctx.fillStyle = `rgba(255, 255, 255, ${gamePhase === "crashed" ? 0.1 : 0.25})`
      ctx.fillRect(-planeSize / 4, -28, planeSize / 2, 8)

      // Tail
      ctx.fillStyle = gamePhase === "crashed" ? "#8b0000" : "#a00000"
      ctx.beginPath()
      ctx.moveTo(-planeSize / 2, -12)
      ctx.lineTo(-planeSize / 2 - 18, -20)
      ctx.lineTo(-planeSize / 2 - 12, -12)
      ctx.lineTo(-planeSize / 2 - 18, 20)
      ctx.lineTo(-planeSize / 2, 12)
      ctx.closePath()
      ctx.fill()

      // Engine glow (only when flying)
      if (gamePhase === "flying") {
        const glowIntensity = 0.6 + 0.4 * Math.sin(Date.now() * 0.01)
        const glowSize = 16 + 6 * Math.sin(Date.now() * 0.015)
        const engineGradient = ctx.createRadialGradient(-planeSize / 2 - 10, 0, 0, -planeSize / 2 - 10, 0, glowSize)
        engineGradient.addColorStop(0, `rgba(255, 140, 140, ${glowIntensity})`)
        engineGradient.addColorStop(0.5, `rgba(255, 100, 100, ${glowIntensity * 0.7})`)
        engineGradient.addColorStop(1, `rgba(255, 60, 60, 0)`)
        ctx.fillStyle = engineGradient
        ctx.beginPath()
        ctx.arc(-planeSize / 2 - 10, 0, glowSize, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()

      // Display multiplier
      const displayMultiplier = gamePhase === "crashed" ? crashMultiplierRef.current : smoothMultiplierRef.current
      const multiplierText = `${displayMultiplier.toFixed(2)}x`
      const fontSize = Math.min(80, 50 + displayMultiplier * 1.5)
      ctx.font = `bold ${fontSize}px 'Inter', 'Arial', sans-serif`
      const textGradient = ctx.createLinearGradient(0, 50, 0, 120)
      const color = getMultiplierColor(displayMultiplier)
      textGradient.addColorStop(0, color)
      textGradient.addColorStop(1, adjustColorBrightness(color, -40))
      ctx.fillStyle = textGradient
      ctx.strokeStyle = "rgba(0, 0, 0, 0.9)"
      ctx.lineWidth = 5
      ctx.textAlign = "center"
      ctx.shadowColor = color
      ctx.shadowBlur = 40
      ctx.strokeText(multiplierText, canvas.width / 2, 90)
      ctx.fillText(multiplierText, canvas.width / 2, 90)

      ctx.shadowBlur = 60
      ctx.globalAlpha = 0.4
      ctx.fillText(multiplierText, canvas.width / 2, 90)
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      // Status text
      ctx.font = "bold 18px 'Inter', 'Arial', sans-serif"
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)"
      ctx.shadowBlur = 8
      const statusText =
        gamePhase === "flying" ? "🚀 FLYING..." : gamePhase === "crashed" ? "💥 CRASHED!" : "⏳ WAITING..."
      const statusOpacity = 0.7 + 0.3 * Math.sin(Date.now() * 0.004)
      ctx.globalAlpha = statusOpacity
      ctx.fillText(statusText, canvas.width / 2, 115)
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      // Continue animation
      animationRef.current = requestAnimationFrame(drawGame)
    }

    drawGame()
  }, [gamePhase, currentMultiplier, getMultiplierColor, adjustColorBrightness])

  const handleCashOut = useCallback(
    async (betNumber: 1 | 2) => {
      if (!user || (betNumber === 1 ? !hasBet1 : !hasBet2)) {
        toast.info("No Active Bet", { description: "You don't have an active bet to cash out." })
        return
      }

      if (!isRoundActive) {
        toast.error("Round Ended", { description: "The round has already crashed." })
        return
      }

      try {
        console.log("💰 Cashing out at:", currentMultiplier)
        await cashOut(user.id, currentMultiplier)
        if (betNumber === 1) setHasBet1(false)
        else setHasBet2(false)
        console.log("✅ Cashout successful")
      } catch (error: unknown) {
        console.error("❌ Error cashing out:", error)
        toast.error("Error Cashing Out", {
          description: error instanceof Error ? error.message : "Failed to cash out. Please try again.",
        })
      }
    },
    [user, hasBet1, hasBet2, isRoundActive, currentMultiplier, cashOut, setHasBet1, setHasBet2],
  )

  const loadGameData = useCallback(async () => {
    try {
      const [winnersRes, crashesRes] = await Promise.all([api.getTopWinners(), api.getPastCrashes()])
      console.log("📊 Loaded game data:", { winners: winnersRes.data, crashes: crashesRes.data })
      if (winnersRes.data) setTopWinners(winnersRes.data)
      if (crashesRes.data) setPastCrashes(crashesRes.data.map((round: Round) => round.multiplier))
    } catch (error) {
      console.error("❌ Error loading game data:", error)
      toast.error("Failed to load game data", { description: "Could not fetch game data." })
    }
  }, [setTopWinners, setPastCrashes])

  const pollForPremiumOdd = useCallback(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.getSureOdd()
        if (response.data && response.data.odd_value) {
          setPremiumSureOdd(response.data.odd_value)
          setHasPurchasedPremium(true)
          setIsLoadingPremiumOdds(false)
          setShowLazerSignal(false)
          clearInterval(pollInterval)
          toast.success("Premium Sure Odd Received!", {
            description: `Your premium sure odd is ${response.data.odd_value.toFixed(2)}x`,
          })
        }
      } catch (error) {
        console.error("❌ Error polling for premium odd:", error)
      }
    }, 3000)

    setTimeout(
      () => {
        clearInterval(pollInterval)
        if (isLoadingPremiumOdds) {
          setIsLoadingPremiumOdds(false)
          toast.error("Timeout", {
            description: "Premium sure odd assignment timed out. Contact support.",
          })
        }
      },
      10 * 60 * 1000,
    )
  }, [setPremiumSureOdd, setHasPurchasedPremium, setIsLoadingPremiumOdds, setShowLazerSignal, isLoadingPremiumOdds])

  const handlePayForPremiumOdds = useCallback(async () => {
    if (!user) {
      toast.error("Login Required", { description: "Please log in to purchase premium odds." })
      return
    }

    if (walletBalance < 10000) {
      toast.error("Insufficient Balance", {
        description: "You need KES 10,000 to purchase premium sure odds.",
      })
      return
    }

    setIsLoadingPremiumOdds(true)
    try {
      console.log("💎 Starting premium sure odds purchase for user:", user.id)
      const response = await api.purchaseSureOdd()
      console.log("💎 Purchase API response:", response)
      if (response.data && (response.status === 200 || response.status === 201)) {
        await fetchWalletBalance()
        setWalletBalance((prev) => prev - 10000)
        pollForPremiumOdd()
        toast.success("Payment Successful!", {
          description: "KES 10,000 deducted. Waiting for premium sure odd assignment...",
        })
      } else {
        throw new Error(response.error || "Payment failed")
      }
    } catch (error: unknown) {
      console.error("❌ Error purchasing premium odds:", error)
      toast.error("Payment Failed", {
        description: error instanceof Error ? error.message : "Could not process payment. Please try again.",
      })
      setIsLoadingPremiumOdds(false)
    }
  }, [user, walletBalance, fetchWalletBalance, pollForPremiumOdd, setIsLoadingPremiumOdds])

  const initializeStars = useCallback(() => {
    const stars: StarType[] = []
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * 800,
        y: Math.random() * 300,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
      })
    }
    starsRef.current = stars
  }, [])

  const handlePlaceBet = useCallback(
    async (betNumber: 1 | 2) => {
      if (!user) {
        toast.error("Login Required", { description: "Please log in to place bets." })
        return
      }

      if (!isConnected) {
        toast.error("Connection Error", { description: "Not connected to game server." })
        return
      }

      if (betNumber === 1 ? hasBet1 : hasBet2) {
        toast.info("Bet Already Placed", { description: "You can only place one bet per panel per round." })
        return
      }

      if (!isBettingPhase) {
        toast.error("Betting Phase Closed", { description: "Wait for the next round to place a bet." })
        return
      }

      const betAmount = betNumber === 1 ? betAmount1 : betAmount2
      const parsedBetAmount = Number.parseFloat(betAmount)

      if (isNaN(parsedBetAmount) || parsedBetAmount < 10 || parsedBetAmount > 10000) {
        toast.error("Invalid Bet Amount", { description: "Bet must be between 10 and 10,000 KES." })
        return
      }

      if (parsedBetAmount > walletBalance) {
        toast.error("Insufficient Balance", { description: "Please deposit funds to place this bet." })
        return
      }

      const autoCashout = betNumber === 1 ? autoCashout1 : autoCashout2
      const parsedAutoCashout = autoCashout ? Number.parseFloat(autoCashout) : undefined

      if (parsedAutoCashout && (isNaN(parsedAutoCashout) || parsedAutoCashout < 1.01)) {
        toast.error("Invalid Auto Cashout", { description: "Auto cashout must be at least 1.01x." })
        return
      }

      try {
        const payload = {
          amount: parsedBetAmount,
          user_id: user.id,
          auto_cashout: parsedAutoCashout,
        }
        console.log("🎲 Placing bet via WebSocket:", payload)
        await placeBet(payload)
        if (betNumber === 1) setHasBet1(true)
        else setHasBet2(true)
        setWalletBalance((prev) => prev - parsedBetAmount)
        console.log("✅ Bet placed successfully")
      } catch (error: unknown) {
        console.error("❌ Error placing bet:", error)
        toast.error("Error Placing Bet", {
          description: error instanceof Error ? error.message : "Network error or server issue. Please try again.",
        })
      }
    },
    [
      user,
      isConnected,
      hasBet1,
      hasBet2,
      isBettingPhase,
      betAmount1,
      betAmount2,
      walletBalance,
      autoCashout1,
      autoCashout2,
      placeBet,
      setHasBet1,
      setHasBet2,
      setWalletBalance,
    ],
  )

  // Initialize game on mount
  useEffect(() => {
    console.log("🎮 Initializing Aviator Game")
    setIsInitialized(false)
    setIsFirstLoad(true)
    setIsBettingPhase(true)
    setRoundCountdown(5)
    setHasBet1(false)
    setHasBet2(false)
    setShowCrashScreen(false)
    setLastCrashRoundId(null)
    setGamePhase("waiting")
    lastMultiplierRef.current = 1.0
    smoothMultiplierRef.current = 1.0
    crashMultiplierRef.current = 1.0

    connect()
    loadGameData()
    fetchWalletBalance()
    initializeStars()
    startLazerSignalTimer()

    if (user) {
      checkExistingPremiumOdds()
    }

    const initTimer = setTimeout(() => {
      console.log("✅ Game initialized")
      setIsInitialized(true)
    }, 2000)

    return () => {
      console.log("🧹 Cleaning up Aviator Game")
      clearTimeout(initTimer)
      disconnect()
      isAnimatingRef.current = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (lazerSignalTimer.current) {
        clearInterval(lazerSignalTimer.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [
    connect,
    disconnect,
    fetchWalletBalance,
    checkExistingPremiumOdds,
    startLazerSignalTimer,
    user,
    loadGameData,
    initializeStars,
  ])

  // Sync WebSocket wallet balance
  useEffect(() => {
    if (wsBalance !== walletBalance && wsBalance > 0) {
      console.log("💰 Updating wallet balance from WebSocket:", wsBalance)
      setWalletBalance(wsBalance)
    }
  }, [wsBalance, walletBalance, setWalletBalance])

  // Debug state transitions
  useEffect(() => {
    console.log("🔄 State Update:", {
      isRoundActive,
      isBettingPhase,
      showCrashScreen,
      currentRoundId,
      currentMultiplier,
      roundCountdown,
      gamePhase,
    })
  }, [isRoundActive, isBettingPhase, showCrashScreen, currentRoundId, currentMultiplier, roundCountdown, gamePhase])

  // Handle round state changes with improved timing
  useEffect(() => {
    console.log("🔄 Round active state changed:", isRoundActive, "Initialized:", isInitialized)

    if (isFirstLoad) {
      console.log("⏳ Skipping first load round handling")
      setIsFirstLoad(false)
      return
    }

    if (!isRoundActive && prevRoundActiveRef.current && isInitialized && lastCrashRoundId !== currentRoundId) {
      console.log("🏁 Round ended, handling crash")
      handleRoundEnd()
      setIsBettingPhase(true)
      setRoundCountdown(5)
      setHasBet1(false)
      setHasBet2(false)

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

      countdownIntervalRef.current = setInterval(() => {
        setRoundCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!)
            setIsBettingPhase(false)
            loadGameData()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (isRoundActive && isInitialized) {
      console.log("🚀 Round started, initializing canvas")
      setIsBettingPhase(false)
      setShowCrashScreen(false)
      setGamePhase("flying")

      // Reset all animation references for new round
      lastMultiplierRef.current = 1.0
      smoothMultiplierRef.current = 1.0
      crashMultiplierRef.current = 1.0

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

      // Start canvas animation
      initCanvas()
    }

    prevRoundActiveRef.current = isRoundActive
  }, [
    isRoundActive,
    isInitialized,
    currentRoundId,
    handleRoundEnd,
    isFirstLoad,
    lastCrashRoundId,
    initCanvas,
    loadGameData,
    setIsBettingPhase,
    setRoundCountdown,
    setHasBet1,
    setHasBet2,
  ])

  // Handle auto cashout and multiplier updates
  useEffect(() => {
    if (isRoundActive && gamePhase === "flying") {
      // Handle auto cashouts
      if (hasBet1 && autoCashout1) {
        const parsedAutoCashout = Number.parseFloat(autoCashout1)
        if (parsedAutoCashout && currentMultiplier >= parsedAutoCashout) {
          handleCashOut(1)
        }
      }

      if (hasBet2 && autoCashout2) {
        const parsedAutoCashout = Number.parseFloat(autoCashout2)
        if (parsedAutoCashout && currentMultiplier >= parsedAutoCashout) {
          handleCashOut(2)
        }
      }
    }
  }, [currentMultiplier, hasBet1, hasBet2, autoCashout1, autoCashout2, isRoundActive, gamePhase, handleCashOut])

  // Initialize canvas when betting phase ends
  useEffect(() => {
    if (!isBettingPhase && !animationRef.current && isInitialized && isRoundActive) {
      console.log("🎨 Initializing canvas for active round")
      initCanvas()
    }
  }, [isBettingPhase, isInitialized, isRoundActive, initCanvas])

  const adjustAmount = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>, increment: boolean, step: number) => {
      setter((prev) => {
        const current = Number.parseFloat(prev) || 0
        const newAmount = increment ? current + step : Math.max(10, current - step)
        return newAmount.toFixed(2)
      })
    },
    [],
  )

  const calculatePotentialWin = useCallback((betAmount: string, multiplier: number) => {
    const amount = Number.parseFloat(betAmount) || 0
    return (amount * multiplier).toFixed(2)
  }, [])

  const getBetMultiplierProgress = useCallback((multiplier: number) => {
    return Math.min((multiplier - 1) * 15, 100)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Glassmorphism Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/30 to-slate-900/95 backdrop-blur-3xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-black/60"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay"></div>
      </div>

      {/* Floating Glass Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse backdrop-blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000 backdrop-blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 rounded-full blur-2xl animate-pulse delay-500 backdrop-blur-3xl"></div>
      </div>

      {/* Lazer Signal Glass Modal */}
      {showLazerSignal && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right-5 duration-500">
          <div className="relative max-w-xs w-full">
            {/* Glass glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 rounded-2xl blur-xl animate-pulse"></div>

            <Card className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Inner glass reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"></div>

              <Button
                variant="ghost"
                onClick={handleDismissLazerSignal}
                className="absolute -top-2 -right-2 z-10 h-6 w-6 p-0 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full border border-white/20 backdrop-blur-xl"
              >
                <X className="w-3 h-3" />
              </Button>

              <CardContent className="p-4 space-y-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500/80 via-orange-500/80 to-red-500/80 rounded-full flex items-center justify-center shadow-lg animate-pulse backdrop-blur-xl">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 animate-ping">
                      <Star className="w-3 h-3 text-amber-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                      ⚡ LAZER SIGNAL
                    </h3>
                    <p className="text-xs text-amber-400/80">Premium Sure Odds</p>
                  </div>
                </div>

                {!isLoadingPremiumOdds && !hasPurchasedPremium && (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-3 border border-amber-500/20 backdrop-blur-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-medium text-white/90">Premium Odds</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-amber-400">KES 10K</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/70">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span>99% Accuracy</span>
                      </div>
                    </div>

                    {walletBalance < 10000 && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2 flex items-center gap-2 backdrop-blur-xl">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <div className="text-xs">
                          <p className="text-red-400 font-medium">Need KES {(10000 - walletBalance).toFixed(0)} more</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleDismissLazerSignal}
                        className="flex-1 bg-white/5 border-white/20 hover:bg-white/10 text-white/80 h-8 text-xs backdrop-blur-xl"
                      >
                        Later
                      </Button>
                      <Button
                        onClick={handlePayForPremiumOdds}
                        disabled={walletBalance < 10000}
                        className="flex-1 bg-gradient-to-r from-amber-500/80 to-orange-500/80 hover:from-amber-600/80 hover:to-orange-600/80 text-white font-bold h-8 text-xs disabled:opacity-50 backdrop-blur-xl"
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        Buy
                      </Button>
                    </div>
                  </div>
                )}

                {isLoadingPremiumOdds && (
                  <div className="space-y-3">
                    <div className="text-center space-y-2">
                      <div className="w-8 h-8 mx-auto bg-gradient-to-br from-blue-500/80 to-purple-500/80 rounded-full flex items-center justify-center backdrop-blur-xl">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-400">Processing...</p>
                        <p className="text-xs text-white/70">Waiting for premium odd</p>
                      </div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2 text-center backdrop-blur-xl">
                      <p className="text-xs text-white/90">Payment successful!</p>
                      <p className="text-xs text-white/70">KES 10,000 deducted</p>
                    </div>
                  </div>
                )}

                {hasPurchasedPremium && premiumSureOdd && (
                  <div className="space-y-3">
                    <div className="text-center space-y-2">
                      <div className="w-8 h-8 mx-auto bg-gradient-to-br from-green-500/80 to-emerald-500/80 rounded-full flex items-center justify-center backdrop-blur-xl">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-medium text-green-400">Premium Odd Ready!</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-3 border border-green-500/20 text-center backdrop-blur-xl">
                      <p className="text-xs text-green-400 mb-1">Your Sure Odd:</p>
                      <div className="text-2xl font-bold text-green-400 animate-pulse">
                        {premiumSureOdd.toFixed(2)}x
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowLazerSignal(false)}
                      className="w-full bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600/80 hover:to-emerald-600/80 text-white font-bold h-8 text-xs backdrop-blur-xl"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Got It!
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Glass Header */}
      <div className="sticky top-0 z-50 bg-white/5 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5"></div>
        <div className="max-w-7xl mx-auto px-3 py-3 relative z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500/80 to-orange-500/80 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-xl border border-white/20">
                    <Plane className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    Aviator
                  </h1>
                </div>
              </div>
              <Badge
                variant={isConnected ? "success" : "danger"}
                className={cn(
                  "border px-3 py-1 text-xs font-bold backdrop-blur-xl",
                  isConnected
                    ? "bg-green-500/20 text-green-400 border-green-500/40"
                    : "bg-red-500/20 text-red-400 border-red-500/40",
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full mr-1", isConnected ? "bg-green-400" : "bg-red-400")}></div>
                {isConnected ? "LIVE" : "OFF"}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {premiumSureOdd && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-3 py-2 rounded-xl border border-green-500/30 shadow-lg backdrop-blur-xl">
                  <Crown className="w-4 h-4" />
                  <span className="font-bold text-sm">
                    <span className="hidden sm:inline">Premium: </span>
                    {premiumSureOdd.toFixed(2)}x
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/20 backdrop-blur-xl">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <WalletBalance />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden bg-white/10 border-white/20 hover:bg-white/20 h-10 w-10 p-0 backdrop-blur-xl"
              >
                {showSidebar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 py-4 relative z-10">
        {/* Glass Recent Crashes Bar */}
        <div className="mb-4 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            <div className="flex items-center bg-white/10 px-3 py-2 rounded-xl border border-white/20 text-sm backdrop-blur-xl">
              <History className="w-4 h-4 mr-2 text-white/70" />
              <span className="font-medium text-white/90">Recent:</span>
            </div>
            {premiumSureOdd && (
              <div className="flex md:hidden items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-3 py-2 rounded-xl border border-green-500/30 text-sm font-bold animate-pulse backdrop-blur-xl">
                <Crown className="w-4 h-4" />
                <span>Sure: {premiumSureOdd.toFixed(2)}x</span>
              </div>
            )}
            {pastCrashes.slice(0, 10).map((crash, index) => (
              <div
                key={index}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-bold min-w-[60px] text-center border backdrop-blur-xl",
                  crash < 2
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : crash < 5
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : crash < 10
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-blue-500/20 text-blue-400 border-blue-500/30",
                )}
              >
                {crash.toFixed(2)}x
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-4">
            {/* Glass Game Canvas */}
            <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"></div>
              <CardContent className="p-0 relative z-10">
                {isBettingPhase || !isInitialized ? (
                  <div className="flex flex-col items-center justify-center h-[250px] sm:h-[300px] bg-gradient-to-br from-slate-900/50 via-purple-900/30 to-slate-800/50 relative overflow-hidden rounded-2xl backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/10 to-pink-500/5 animate-pulse"></div>
                    <div className="relative z-10 text-center">
                      {!isInitialized ? (
                        <>
                          <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 animate-pulse">
                            Connecting...
                          </div>
                          <div className="text-base sm:text-xl text-white/90 mb-3 font-semibold">Initializing game</div>
                          <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Please wait...</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-3 animate-pulse">
                            {roundCountdown}
                          </div>
                          <div className="text-base sm:text-xl text-white/90 mb-3 font-semibold">
                            Next round starting...
                          </div>
                          <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                            <Clock className="w-5 h-5 animate-spin" />
                            <span>Get ready!</span>
                          </div>
                        </>
                      )}
                    </div>
                    {isInitialized && (
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${((5 - roundCountdown) / 5) * 100}%` }}
                      ></div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={300}
                      className="w-full h-[250px] sm:h-[300px] rounded-2xl"
                    ></canvas>
                    {showCrashScreen && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-500/20 via-red-600/10 to-red-500/20 backdrop-blur-xl rounded-2xl">
                        <div className="text-center">
                          <div className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-3 animate-pulse">
                            CRASHED!
                          </div>
                          <div className="text-lg sm:text-2xl text-white/90 font-semibold">
                            at {crashMultiplierRef.current.toFixed(2)}x
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Glass Betting Panels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2].map((betNumber) => {
                const currentBetAmount = betNumber === 1 ? betAmount1 : betAmount2
                const currentAutoCashout = betNumber === 1 ? autoCashout1 : autoCashout2
                const hasActiveBet = betNumber === 1 ? hasBet1 : hasBet2
                const potentialWin = calculatePotentialWin(currentBetAmount, currentMultiplier)

                return (
                  <div
                    key={betNumber}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all duration-300",
                      betNumber === 1
                        ? "bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-blue-500/10 border-blue-500/20"
                        : "bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-purple-500/10 border-purple-500/20",
                      hasActiveBet && isRoundActive && "ring-2 ring-green-400/50 animate-pulse",
                    )}
                  >
                    {/* Glass reflection overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"></div>

                    {/* Floating icon */}
                    <div className="absolute top-3 right-3 w-12 h-12 opacity-10">
                      {betNumber === 1 ? (
                        <Rocket className="w-full h-full text-blue-400" />
                      ) : (
                        <Target className="w-full h-full text-purple-400" />
                      )}
                    </div>

                    <div className="relative p-4 space-y-4 z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg backdrop-blur-xl border border-white/20",
                              betNumber === 1
                                ? "bg-gradient-to-br from-blue-500/80 to-blue-600/80"
                                : "bg-gradient-to-br from-purple-500/80 to-purple-600/80",
                            )}
                          >
                            {betNumber}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white/90">Bet {betNumber}</h3>
                            <p className="text-xs text-white/60">Quick bet</p>
                          </div>
                        </div>
                        {hasActiveBet && isRoundActive && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/40 px-2 py-1 text-xs animate-pulse backdrop-blur-xl">
                            <Activity className="w-3 h-3 mr-1" />
                            LIVE
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-white/70 mb-2 block font-medium">Amount (KES)</label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => adjustAmount(betNumber === 1 ? setBetAmount1 : setBetAmount2, false, 10)}
                              className={cn(
                                "h-9 w-9 p-0 rounded-xl border transition-all duration-200 backdrop-blur-xl",
                                betNumber === 1
                                  ? "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30 text-blue-300"
                                  : "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30 text-purple-300",
                              )}
                              disabled={!isBettingPhase}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              value={currentBetAmount}
                              onChange={(e) => (betNumber === 1 ? setBetAmount1 : setBetAmount2)(e.target.value)}
                              className={cn(
                                "text-center h-9 text-sm font-bold border transition-all duration-200 backdrop-blur-xl bg-white/5",
                                betNumber === 1
                                  ? "border-blue-500/30 focus:border-blue-400 text-blue-100"
                                  : "border-purple-500/30 focus:border-purple-400 text-purple-100",
                              )}
                              min="10"
                              max="10000"
                              step="10"
                              disabled={!isBettingPhase}
                            />
                            <Button
                              variant="outline"
                              onClick={() => adjustAmount(betNumber === 1 ? setBetAmount1 : setBetAmount2, true, 10)}
                              className={cn(
                                "h-9 w-9 p-0 rounded-xl border transition-all duration-200 backdrop-blur-xl",
                                betNumber === 1
                                  ? "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30 text-blue-300"
                                  : "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30 text-purple-300",
                              )}
                              disabled={!isBettingPhase}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-white/70 mb-2 block font-medium">Auto Cashout (x)</label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() =>
                                adjustAmount(betNumber === 1 ? setAutoCashout1 : setAutoCashout2, false, 0.1)
                              }
                              className={cn(
                                "h-9 w-9 p-0 rounded-xl border transition-all duration-200 backdrop-blur-xl",
                                betNumber === 1
                                  ? "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30 text-blue-300"
                                  : "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30 text-purple-300",
                              )}
                              disabled={!isBettingPhase}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              value={currentAutoCashout}
                              onChange={(e) => (betNumber === 1 ? setAutoCashout1 : setAutoCashout2)(e.target.value)}
                              className={cn(
                                "text-center h-9 text-sm font-bold border transition-all duration-200 backdrop-blur-xl bg-white/5",
                                betNumber === 1
                                  ? "border-blue-500/30 focus:border-blue-400 text-blue-100"
                                  : "border-purple-500/30 focus:border-purple-400 text-purple-100",
                              )}
                              placeholder="2.00"
                              min="1.01"
                              step="0.1"
                              disabled={!isBettingPhase}
                            />
                            <Button
                              variant="outline"
                              onClick={() =>
                                adjustAmount(betNumber === 1 ? setAutoCashout1 : setAutoCashout2, true, 0.1)
                              }
                              className={cn(
                                "h-9 w-9 p-0 rounded-xl border transition-all duration-200 backdrop-blur-xl",
                                betNumber === 1
                                  ? "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30 text-blue-300"
                                  : "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30 text-purple-300",
                              )}
                              disabled={!isBettingPhase}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {hasActiveBet && isRoundActive && (
                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-green-500/30 backdrop-blur-xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-white/80 font-medium">Potential Win:</span>
                            <span className="text-sm font-bold text-green-400 animate-pulse">KES {potentialWin}</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-xl">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300 rounded-full"
                              style={{ width: `${getBetMultiplierProgress(currentMultiplier)}%` }}
                            ></div>
                          </div>
                          <div className="text-center text-xs text-white/70 mt-2">
                            @ {currentMultiplier.toFixed(2)}x
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => handlePlaceBet(betNumber as 1 | 2)}
                          disabled={!isConnected || !user || !isBettingPhase || hasActiveBet}
                          className="bg-gradient-to-r from-amber-500/80 to-orange-500/80 hover:from-amber-600/80 hover:to-orange-600/80 text-white font-bold h-10 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 text-sm backdrop-blur-xl border border-amber-500/30"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Bet
                        </Button>
                        <Button
                          onClick={() => handleCashOut(betNumber as 1 | 2)}
                          disabled={!isConnected || !user || !isRoundActive || !hasActiveBet}
                          className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600/80 hover:to-emerald-600/80 text-white font-bold h-10 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 text-sm backdrop-blur-xl border border-green-500/30"
                        >
                          <Banknote className="w-4 h-4 mr-1" />
                          {hasActiveBet && isRoundActive ? (
                            <div className="flex flex-col items-center leading-tight">
                              <span>Cash</span>
                              <span className="text-xs opacity-90">{currentMultiplier.toFixed(2)}x</span>
                            </div>
                          ) : (
                            "Cash"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Glass Sidebar */}
          <div className={cn("space-y-4", showSidebar ? "block" : "hidden lg:block")}>
            <Tabs defaultValue="winners" className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-white/10 border border-white/20 backdrop-blur-2xl rounded-xl h-10">
                <TabsTrigger
                  value="winners"
                  className="data-[state=active]:bg-white/20 rounded-lg text-xs py-2 text-white/80 data-[state=active]:text-white backdrop-blur-xl"
                >
                  <Trophy className="w-3 h-3 mr-1" />
                  Top
                </TabsTrigger>
                <TabsTrigger
                  value="live"
                  className="data-[state=active]:bg-white/20 rounded-lg text-xs py-2 text-white/80 data-[state=active]:text-white backdrop-blur-xl"
                >
                  <Users className="w-3 h-3 mr-1" />
                  Live
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="data-[state=active]:bg-white/20 rounded-lg text-xs py-2 text-white/80 data-[state=active]:text-white backdrop-blur-xl"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Stats
                </TabsTrigger>
              </TabsList>

              <TabsContent value="winners">
                <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"></div>
                  <CardContent className="p-4 space-y-3 relative z-10">
                    <h3 className="font-bold text-sm flex items-center text-white/90">
                      <Trophy className="w-4 h-4 mr-2 text-amber-400" />
                      Top Winners
                    </h3>
                    {topWinners.length > 0 ? (
                      <div className="space-y-2">
                        {topWinners.slice(0, 5).map((winner, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500/80 to-orange-500/80 flex items-center justify-center text-xs font-bold text-white backdrop-blur-xl">
                                {winner.username ? winner.username.charAt(0).toUpperCase() : "?"}
                              </div>
                              <div>
                                <div className="font-medium text-xs text-white/90">{winner.username}</div>
                                <div className="text-xs text-white/60">
                                  {winner.cashed_out_at !== undefined ? `${winner.cashed_out_at.toFixed(2)}x` : "—"}
                                </div>
                              </div>
                            </div>
                            <div className="text-green-400 font-bold text-xs">
                              KES {Number.parseFloat(winner.amount).toFixed(0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-white/60 text-xs">No winners yet</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="live">
                <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"></div>
                  <CardContent className="p-4 space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm flex items-center text-white/90">
                        <Users className="w-4 h-4 mr-2 text-blue-400" />
                        Live Bets
                      </h3>
                      <Badge
                        variant="primary"
                        className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs px-2 py-1 backdrop-blur-xl"
                      >
                        {livePlayers || 0}
                      </Badge>
                    </div>
                    {recentCashouts.length > 0 ? (
                      <div className="space-y-2">
                        {recentCashouts.slice(0, 5).map((bet, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/80 to-purple-500/80 flex items-center justify-center text-xs font-bold text-white backdrop-blur-xl">
                                {(bet.username || "A").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-xs text-white/90">{bet.username || "Anonymous"}</div>
                                {bet.cashout_multiplier !== undefined && (
                                  <div className="text-xs text-white/60">{bet.cashout_multiplier.toFixed(2)}x</div>
                                )}
                              </div>
                            </div>
                            <div className="text-green-400 font-bold text-xs">
                              KES {Number(bet.amount || 0).toFixed(0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-white/60 text-xs">No live bets</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stats">
                <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"></div>
                  <CardContent className="p-4 space-y-4 relative z-10">
                    <h3 className="font-bold text-sm flex items-center text-white/90">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
                      Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 backdrop-blur-xl">
                        <div className="text-xs text-white/70 mb-1">High</div>
                        <div className="text-lg font-bold text-amber-400">
                          {Math.max(...pastCrashes, 1).toFixed(2)}x
                        </div>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 backdrop-blur-xl">
                        <div className="text-xs text-white/70 mb-1">Low</div>
                        <div className="text-lg font-bold text-red-400">{Math.min(...pastCrashes, 10).toFixed(2)}x</div>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 backdrop-blur-xl">
                      <div className="text-xs text-white/70 mb-1">Average</div>
                      <div className="text-lg font-bold text-blue-400">
                        {pastCrashes.length > 0
                          ? (pastCrashes.reduce((a, b) => a + b, 0) / pastCrashes.length).toFixed(2)
                          : "0.00"}
                        x
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Glass Quick Bets */}
            <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"></div>
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white/90">Quick Bets</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[50, 100, 200, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      className="bg-white/10 border-white/20 hover:bg-white/20 h-8 text-xs font-bold transition-all duration-300 text-white/80 hover:text-white backdrop-blur-xl"
                      onClick={() => {
                        setBetAmount1(amount.toString())
                        setBetAmount2(amount.toString())
                      }}
                      disabled={!isBettingPhase}
                    >
                      KES {amount}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
