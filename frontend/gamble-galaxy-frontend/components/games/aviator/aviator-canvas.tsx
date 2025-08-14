"use client"

import { useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Loader2, Plane } from "lucide-react"

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
  isBettingPhase,
  roundCountdown,
  isInitialized,
  gamePhase,
  showCrashScreen,
  crashMultiplier,
}: AviatorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const planePositionRef = useRef({ x: 60, y: 300 })
  const curvePointsRef = useRef<Array<{ x: number; y: number }>>([])
  const trailPointsRef = useRef<Array<{ x: number; y: number; age: number }>>([])
  const startTimeRef = useRef(0)
  const isAnimatingRef = useRef(false)
  const planeAngleRef = useRef(0)
  const explosionParticlesRef = useRef<
    Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number }>
  >([])

  const calculatePlanePosition = useCallback((elapsedTime: number, canvasWidth: number, canvasHeight: number) => {
    const timeInSeconds = elapsedTime / 1000
    const multiplier = Math.max(1.0, 1 + timeInSeconds * 0.1 * Math.pow(1.0008, timeInSeconds * 10))

    // Smooth horizontal progression from left to right
    const progress = Math.min(timeInSeconds / 25, 0.85) // Slower progression for smoother animation
    const x = canvasWidth * 0.05 + progress * (canvasWidth * 0.9)

    // Enhanced exponential curve with better visual appeal
    const baseY = canvasHeight * 0.8
    const curveIntensity = Math.log(multiplier) * (canvasHeight * 0.15)
    const y = Math.max(canvasHeight * 0.08, baseY - curveIntensity)

    return { x, y, multiplier }
  }, [])

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height)

    // Deep space gradient background
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height),
    )
    bgGradient.addColorStop(0, "#1e293b")
    bgGradient.addColorStop(0.4, "#0f172a")
    bgGradient.addColorStop(0.8, "#020617")
    bgGradient.addColorStop(1, "#000000")

    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // Enhanced grid with better spacing
    const gridSize = Math.max(25, Math.min(50, width / 25))
    ctx.strokeStyle = "rgba(37, 99, 235, 0.08)"
    ctx.lineWidth = 1
    ctx.setLineDash([2, 8])

    // Vertical grid lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    ctx.setLineDash([])

    // Add atmospheric stars
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
    for (let i = 0; i < 50; i++) {
      const x = (i * 137.5) % width
      const y = (i * 73.3) % height
      const size = Math.random() * 2 + 0.5
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [])

  const drawPlaneTrail = useCallback((ctx: CanvasRenderingContext2D, width: number) => {
    if (trailPointsRef.current.length < 2) return

    const points = trailPointsRef.current
    const lineWidth = Math.max(3, width / 200)

    ctx.save()
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    for (let i = 1; i < points.length; i++) {
      const point = points[i]
      const prevPoint = points[i - 1]
      const alpha = Math.max(0, 1 - point.age / 120)

      if (alpha > 0) {
        // Outer glow effect
        ctx.shadowColor = "#2563eb"
        ctx.shadowBlur = lineWidth * 8
        ctx.lineWidth = lineWidth * 4
        ctx.strokeStyle = `rgba(37, 99, 235, ${alpha * 0.2})`

        ctx.beginPath()
        ctx.moveTo(prevPoint.x, prevPoint.y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()

        // Main trail
        ctx.shadowBlur = lineWidth * 4
        ctx.lineWidth = lineWidth * 2
        ctx.strokeStyle = `rgba(59, 130, 246, ${alpha * 0.7})`
        ctx.stroke()

        // Inner bright core
        ctx.shadowBlur = 0
        ctx.lineWidth = lineWidth * 0.8
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`
        ctx.stroke()
      }
    }

    ctx.restore()
  }, [])

  const drawCurve = useCallback((ctx: CanvasRenderingContext2D, width: number) => {
    if (curvePointsRef.current.length < 2) return

    const points = curvePointsRef.current
    const lineWidth = Math.max(4, width / 150)

    ctx.save()
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Outer glow
    ctx.shadowColor = "#0ea5e9"
    ctx.shadowBlur = lineWidth * 10
    ctx.lineWidth = lineWidth * 4
    ctx.strokeStyle = "rgba(14, 165, 233, 0.3)"

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()

    // Main curve
    ctx.shadowBlur = lineWidth * 5
    ctx.lineWidth = lineWidth * 2.5
    ctx.strokeStyle = "#0ea5e9"
    ctx.stroke()

    // Inner bright line
    ctx.shadowBlur = 0
    ctx.lineWidth = lineWidth * 1.2
    ctx.strokeStyle = "#ffffff"
    ctx.stroke()

    ctx.restore()
  }, [])

  const drawRealisticPlane = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const plane = planePositionRef.current
      const baseScale = Math.min(width / 1000, height / 600)
      const scale = Math.max(0.5, Math.min(1.2, baseScale))

      ctx.save()
      ctx.translate(plane.x, plane.y)
      ctx.rotate(planeAngleRef.current)
      ctx.scale(scale, scale)

      const crashed = gamePhase === "crashed"

      // Enhanced fuselage with realistic proportions
      const fuselageGradient = ctx.createLinearGradient(-40, -12, -40, 12)
      if (crashed) {
        fuselageGradient.addColorStop(0, "#ef4444")
        fuselageGradient.addColorStop(0.3, "#dc2626")
        fuselageGradient.addColorStop(0.7, "#b91c1c")
        fuselageGradient.addColorStop(1, "#991b1b")
      } else {
        fuselageGradient.addColorStop(0, "#e2e8f0")
        fuselageGradient.addColorStop(0.3, "#cbd5e1")
        fuselageGradient.addColorStop(0.7, "#94a3b8")
        fuselageGradient.addColorStop(1, "#64748b")
      }

      // Main fuselage body
      ctx.shadowColor = crashed ? "#ef4444" : "#64748b"
      ctx.shadowBlur = 20
      ctx.fillStyle = fuselageGradient
      ctx.beginPath()
      ctx.ellipse(0, 0, 45, 12, 0, 0, Math.PI * 2)
      ctx.fill()

      // Cockpit section
      ctx.shadowBlur = 15
      ctx.fillStyle = crashed ? "#b91c1c" : "#475569"
      ctx.beginPath()
      ctx.ellipse(35, 0, 18, 10, 0, 0, Math.PI * 2)
      ctx.fill()

      // Main wings with realistic shape
      const wingGradient = ctx.createLinearGradient(-20, -35, -20, 35)
      wingGradient.addColorStop(0, crashed ? "#ef4444" : "#e2e8f0")
      wingGradient.addColorStop(0.5, crashed ? "#dc2626" : "#94a3b8")
      wingGradient.addColorStop(1, crashed ? "#ef4444" : "#e2e8f0")

      ctx.shadowBlur = 18
      ctx.fillStyle = wingGradient
      ctx.beginPath()
      ctx.ellipse(-15, 0, 35, 18, 0, 0, Math.PI * 2)
      ctx.fill()

      // Cockpit windows with realistic details
      const windowGradient = ctx.createLinearGradient(25, -8, 35, 8)
      windowGradient.addColorStop(0, crashed ? "rgba(239, 68, 68, 0.8)" : "rgba(14, 165, 233, 0.9)")
      windowGradient.addColorStop(0.5, crashed ? "rgba(220, 38, 38, 0.6)" : "rgba(59, 130, 246, 0.7)")
      windowGradient.addColorStop(1, crashed ? "rgba(185, 28, 28, 0.8)" : "rgba(37, 99, 235, 0.9)")

      ctx.shadowBlur = 12
      ctx.fillStyle = windowGradient
      ctx.beginPath()
      ctx.ellipse(30, -3, 15, 7, 0, 0, Math.PI * 2)
      ctx.fill()

      // Window frames
      ctx.shadowBlur = 0
      ctx.strokeStyle = crashed ? "#7f1d1d" : "#1e293b"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.ellipse(30, -3, 15, 7, 0, 0, Math.PI * 2)
      ctx.stroke()

      // Passenger windows
      for (let i = 0; i < 8; i++) {
        const windowX = 15 - i * 6
        const windowY = i % 2 === 0 ? -8 : 8

        ctx.fillStyle = crashed ? "rgba(239, 68, 68, 0.6)" : "rgba(14, 165, 233, 0.7)"
        ctx.beginPath()
        ctx.ellipse(windowX, windowY, 3, 2, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = crashed ? "#7f1d1d" : "#1e293b"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Enhanced tail section
      ctx.shadowBlur = 15
      ctx.fillStyle = fuselageGradient
      ctx.beginPath()
      ctx.moveTo(-45, 0)
      ctx.lineTo(-65, -20)
      ctx.lineTo(-58, -20)
      ctx.lineTo(-42, -4)
      ctx.lineTo(-42, 4)
      ctx.lineTo(-58, 20)
      ctx.lineTo(-65, 20)
      ctx.closePath()
      ctx.fill()

      // Vertical stabilizer
      ctx.beginPath()
      ctx.moveTo(-50, 0)
      ctx.lineTo(-62, -25)
      ctx.lineTo(-55, -25)
      ctx.lineTo(-45, -2)
      ctx.closePath()
      ctx.fill()

      // Animated engines with realistic details
      if (gamePhase === "flying") {
        // Engine nacelles
        ctx.shadowBlur = 10
        ctx.fillStyle = crashed ? "#dc2626" : "#64748b"

        // Left engine
        ctx.beginPath()
        ctx.ellipse(-25, -22, 12, 6, 0, 0, Math.PI * 2)
        ctx.fill()

        // Right engine
        ctx.beginPath()
        ctx.ellipse(-25, 22, 12, 6, 0, 0, Math.PI * 2)
        ctx.fill()

        // Spinning propellers/fans
        const propSpeed = Date.now() * 0.1
        ctx.save()

        // Left propeller
        ctx.translate(-18, -22)
        ctx.rotate(propSpeed)
        ctx.shadowColor = "rgba(255, 255, 255, 0.8)"
        ctx.shadowBlur = 10
        ctx.strokeStyle = "rgba(200, 200, 200, 0.9)"
        ctx.lineWidth = 3
        ctx.lineCap = "round"

        for (let i = 0; i < 4; i++) {
          ctx.save()
          ctx.rotate((i * Math.PI * 2) / 4)
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(0, -12)
          ctx.stroke()
          ctx.restore()
        }
        ctx.restore()

        // Right propeller
        ctx.save()
        ctx.translate(-18, 22)
        ctx.rotate(-propSpeed)
        ctx.strokeStyle = "rgba(200, 200, 200, 0.9)"
        ctx.lineWidth = 3

        for (let i = 0; i < 4; i++) {
          ctx.save()
          ctx.rotate((i * Math.PI * 2) / 4)
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(0, -12)
          ctx.stroke()
          ctx.restore()
        }
        ctx.restore()
      }

      // Enhanced engine exhaust
      if (gamePhase === "flying") {
        for (let i = 0; i < 15; i++) {
          const exhaustX = -55 - i * 4
          const exhaustY = (Math.random() - 0.5) * 12
          const alpha = 0.8 - i * 0.05

          const exhaustGradient = ctx.createRadialGradient(exhaustX, exhaustY, 0, exhaustX, exhaustY, 6)
          exhaustGradient.addColorStop(0, `rgba(59, 130, 246, ${alpha})`)
          exhaustGradient.addColorStop(0.5, `rgba(37, 99, 235, ${alpha * 0.7})`)
          exhaustGradient.addColorStop(1, `rgba(29, 78, 216, 0)`)

          ctx.shadowBlur = 8
          ctx.shadowColor = "#2563eb"
          ctx.fillStyle = exhaustGradient
          ctx.beginPath()
          ctx.arc(exhaustX, exhaustY, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Premium metallic highlight
      ctx.shadowBlur = 0
      ctx.fillStyle = crashed ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.4)"
      ctx.beginPath()
      ctx.ellipse(8, -8, 30, 4, 0, 0, Math.PI * 2)
      ctx.fill()

      // Landing gear (when crashed)
      if (crashed) {
        ctx.fillStyle = "#374151"
        ctx.beginPath()
        ctx.rect(-5, 10, 3, 8)
        ctx.fill()
        ctx.beginPath()
        ctx.rect(15, 10, 3, 8)
        ctx.fill()
      }

      ctx.restore()
    },
    [gamePhase],
  )

  const drawExplosion = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (gamePhase !== "crashed") return

      const particles = explosionParticlesRef.current

      for (const particle of particles) {
        const alpha = particle.life / particle.maxLife
        if (alpha <= 0) continue

        ctx.save()
        ctx.globalAlpha = alpha

        const size = (1 - alpha) * 8 + 2
        const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, size)
        gradient.addColorStop(0, "#ff6b35")
        gradient.addColorStop(0.5, "#f7931e")
        gradient.addColorStop(1, "rgba(255, 107, 53, 0)")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()

        // Update particle
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.2 // gravity
        particle.life--
      }

      // Remove dead particles
      explosionParticlesRef.current = particles.filter((p) => p.life > 0)
    },
    [gamePhase],
  )

  const drawMultiplier = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const displayMultiplier = gamePhase === "crashed" ? crashMultiplier : currentMultiplier
      const multiplierText = `${displayMultiplier.toFixed(2)}x`

      const fontSize = Math.max(32, Math.min(width * 0.15, height * 0.2))
      ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Dynamic color based on multiplier value
      let color = "#2563eb"
      if (displayMultiplier >= 2) color = "#0ea5e9"
      if (displayMultiplier >= 5) color = "#10b981"
      if (displayMultiplier >= 10) color = "#f59e0b"
      if (displayMultiplier >= 20) color = "#8b5cf6"
      if (displayMultiplier >= 50) color = "#ef4444"

      const x = width / 2
      const y = height * 0.12

      // Enhanced glow effect
      ctx.shadowColor = color
      ctx.shadowBlur = fontSize / 1.2
      ctx.fillStyle = color
      ctx.fillText(multiplierText, x, y)

      // Bright white core
      ctx.shadowBlur = fontSize / 4
      ctx.fillStyle = "#ffffff"
      ctx.fillText(multiplierText, x, y)

      // Status text with better styling
      const statusFontSize = Math.max(14, fontSize * 0.35)
      ctx.font = `700 ${statusFontSize}px system-ui, -apple-system, sans-serif`
      let statusText = ""
      switch (gamePhase) {
        case "flying":
          statusText = "FLYING HIGH..."
          break
        case "crashed":
          statusText = "FLEW AWAY!"
          break
        default:
          statusText = "READY FOR TAKEOFF"
      }

      ctx.shadowBlur = statusFontSize / 2
      ctx.fillStyle = color
      ctx.fillText(statusText, x, y + fontSize * 0.7)
    },
    [gamePhase, currentMultiplier, crashMultiplier],
  )

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !isAnimatingRef.current) return

    const currentTime = Date.now()
    const elapsedTime = currentTime - startTimeRef.current

    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    drawBackground(ctx, width, height)

    if (gamePhase === "flying") {
      const position = calculatePlanePosition(elapsedTime, width, height)

      const prevPosition = planePositionRef.current
      planePositionRef.current = { x: position.x, y: position.y }

      // Enhanced smooth angle calculation
      const deltaX = position.x - prevPosition.x
      const deltaY = position.y - prevPosition.y
      if (deltaX !== 0 || deltaY !== 0) {
        const targetAngle = Math.atan2(deltaY, deltaX) * 0.4
        planeAngleRef.current += (targetAngle - planeAngleRef.current) * 0.12
      }

      // Add to curve and trail
      curvePointsRef.current.push({ x: position.x, y: position.y })
      if (curvePointsRef.current.length > 400) {
        curvePointsRef.current.shift()
      }

      trailPointsRef.current.push({ x: position.x, y: position.y, age: 0 })
      if (trailPointsRef.current.length > 200) {
        trailPointsRef.current.shift()
      }

      // Age trail points
      trailPointsRef.current.forEach((point) => {
        point.age++
      })
    } else if (gamePhase === "crashed") {
      // Enhanced crash animation - plane falls and flies away
      if (planeAngleRef.current > -Math.PI / 4) {
        planeAngleRef.current -= 0.02 // Gradual rotation downward
      }

      planePositionRef.current.x += 3
      planePositionRef.current.y += planeAngleRef.current < -Math.PI / 6 ? 2 : -1

      // Create explosion particles on first crash frame
      if (explosionParticlesRef.current.length === 0) {
        for (let i = 0; i < 20; i++) {
          explosionParticlesRef.current.push({
            x: planePositionRef.current.x + (Math.random() - 0.5) * 40,
            y: planePositionRef.current.y + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            life: 60,
            maxLife: 60,
          })
        }
      }

      // Continue aging trail points
      trailPointsRef.current.forEach((point) => {
        point.age += 2 // Faster fade during crash
      })
    }

    // Draw everything in proper order
    drawPlaneTrail(ctx, width)
    drawCurve(ctx, width)
    drawExplosion(ctx)
    if (gamePhase !== "waiting") {
      drawRealisticPlane(ctx, width, height)
    }
    drawMultiplier(ctx, width, height)

    if (gamePhase === "flying" || gamePhase === "crashed") {
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [
    gamePhase,
    drawBackground,
    calculatePlanePosition,
    drawPlaneTrail,
    drawCurve,
    drawRealisticPlane,
    drawMultiplier,
    drawExplosion,
  ])

  // Start game function
  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    startTimeRef.current = Date.now()
    planePositionRef.current = { x: rect.width * 0.05, y: rect.height * 0.8 }
    planeAngleRef.current = 0
    curvePointsRef.current = []
    trailPointsRef.current = []
    explosionParticlesRef.current = []
    isAnimatingRef.current = true

    animate()
  }, [animate])

  // Stop game function
  const stopGame = useCallback(() => {
    isAnimatingRef.current = false
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  // Handle game state changes
  useEffect(() => {
    if (gamePhase === "flying" && isInitialized) {
      startGame()
    } else if (gamePhase === "waiting") {
      stopGame()
    }
    return stopGame
  }, [gamePhase, isInitialized, startGame, stopGame])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const setupCanvas = () => {
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      drawBackground(ctx, rect.width, rect.height)
      drawMultiplier(ctx, rect.width, rect.height)
    }

    setupCanvas()

    const handleResize = () => {
      setTimeout(setupCanvas, 100)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [drawBackground, drawMultiplier])

  return (
    <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl overflow-hidden rounded-2xl sm:rounded-3xl hover:shadow-white/10 transition-all duration-500 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-2xl sm:rounded-3xl"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <CardContent className="p-0 relative z-10">
        {isBettingPhase || !isInitialized ? (
          <div className="flex flex-col items-center justify-center h-[200px] sm:h-[300px] md:h-[350px] lg:h-[400px] bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 relative overflow-hidden rounded-2xl sm:rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
            <div className="absolute top-1/4 left-1/4 w-20 h-20 xs:w-24 xs:h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 lg:w-72 lg:h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 xs:w-28 xs:h-28 sm:w-40 sm:h-40 md:w-60 md:h-60 lg:w-80 lg:h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

            <div className="relative z-10 text-center px-4">
              {!isInitialized ? (
                <>
                  <div className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6 animate-pulse">
                    AVIATOR
                  </div>
                  <div className="text-lg sm:text-xl text-white/80 mb-6 font-medium">
                    Connecting to flight control...
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-purple-400" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                      style={{ animationDelay: "1s" }}
                    ></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6 animate-pulse">
                    {roundCountdown}
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl text-white font-bold mb-6 flex items-center justify-center gap-3">
                    <Plane className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 animate-bounce" />
                    NEXT FLIGHT
                    <Plane
                      className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400 animate-bounce"
                      style={{ animationDelay: "0.5s" }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-4 text-white/70">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse text-blue-400" />
                    <span className="text-base sm:text-lg font-semibold">Ready for takeoff!</span>
                  </div>
                </>
              )}
            </div>

            {isInitialized && (
              <div className="absolute bottom-0 left-0 right-0 h-2 sm:h-3 bg-white/10 backdrop-blur-sm">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-linear shadow-lg"
                  style={{ width: `${((5 - roundCountdown) / 5) * 100}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-[200px] sm:h-[300px] md:h-[350px] lg:h-[400px] rounded-2xl sm:rounded-3xl"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                background: "linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)",
              }}
            />

            {showCrashScreen && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl">
                <div className="text-center animate-pulse px-4">
                  <div className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-4">
                    FLEW AWAY!
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl text-white font-bold">
                    @ {crashMultiplier.toFixed(2)}x
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
