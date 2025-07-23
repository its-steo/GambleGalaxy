"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
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
  const [sureOdds, setSureOdds] = useState<number | null>(null)
  const [isBettingPhase, setIsBettingPhase] = useState(true)
  const [roundCountdown, setRoundCountdown] = useState(5)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [showLazerSignal, setShowLazerSignal] = useState(false)
  const [isLoadingPremiumOdds, setIsLoadingPremiumOdds] = useState(false)
  const [premiumSureOdd, setPremiumSureOdd] = useState<number | null>(null)
  const [hasPurchasedPremium, setHasPurchasedPremium] = useState(false)
  // New states for crash screen control
  const [showCrashScreen, setShowCrashScreen] = useState(false)
  const [lastCrashRoundId, setLastCrashRoundId] = useState<string | null>(null)

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const prevRoundActiveRef = useRef<boolean>(isRoundActive)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const planePositionRef = useRef({ x: 80, y: 300 })
  const lastMultiplierRef = useRef<number>(1.0)
  const trailPointsRef = useRef<Array<{ x: number; y: number; opacity: number; size: number }>>([])
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number }>>([])
  const starsRef = useRef<Array<{ x: number; y: number; size: number; opacity: number; twinkle: number }>>([])
  const velocityRef = useRef({ x: 0, y: 0 })
  const smoothMultiplierRef = useRef<number>(1.0)
  const lazerSignalTimer = useRef<NodeJS.Timeout | null>(null)

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
    lastMultiplierRef.current = 1.0
    smoothMultiplierRef.current = 1.0

    connect()
    loadGameData()
    fetchWalletBalance()
    fetchSureOdds()
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
  }, [connect, disconnect, user])

  // Sync WebSocket wallet balance
  useEffect(() => {
    if (wsBalance !== walletBalance && wsBalance > 0) {
      console.log("💰 Updating wallet balance from WebSocket:", wsBalance)
      setWalletBalance(wsBalance)
    }
  }, [wsBalance])

  // Debug state transitions
  useEffect(() => {
    console.log("🔄 State Update:", {
      isRoundActive,
      isBettingPhase,
      showCrashScreen,
      currentRoundId,
      currentMultiplier,
      roundCountdown,
    })
  }, [isRoundActive, isBettingPhase, showCrashScreen, currentRoundId, currentMultiplier, roundCountdown])

  // Handle round state changes
  useEffect(() => {
    console.log("🔄 Round active state changed:", isRoundActive, "Initialized:", isInitialized)

    if (isFirstLoad) {
      console.log("⏳ Skipping first load round handling")
      setIsFirstLoad(false)
      return
    }

    if (!isRoundActive && prevRoundActiveRef.current && isInitialized && lastCrashRoundId !== currentRoundId) {
      console.log("🏁 Round ended, updating crash history")
      handleRoundEnd()
      setIsBettingPhase(true)
      setRoundCountdown(5)
      setHasBet1(false)
      setHasBet2(false)
      lastMultiplierRef.current = 1.0
      smoothMultiplierRef.current = 1.0

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
      lastMultiplierRef.current = 1.0
      smoothMultiplierRef.current = 1.0
      velocityRef.current = { x: 0, y: 0 }
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      initCanvas()
    }

    prevRoundActiveRef.current = isRoundActive
  }, [isRoundActive, isInitialized, currentRoundId])

  // Reset multiplier at round start
  useEffect(() => {
    if (isRoundActive && isInitialized) {
      console.log("🚀 Round started, resetting multiplier")
      lastMultiplierRef.current = 1.0
      smoothMultiplierRef.current = 1.0
    }
  }, [isRoundActive, isInitialized])

  // Handle auto cashout
useEffect(() => {
  if (isRoundActive) {
    const targetMultiplier = Number.isFinite(currentMultiplier) ? currentMultiplier : 1.0;
    const smoothingFactor = 0.15;
    smoothMultiplierRef.current += (targetMultiplier - smoothMultiplierRef.current) * smoothingFactor;
    lastMultiplierRef.current = smoothMultiplierRef.current;

    console.log("🔄 Updating multiplier:", {
      currentMultiplier,
      smoothMultiplier: smoothMultiplierRef.current,
      isRoundActive,
    });

    if (hasBet1 && autoCashout1) {
      const parsedAutoCashout = Number.parseFloat(autoCashout1);
      if (parsedAutoCashout && currentMultiplier >= parsedAutoCashout) {
        handleCashOut(1);
      }
    }
    if (hasBet2 && autoCashout2) {
      const parsedAutoCashout = Number.parseFloat(autoCashout2);
      if (parsedAutoCashout && currentMultiplier >= parsedAutoCashout) {
        handleCashOut(2);
      }
    }
  }
}, [currentMultiplier, hasBet1, hasBet2, autoCashout1, autoCashout2, isRoundActive])

  // Initialize canvas when betting phase ends
  useEffect(() => {
    if (!isBettingPhase && !animationRef.current && isInitialized && isRoundActive) {
      console.log("🎨 Initializing canvas for active round")
      initCanvas()
    }
  }, [isBettingPhase, isInitialized, isRoundActive])

  const fetchWalletBalance = async () => {
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
  }

  const loadGameData = async () => {
    try {
      const [winnersRes, crashesRes] = await Promise.all([api.getTopWinners(), api.getPastCrashes()])
      console.log("📊 Loaded game data:", { winners: winnersRes.data, crashes: crashesRes.data })
      if (winnersRes.data) setTopWinners(winnersRes.data)
      if (crashesRes.data) setPastCrashes(crashesRes.data.map((round: any) => round.multiplier))
    } catch (error) {
      console.error("❌ Error loading game data:", error)
      toast.error("Failed to load game data", { description: "Could not fetch game data." })
    }
  }

  const fetchSureOdds = async () => {
    try {
      const res = await api.getUserSureOdds()
      console.log("🎯 Sure odds fetched:", res.data)
      if (res.data && res.data.length > 0 && typeof res.data[0].odd === "string") {
        setSureOdds(Number.parseFloat(res.data[0].odd))
      }
    } catch (error) {
      console.warn("⚠️ Error fetching sure odds:", error)
    }
  }

  const handlePlaceBet = async (betNumber: 1 | 2) => {
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
    } catch (error: any) {
      console.error("❌ Error placing bet:", error)
      toast.error("Error Placing Bet", {
        description: error.message || "Network error or server issue. Please try again.",
      })
    }
  }

  const handleCashOut = async (betNumber: 1 | 2) => {
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
    } catch (error: any) {
      console.error("❌ Error cashing out:", error)
      toast.error("Error Cashing Out", { description: error.message || "Failed to cash out. Please try again." })
    }
  }

  const handlePayForPremiumOdds = async () => {
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
    } catch (error: any) {
      console.error("❌ Error purchasing premium odds:", error)
      toast.error("Payment Failed", {
        description: error.message || "Could not process payment. Please try again.",
      })
      setIsLoadingPremiumOdds(false)
    }
  }

  const pollForPremiumOdd = () => {
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
    setTimeout(() => {
      clearInterval(pollInterval)
      if (isLoadingPremiumOdds) {
        setIsLoadingPremiumOdds(false)
        toast.error("Timeout", {
          description: "Premium sure odd assignment timed out. Contact support.",
        })
      }
    }, 10 * 60 * 1000)
  }

  const checkExistingPremiumOdds = async () => {
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
  }

  const startLazerSignalTimer = () => {
    if (lazerSignalTimer.current) {
      clearInterval(lazerSignalTimer.current)
    }
    const timer = setInterval(() => {
      if (!showLazerSignal) {
        setShowLazerSignal(true)
        console.log("⚡ Lazer Signal appeared!")
      }
    }, 5 * 60 * 1000)
    lazerSignalTimer.current = timer
  }

  const handleDismissLazerSignal = () => {
    setShowLazerSignal(false)
  }

  const handleRoundEnd = async () => {
    try {
      console.log("🏁 Handling round end, current multiplier:", currentMultiplier)
      setPastCrashes((prev) => [currentMultiplier, ...prev].slice(0, 12))
      setShowCrashScreen(true)
      setLastCrashRoundId(currentRoundId !== null ? String(currentRoundId) : null)

      const crashesRes = await api.getPastCrashes()
      if (crashesRes.data) {
        setPastCrashes(crashesRes.data.map((round: any) => round.multiplier).slice(0, 12))
      }

      try {
        const response = await fetch("/sounds/crash.mp3", { method: "HEAD" })
        if (response.ok) {
          const audio = new Audio("/sounds/crash.mp3")
          await audio.play()
        }
      } catch (err) {
        console.warn("🔇 Crash sound not available:", err)
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = 0
      }

      setTimeout(() => {
        setShowCrashScreen(false)
      }, 3000)
    } catch (error) {
      console.error("❌ Error in handleRoundEnd:", error)
    }
  }

  const initializeStars = () => {
    const stars = []
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
  }

  const initCanvas = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    planePositionRef.current = { x: 80, y: canvas.height - 80 }
    trailPointsRef.current = []
    particlesRef.current = []
    lastMultiplierRef.current = 1.0
    smoothMultiplierRef.current = 1.0
    velocityRef.current = { x: 0, y: 0 }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const drawGame = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

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

      starsRef.current.forEach((star) => {
        star.twinkle += 0.03
        const twinkleOpacity = star.opacity * (0.4 + 0.6 * Math.sin(star.twinkle))
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

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

      if (isRoundActive) {
        const targetSpeed = 2.2 + smoothMultiplierRef.current * 0.12
        const acceleration = 0.08
        velocityRef.current.x += (targetSpeed - velocityRef.current.x) * acceleration
        planePositionRef.current.x += velocityRef.current.x

        const baseY = canvas.height - 80
        const multiplierFactor = Math.log(Math.max(1, smoothMultiplierRef.current)) * 65
        const targetY = Math.max(50, baseY - multiplierFactor)
        const yDiff = targetY - planePositionRef.current.y
        velocityRef.current.y += yDiff * 0.02
        velocityRef.current.y *= 0.85
        planePositionRef.current.y += velocityRef.current.y

        if (planePositionRef.current.x > canvas.width - 100) {
          planePositionRef.current.x = canvas.width - 100
        }

        if (Math.random() < 0.4) {
          const angle = Math.atan2(velocityRef.current.y, velocityRef.current.x)
          particlesRef.current.push({
            x: planePositionRef.current.x - 35 + Math.cos(angle + Math.PI) * 20,
            y: planePositionRef.current.y + Math.sin(angle + Math.PI) * 20 + (Math.random() - 0.5) * 8,
            vx: -3 - Math.random() * 2 + Math.cos(angle + Math.PI) * 2,
            vy: (Math.random() - 0.5) * 3 + Math.sin(angle + Math.PI) * 2,
            life: 35,
            maxLife: 35,
          })
        }
      }

      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vx *= 0.98
        particle.vy *= 0.98
        particle.life--

        const alpha = (particle.life / particle.maxLife) * 0.9
        const size = (particle.life / particle.maxLife) * 3
        const particleGradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, size * 2)
        particleGradient.addColorStop(0, `rgba(255, ${120 + alpha * 135}, ${60 + alpha * 60}, ${alpha})`)
        particleGradient.addColorStop(0.7, `rgba(255, ${80 + alpha * 100}, ${40 + alpha * 40}, ${alpha * 0.6})`)
        particleGradient.addColorStop(1, `rgba(255, 60, 20, 0)`)
        ctx.fillStyle = particleGradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
        ctx.fill()
        return particle.life > 0
      })

      if (isRoundActive) {
        trailPointsRef.current.push({
          x: planePositionRef.current.x,
          y: planePositionRef.current.y,
          opacity: 1,
          size: 2 + smoothMultiplierRef.current * 0.3,
        })
        if (trailPointsRef.current.length > 100) {
          trailPointsRef.current.shift()
        }
        trailPointsRef.current.forEach((point, index) => {
          point.opacity = (index / trailPointsRef.current.length) * 0.95
        })
      }

      if (trailPointsRef.current.length > 2) {
        const trailColor = getMultiplierColor(smoothMultiplierRef.current)
        ctx.lineWidth = 12
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.shadowColor = trailColor
        ctx.shadowBlur = 25
        ctx.globalAlpha = 0.2
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
        ctx.lineWidth = 6
        ctx.shadowBlur = 15
        ctx.globalAlpha = 0.6
        ctx.stroke()
        ctx.lineWidth = 3
        ctx.shadowBlur = 8
        ctx.globalAlpha = 1
        ctx.strokeStyle = `rgba(255, 255, 255, 0.95)`
        ctx.stroke()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }

      const planeSize = 60
      ctx.save()
      ctx.translate(planePositionRef.current.x, planePositionRef.current.y)
      const angle = Math.atan2(velocityRef.current.y, velocityRef.current.x) * 0.3
      ctx.rotate(angle)
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)"
      ctx.shadowBlur = 12
      ctx.shadowOffsetX = 6
      ctx.shadowOffsetY = 6
      ctx.fillRect(-planeSize / 2, -12, planeSize, 24)
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      const planeGradient = ctx.createLinearGradient(-planeSize / 2, -12, -planeSize / 2, 12)
      planeGradient.addColorStop(0, "#ff6b6b")
      planeGradient.addColorStop(0.3, "#ff5252")
      planeGradient.addColorStop(0.7, "#f44336")
      planeGradient.addColorStop(1, "#d32f2f")
      ctx.fillStyle = planeGradient
      ctx.fillRect(-planeSize / 2, -12, planeSize, 24)
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
      ctx.fillRect(-planeSize / 2, -10, planeSize, 6)
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
      ctx.fillRect(-planeSize / 2, -6, planeSize, 2)
      const noseGradient = ctx.createLinearGradient(planeSize / 2, -6, planeSize / 2 + 20, 0)
      noseGradient.addColorStop(0, "#e53935")
      noseGradient.addColorStop(0.5, "#c62828")
      noseGradient.addColorStop(1, "#b71c1c")
      ctx.fillStyle = noseGradient
      ctx.beginPath()
      ctx.moveTo(planeSize / 2, 0)
      ctx.lineTo(planeSize / 2 + 20, -5)
      ctx.lineTo(planeSize / 2 + 20, 5)
      ctx.closePath()
      ctx.fill()
      const wingGradient = ctx.createLinearGradient(-planeSize / 4, -30, -planeSize / 4, 30)
      wingGradient.addColorStop(0, "#d32f2f")
      wingGradient.addColorStop(0.3, "#c62828")
      wingGradient.addColorStop(0.7, "#b71c1c")
      wingGradient.addColorStop(1, "#a00000")
      ctx.fillStyle = wingGradient
      ctx.fillRect(-planeSize / 4, -30, planeSize / 2, 60)
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)"
      ctx.fillRect(-planeSize / 4, -28, planeSize / 2, 8)
      ctx.fillStyle = "#a00000"
      ctx.beginPath()
      ctx.moveTo(-planeSize / 2, -12)
      ctx.lineTo(-planeSize / 2 - 18, -20)
      ctx.lineTo(-planeSize / 2 - 12, -12)
      ctx.lineTo(-planeSize / 2 - 18, 20)
      ctx.lineTo(-planeSize / 2, 12)
      ctx.closePath()
      ctx.fill()
      if (isRoundActive) {
        const glowIntensity = 0.5 + 0.3 * Math.sin(Date.now() * 0.008)
        const glowSize = 15 + 6 * Math.sin(Date.now() * 0.012)
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

      const multiplierText = `${smoothMultiplierRef.current.toFixed(2)}x`
      const fontSize = Math.min(80, 50 + smoothMultiplierRef.current * 1.5)
      ctx.font = `bold ${fontSize}px 'Inter', 'Arial', sans-serif`
      const textGradient = ctx.createLinearGradient(0, 50, 0, 120)
      const color = getMultiplierColor(smoothMultiplierRef.current)
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
      ctx.font = "bold 18px 'Inter', 'Arial', sans-serif"
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)"
      ctx.shadowBlur = 8
      const statusText = isRoundActive ? "🚀 FLYING..." : "💥 CRASHED!"
      const statusOpacity = 0.7 + 0.3 * Math.sin(Date.now() * 0.004)
      ctx.globalAlpha = statusOpacity
      ctx.fillText(statusText, canvas.width / 2, 115)
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      animationRef.current = requestAnimationFrame(drawGame)
    }

    drawGame()
  }

  const adjustColorBrightness = (color: string, amount: number) => {
    const hex = color.replace("#", "")
    const r = Math.max(0, Math.min(255, Number.parseInt(hex.substr(0, 2), 16) + amount))
    const g = Math.max(0, Math.min(255, Number.parseInt(hex.substr(2, 2), 16) + amount))
    const b = Math.max(0, Math.min(255, Number.parseInt(hex.substr(4, 2), 16) + amount))
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
  }

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier < 1.5) return "#ff4757"
    if (multiplier < 2) return "#ff6b35"
    if (multiplier < 5) return "#ffa502"
    if (multiplier < 10) return "#2ed573"
    if (multiplier < 20) return "#1e90ff"
    if (multiplier < 50) return "#a55eea"
    return "#ff6b6b"
  }

  const adjustAmount = (setter: React.Dispatch<React.SetStateAction<string>>, increment: boolean, step: number) => {
    setter((prev) => {
      const current = Number.parseFloat(prev) || 0
      const newAmount = increment ? current + step : Math.max(10, current - step)
      return newAmount.toFixed(2)
    })
  }

  const calculatePotentialWin = (betAmount: string, multiplier: number) => {
    const amount = Number.parseFloat(betAmount) || 0
    return (amount * multiplier).toFixed(2)
  }

  const getBetMultiplierProgress = (multiplier: number) => {
    return Math.min((multiplier - 1) * 15, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/8 to-purple-500/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-red-500/8 to-orange-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {showLazerSignal && (
        <div className="fixed top-20 right-4 z-[100] animate-in slide-in-from-right-5 duration-500">
          <div className="relative max-w-xs w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-xl blur-sm animate-pulse opacity-75"></div>
            <Card className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-amber-500/50 rounded-xl shadow-2xl backdrop-blur-md">
              <Button
                variant="ghost"
                onClick={handleDismissLazerSignal}
                className="absolute -top-2 -right-2 z-10 h-6 w-6 p-0 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-full border border-slate-600/50"
              >
                <X className="w-3 h-3" />
              </Button>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
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
                    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg p-3 border border-amber-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-medium text-slate-200">Premium Odds</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-amber-400">KES 10K</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span>99% Accuracy</span>
                      </div>
                    </div>
                    {walletBalance < 10000 && (
                      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2 flex items-center gap-2">
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
                        className="flex-1 bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-slate-300 h-8 text-xs"
                      >
                        Later
                      </Button>
                      <Button
                        onClick={handlePayForPremiumOdds}
                        disabled={walletBalance < 10000}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold h-8 text-xs disabled:opacity-50"
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
                      <div className="w-8 h-8 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-400">Processing...</p>
                        <p className="text-xs text-slate-400">Waiting for premium odd</p>
                      </div>
                    </div>
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-2 text-center">
                      <p className="text-xs text-slate-300">Payment successful!</p>
                      <p className="text-xs text-slate-400">KES 10,000 deducted</p>
                    </div>
                  </div>
                )}
                {hasPurchasedPremium && premiumSureOdd && (
                  <div className="space-y-3">
                    <div className="text-center space-y-2">
                      <div className="w-8 h-8 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-medium text-green-400">Premium Odd Ready!</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-3 border border-green-500/30 text-center">
                      <p className="text-xs text-green-400 mb-1">Your Sure Odd:</p>
                      <div className="text-2xl font-bold text-green-400 animate-pulse">
                        {premiumSureOdd.toFixed(2)}x
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowLazerSignal(false)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold h-8 text-xs"
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

      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-950/95 via-purple-950/30 to-slate-950/95 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Plane className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    Aviator
                  </h1>
                </div>
              </div>
              <Badge
                variant={isConnected ? "success" : "danger"}
                className={cn(
                  "border px-2 py-0.5 text-xs font-bold",
                  isConnected
                    ? "bg-green-500/20 text-green-400 border-green-500/40"
                    : "bg-red-500/20 text-red-400 border-red-500/40",
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full mr-1", isConnected ? "bg-green-400" : "bg-red-400")}></div>
                {isConnected ? "LIVE" : "OFF"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {premiumSureOdd && (
                <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-green-500/30 shadow-lg">
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-bold text-xs sm:text-sm">
                    <span className="hidden sm:inline">Premium: </span>
                    {premiumSureOdd.toFixed(2)}x
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-600/50">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <WalletBalance />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden bg-slate-800/50 border-slate-600/50 h-8 w-8 p-0"
              >
                {showSidebar ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 py-2 relative z-10">
        <div className="mb-3 overflow-x-auto pb-1">
          <div className="flex gap-1.5 min-w-max">
            <div className="flex items-center bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/50 text-xs">
              <History className="w-3 h-3 mr-1 text-slate-400" />
              <span className="font-medium text-slate-300">Recent:</span>
            </div>
            {premiumSureOdd && (
              <div className="flex md:hidden items-center gap-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-2 py-1 rounded-lg border border-green-500/30 text-xs font-bold animate-pulse">
                <Crown className="w-3 h-3" />
                <span>Sure: {premiumSureOdd.toFixed(2)}x</span>
              </div>
            )}
            {pastCrashes.slice(0, 8).map((crash, index) => (
              <div
                key={index}
                className={cn(
                  "px-2 py-1 rounded-lg text-xs font-bold min-w-[45px] text-center border",
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

        <div className="grid lg:grid-cols-[1fr_300px] gap-3">
          <div className="space-y-3">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50 shadow-2xl backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                {isBettingPhase || !isInitialized ? (
                  <div className="flex flex-col items-center justify-center h-[200px] sm:h-[250px] bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/10 to-pink-500/5 animate-pulse"></div>
                    <div className="relative z-10 text-center">
                      {!isInitialized ? (
                        <>
                          <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 animate-pulse">
                            Connecting...
                          </div>
                          <div className="text-sm sm:text-lg text-slate-200 mb-2 font-semibold">Initializing game</div>
                          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Please wait...</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-2 animate-pulse">
                            {roundCountdown}
                          </div>
                          <div className="text-sm sm:text-lg text-slate-200 mb-2 font-semibold">
                            Next round starting...
                          </div>
                          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                            <Clock className="w-4 h-4 animate-spin" />
                            <span>Get ready!</span>
                          </div>
                        </>
                      )}
                    </div>
                    {isInitialized && (
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${((5 - roundCountdown) / 5) * 100}%` }}
                      ></div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={250}
                      className="w-full h-[200px] sm:h-[250px] rounded-lg"
                    ></canvas>
                    {showCrashScreen && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-500/20 via-red-600/10 to-red-500/20 backdrop-blur-sm rounded-lg">
                        <div className="text-center">
                          <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-2 animate-pulse">
                            CRASHED!
                          </div>
                          <div className="text-lg sm:text-xl text-slate-200 font-semibold">
                            at {currentMultiplier.toFixed(2)}x
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[1, 2].map((betNumber) => {
                const currentBetAmount = betNumber === 1 ? betAmount1 : betAmount2
                const currentAutoCashout = betNumber === 1 ? autoCashout1 : autoCashout2
                const hasActiveBet = betNumber === 1 ? hasBet1 : hasBet2
                const potentialWin = calculatePotentialWin(currentBetAmount, currentMultiplier)

                return (
                  <div
                    key={betNumber}
                    className={cn(
                      "relative overflow-hidden rounded-xl border-2 shadow-xl backdrop-blur-sm transition-all duration-300",
                      betNumber === 1
                        ? "bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-blue-900/40 border-blue-500/30"
                        : "bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 border-purple-500/30",
                      hasActiveBet && isRoundActive && "ring-2 ring-green-400/50 animate-pulse",
                    )}
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
                      {betNumber === 1 ? (
                        <Rocket className="w-full h-full text-blue-400" />
                      ) : (
                        <Target className="w-full h-full text-purple-400" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "absolute inset-0 rounded-xl opacity-20",
                        betNumber === 1
                          ? "bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"
                          : "bg-gradient-to-r from-transparent via-purple-400/20 to-transparent",
                        hasActiveBet && isRoundActive && "animate-pulse",
                      )}
                    ></div>
                    <div className="relative p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-lg",
                              betNumber === 1
                                ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                : "bg-gradient-to-br from-purple-500 to-purple-600",
                            )}
                          >
                            {betNumber}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">Bet {betNumber}</h3>
                            <p className="text-xs text-slate-400">Quick bet</p>
                          </div>
                        </div>
                        {hasActiveBet && isRoundActive && (
                          <Badge className="bg-green-500/30 text-green-300 border-green-500/40 px-2 py-0.5 text-xs animate-pulse">
                            <Activity className="w-3 h-3 mr-1" />
                            LIVE
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Amount (KES)</label>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              onClick={() => adjustAmount(betNumber === 1 ? setBetAmount1 : setBetAmount2, false, 10)}
                              className={cn(
                                "h-8 w-8 p-0 rounded-lg border-2 transition-all duration-200",
                                betNumber === 1
                                  ? "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30"
                                  : "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30",
                              )}
                              disabled={!isBettingPhase}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={currentBetAmount}
                              onChange={(e) => (betNumber === 1 ? setBetAmount1 : setBetAmount2)(e.target.value)}
                              className={cn(
                                "text-center h-8 text-sm font-bold border-2 transition-all duration-200",
                                betNumber === 1
                                  ? "bg-blue-500/10 border-blue-500/30 focus:border-blue-400"
                                  : "bg-purple-500/10 border-purple-500/30 focus:border-purple-400",
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
                                "h-8 w-8 p-0 rounded-lg border-2 transition-all duration-200",
                                betNumber === 1
                                  ? "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30"
                                  : "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30",
                              )}
                              disabled={!isBettingPhase}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Auto Cashout (x)</label>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              onClick={() =>
                                adjustAmount(betNumber === 1 ? setAutoCashout1 : setAutoCashout2, false, 0.1)
                              }
                              className={cn(
                                "h-8 w-8 p-0 rounded-lg border-2 transition-all duration-200",
                                betNumber === 1
                                  ? "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30"
                                  : "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30",
                              )}
                              disabled={!isBettingPhase}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={currentAutoCashout}
                              onChange={(e) => (betNumber === 1 ? setAutoCashout1 : setAutoCashout2)(e.target.value)}
                              className={cn(
                                "text-center h-8 text-sm font-bold border-2 transition-all duration-200",
                                betNumber === 1
                                  ? "bg-blue-500/10 border-blue-500/30 focus:border-blue-400"
                                  : "bg-purple-500/10 border-purple-500/30 focus:border-purple-400",
                              )}
                              placeholder="2.00"
                              min="1.01"
                              step="0.1"
                              disabled={!isBettingPhase}
                            />
                            <Button
                              variant="outline"
                              onClick={() => adjustAmount(betNumber === 1 ? setAutoCashout1 : setAutoCashout2, true, 0.1)}
                              className={cn(
                                "h-8 w-8 p-0 rounded-lg border-2 transition-all duration-200",
                                betNumber === 1
                                  ? "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30"
                                  : "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30",
                              )}
                              disabled={!isBettingPhase}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {hasActiveBet && isRoundActive && (
                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-2 border border-green-500/30">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-300 font-medium">Win:</span>
                            <span className="text-sm font-bold text-green-400 animate-pulse">KES {potentialWin}</span>
                          </div>
                          <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
                              style={{ width: `${getBetMultiplierProgress(currentMultiplier)}%` }}
                            ></div>
                          </div>
                          <div className="text-center text-xs text-slate-400 mt-1">
                            @ {currentMultiplier.toFixed(2)}x
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handlePlaceBet(betNumber as 1 | 2)}
                          disabled={!isConnected || !user || !isBettingPhase || hasActiveBet}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold h-9 rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 text-xs"
                        >
                          <DollarSign className="w-3 h-3 mr-1" />
                          Bet
                        </Button>
                        <Button
                          onClick={() => handleCashOut(betNumber as 1 | 2)}
                          disabled={!isConnected || !user || !isRoundActive || !hasActiveBet}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold h-9 rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 text-xs"
                        >
                          <Banknote className="w-3 h-3 mr-1" />
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

          <div className={cn("space-y-3", showSidebar ? "block" : "hidden lg:block")}>
            <Tabs defaultValue="winners" className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-lg h-8">
                <TabsTrigger value="winners" className="data-[state=active]:bg-slate-700/50 rounded text-xs py-1">
                  <Trophy className="w-3 h-3 mr-1" />
                  Top
                </TabsTrigger>
                <TabsTrigger value="live" className="data-[state=active]:bg-slate-700/50 rounded text-xs py-1">
                  <Users className="w-3 h-3 mr-1" />
                  Live
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-slate-700/50 rounded text-xs py-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Stats
                </TabsTrigger>
              </TabsList>
              <TabsContent value="winners">
                <Card className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 border-slate-600/50 shadow-xl backdrop-blur-sm">
                  <CardContent className="p-3 space-y-2">
                    <h3 className="font-bold text-sm flex items-center">
                      <Trophy className="w-4 h-4 mr-2 text-amber-400" />
                      Top Winners
                    </h3>
                    {topWinners.length > 0 ? (
                      <div className="space-y-2">
                        {topWinners.slice(0, 3).map((winner, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg border border-slate-600/30"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                                {winner.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-xs text-white">{winner.username}</div>
                                <div className="text-xs text-slate-400">{winner.cashed_out_at.toFixed(2)}x</div>
                              </div>
                            </div>
                            <div className="text-green-400 font-bold text-xs">
                              KES {Number.parseFloat(winner.amount).toFixed(0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-slate-400 text-xs">No winners yet</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="live">
                <Card className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 border-slate-600/50 shadow-xl backdrop-blur-sm">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm flex items-center">
                        <Users className="w-4 h-4 mr-2 text-blue-400" />
                        Live Bets
                      </h3>
                      <Badge
                        variant="primary"
                        className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs px-2 py-0.5"
                      >
                        {livePlayers || 0}
                      </Badge>
                    </div>
                    {recentCashouts.length > 0 ? (
                      <div className="space-y-2">
                        {recentCashouts.slice(0, 3).map((bet, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg border border-slate-600/30"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                {(bet.username || "A").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-xs text-white">{bet.username || "Anonymous"}</div>
                                {bet.multiplier && (
                                  <div className="text-xs text-slate-400">{bet.multiplier.toFixed(2)}x</div>
                                )}
                              </div>
                            </div>
                            <div className="text-green-400 font-bold text-xs">KES {(bet.amount || 0).toFixed(0)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-slate-400 text-xs">No live bets</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="stats">
                <Card className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 border-slate-600/50 shadow-xl backdrop-blur-sm">
                  <CardContent className="p-3 space-y-3">
                    <h3 className="font-bold text-sm flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
                      Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <div className="text-xs text-slate-400">High</div>
                        <div className="text-sm font-bold text-amber-400">
                          {Math.max(...pastCrashes, 1).toFixed(2)}x
                        </div>
                      </div>
                      <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="text-xs text-slate-400">Low</div>
                        <div className="text-sm font-bold text-red-400">{Math.min(...pastCrashes, 10).toFixed(2)}x</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 border-slate-600/50 shadow-xl backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm">Quick Bets</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[50, 100, 200, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 h-7 text-xs font-bold transition-all duration-300"
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