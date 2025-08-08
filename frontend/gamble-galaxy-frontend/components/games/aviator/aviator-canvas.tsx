"use client"

import { useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Loader2 } from 'lucide-react'

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

interface AviatorCanvasProps {
  currentMultiplier: number
  isRoundActive: boolean
  isBettingPhase: boolean
  roundCountdown: number
  isInitialized: boolean
  gamePhase: "waiting" | "flying" | "crashed"
  showCrashScreen: boolean
  crashMultiplier: number
}

export function AviatorCanvas({
  currentMultiplier,
  isRoundActive,
  isBettingPhase,
  roundCountdown,
  isInitialized,
  gamePhase,
  showCrashScreen,
  crashMultiplier
}: AviatorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const planePositionRef = useRef<Position>({ x: 80, y: 300 })
  const trailPointsRef = useRef<TrailPoint[]>([])
  const particlesRef = useRef<Particle[]>([])
  const starsRef = useRef<StarType[]>([])
  const velocityRef = useRef<Velocity>({ x: 0, y: 0 })
  const smoothMultiplierRef = useRef<number>(1.0)
  const isAnimatingRef = useRef<boolean>(false)

  const getMultiplierColor = useCallback((multiplier: number) => {
    if (multiplier < 1.5) return "#ff4757"
    if (multiplier < 2) return "#ff6b35"
    if (multiplier < 5) return "#ffa502"
    if (multiplier < 10) return "#2ed573"
    if (multiplier < 20) return "#1e90ff"
    if (multiplier < 50) return "#a55eea"
    return "#ff6b6b"
  }, [])

  const adjustColorBrightness = useCallback((color: string, amount: number) => {
    const hex = color.replace("#", "")
    const r = Math.max(0, Math.min(255, Number.parseInt(hex.substring(0, 2), 16) + amount))
    const g = Math.max(0, Math.min(255, Number.parseInt(hex.substring(2, 4), 16) + amount))
    const b = Math.max(0, Math.min(255, Number.parseInt(hex.substring(4, 6), 16) + amount))
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
  }, [])

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

      // Background gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width,
      )
      gradient.addColorStop(0, "#1a1a2e")
      gradient.addColorStop(0.4, "#16213e")
      gradient.addColorStop(0.8, "#0f3460")
      gradient.addColorStop(1, "#0e2954")

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

      // Update multiplier smoothing
      if (gamePhase === "flying") {
        const targetMultiplier = Number.isFinite(currentMultiplier) ? currentMultiplier : 1.0
        const smoothingFactor = 0.3
        smoothMultiplierRef.current += (targetMultiplier - smoothMultiplierRef.current) * smoothingFactor

        if (Math.abs(targetMultiplier - smoothMultiplierRef.current) > 0.05) {
          smoothMultiplierRef.current = targetMultiplier * 0.9 + smoothMultiplierRef.current * 0.1
        }
      }

      // Plane movement and animation
      if (gamePhase === "flying") {
        const targetSpeed = 1.5 + smoothMultiplierRef.current * 0.8
        const acceleration = 0.15
        velocityRef.current.x += (targetSpeed - velocityRef.current.x) * acceleration
        planePositionRef.current.x += velocityRef.current.x

        const baseY = canvas.height - 80
        const multiplierFactor = Math.log(Math.max(1, smoothMultiplierRef.current)) * 60
        const targetY = Math.max(30, baseY - multiplierFactor)
        const yDiff = targetY - planePositionRef.current.y
        velocityRef.current.y += yDiff * 0.03
        velocityRef.current.y *= 0.9
        planePositionRef.current.y += velocityRef.current.y

        if (planePositionRef.current.x > canvas.width - 60) {
          planePositionRef.current.x = canvas.width - 60
        }

        // Generate particles
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
        velocityRef.current.y += 0.5
        velocityRef.current.x *= 0.98
        planePositionRef.current.x += velocityRef.current.x
        planePositionRef.current.y += velocityRef.current.y

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
          particleGradient.addColorStop(0, `rgba(255, ${60 + alpha * 100}, ${20 + alpha * 40}, ${alpha})`)
          particleGradient.addColorStop(0.7, `rgba(255, ${40 + alpha * 80}, ${10 + alpha * 20}, ${alpha * 0.6})`)
          particleGradient.addColorStop(1, `rgba(255, 20, 0, 0)`)
        } else {
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
         const trailColor = getMultiplierColor(Number(smoothMultiplierRef.current))
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
         ctx.stroke       
         ctx.lineWidth = 4
         ctx.shadowBlur = 10
         ctx.globalAlpha = gamePhase === "crashed" ? 0.5 : 0.8
         ctx.stroke       
         ctx.lineWidth = 2
         ctx.shadowBlur = 5
         ctx.globalAlpha = 1
         ctx.strokeStyle = `rgba(255, 255, 255, ${gamePhase === "crashed" ? 0.6 : 0.95})`
         ctx.stroke       
         ctx.shadowBlur = 0
         ctx.globalAlpha = 1
       }
      // Draw plane
      const planeSize = 60
      ctx.save()
      ctx.translate(planePositionRef.current.x, planePositionRef.current.y)
      const angle = Math.atan2(velocityRef.current.y, velocityRef.current.x) * 0.4
      ctx.rotate(angle)

      // Plane body
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

      // Wings
      const wingGradient = ctx.createLinearGradient(-planeSize / 4, -30, -planeSize / 4, 30)
      wingGradient.addColorStop(0, gamePhase === "crashed" ? "#8b0000" : "#d32f2f")
      wingGradient.addColorStop(1, gamePhase === "crashed" ? "#ff0000" : "#a00000")
      ctx.fillStyle = wingGradient
      ctx.fillRect(-planeSize / 4, -30, planeSize / 2, 60)

      ctx.restore()

      // Display multiplier
      const displayMultiplier = gamePhase === "crashed" ? crashMultiplier : smoothMultiplierRef.current
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

      ctx.shadowBlur = 0

      // Status text
      ctx.font = "bold 18px 'Inter', 'Arial', sans-serif"
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
      const statusText =
        gamePhase === "flying" ? "🚀 FLYING..." : gamePhase === "crashed" ? "💥 CRASHED!" : "⏳ WAITING..."
      ctx.fillText(statusText, canvas.width / 2, 115)

      animationRef.current = requestAnimationFrame(drawGame)
    }

    drawGame()
  }, [gamePhase, currentMultiplier, getMultiplierColor, adjustColorBrightness, crashMultiplier])

  // Initialize stars on mount
  useEffect(() => {
    initializeStars()
  }, [initializeStars])

  // Handle canvas initialization
  useEffect(() => {
    if (isRoundActive && isInitialized) {
      initCanvas()
    }

    return () => {
      isAnimatingRef.current = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRoundActive, isInitialized, initCanvas])

  return (
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
                    at {crashMultiplier.toFixed(2)}x
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
