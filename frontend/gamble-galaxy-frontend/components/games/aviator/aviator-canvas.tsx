"use client"

import { useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Loader2 } from "lucide-react"

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
  //isRoundActive,
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

  // Calculate plane position
  const calculatePlanePosition = useCallback((elapsedTime: number, canvasWidth: number, canvasHeight: number) => {
    const timeInSeconds = elapsedTime / 1000
    const multiplier = Math.max(1.0, 1 + timeInSeconds * 0.1 * Math.pow(1.0008, timeInSeconds * 10))

    // X: Linear progression from left to right
    const progress = Math.min(timeInSeconds / 20, 0.9)
    const x = canvasWidth * 0.08 + progress * (canvasWidth * 0.84)

    // Y: Exponential curve from bottom to top
    const baseY = canvasHeight * 0.85
    const curveHeight = Math.log(multiplier) * (canvasHeight * 0.12)
    const y = Math.max(canvasHeight * 0.1, baseY - curveHeight)

    return { x, y, multiplier }
  }, [])

  // Draw background
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height)

    // Dark gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
    bgGradient.addColorStop(0, "#0f172a")
    bgGradient.addColorStop(0.5, "#1e293b")
    bgGradient.addColorStop(1, "#334155")

    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // Grid
    const gridSize = Math.max(25, Math.min(50, width / 20))
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)"
    ctx.lineWidth = 1
    ctx.setLineDash([2, 8])

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    ctx.setLineDash([])
  }, [])

  // Draw plane trail/traces
  const drawPlaneTrail = useCallback((ctx: CanvasRenderingContext2D, width: number) => {
    if (trailPointsRef.current.length < 2) return

    const points = trailPointsRef.current
    const lineWidth = Math.max(3, width / 200)

    ctx.save()
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Draw trail with fading effect
    for (let i = 1; i < points.length; i++) {
      const point = points[i]
      const prevPoint = points[i - 1]
      const alpha = Math.max(0, 1 - point.age / 100) // Fade over 100 frames

      if (alpha > 0) {
        // Outer glow
        ctx.shadowColor = "#ff6b6b"
        ctx.shadowBlur = lineWidth * 4
        ctx.lineWidth = lineWidth * 2
        ctx.strokeStyle = `rgba(255, 107, 107, ${alpha * 0.3})`

        ctx.beginPath()
        ctx.moveTo(prevPoint.x, prevPoint.y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()

        // Main trail
        ctx.shadowBlur = lineWidth * 2
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = `rgba(255, 71, 87, ${alpha * 0.8})`
        ctx.stroke()

        // Inner bright line
        ctx.shadowBlur = 0
        ctx.lineWidth = Math.max(1, lineWidth / 2)
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.stroke()
      }
    }

    ctx.restore()
  }, [])

  // Draw curve
  const drawCurve = useCallback((ctx: CanvasRenderingContext2D, width: number) => {
    if (curvePointsRef.current.length < 2) return

    const points = curvePointsRef.current
    const lineWidth = Math.max(4, width / 150)

    ctx.save()
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Outer glow
    ctx.shadowColor = "#ff4757"
    ctx.shadowBlur = lineWidth * 6
    ctx.lineWidth = lineWidth * 2.5
    ctx.strokeStyle = "rgba(255, 71, 87, 0.4)"

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()

    // Main curve
    ctx.shadowBlur = lineWidth * 3
    ctx.lineWidth = lineWidth * 1.5
    ctx.strokeStyle = "#ff4757"
    ctx.stroke()

    // Inner bright line
    ctx.shadowBlur = 0
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = "#ffffff"
    ctx.stroke()

    ctx.restore()
  }, [])

  // Draw simple common plane design
  const drawSimplePlane = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const plane = planePositionRef.current
      const baseScale = Math.min(width / 800, height / 500)
      const scale = Math.max(0.5, Math.min(1.2, baseScale))

      ctx.save()
      ctx.translate(plane.x, plane.y)
      ctx.rotate(planeAngleRef.current)
      ctx.scale(scale, scale)

      const crashed = gamePhase === "crashed"

      // SIMPLE COMMON PLANE DESIGN

      // Main body - simple fuselage
      const bodyGradient = ctx.createLinearGradient(-25, -8, -25, 8)
      if (crashed) {
        bodyGradient.addColorStop(0, "#ff4757")
        bodyGradient.addColorStop(0.5, "#ff3742")
        bodyGradient.addColorStop(1, "#ff1e2d")
      } else {
        bodyGradient.addColorStop(0, "#ffd700")
        bodyGradient.addColorStop(0.5, "#ffed4e")
        bodyGradient.addColorStop(1, "#ffc048")
      }

      // Main fuselage
      ctx.fillStyle = bodyGradient
      ctx.beginPath()
      ctx.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2)
      ctx.fill()

      // Nose
      ctx.fillStyle = crashed ? "#ff1e2d" : "#ffb700"
      ctx.beginPath()
      ctx.ellipse(25, 0, 10, 6, 0, 0, Math.PI * 2)
      ctx.fill()

      // Wings - simple design
      const wingGradient = ctx.createLinearGradient(-15, -25, -15, 25)
      wingGradient.addColorStop(0, crashed ? "#ff4757" : "#ffd700")
      wingGradient.addColorStop(0.5, crashed ? "#ff3742" : "#ffed4e")
      wingGradient.addColorStop(1, crashed ? "#ff4757" : "#ffd700")

      ctx.fillStyle = wingGradient
      ctx.beginPath()
      ctx.ellipse(-10, 0, 25, 12, 0, 0, Math.PI * 2)
      ctx.fill()

      // Cockpit window
      ctx.fillStyle = crashed ? "rgba(255, 0, 0, 0.8)" : "rgba(70, 130, 180, 0.9)"
      ctx.beginPath()
      ctx.ellipse(15, -2, 8, 4, 0, 0, Math.PI * 2)
      ctx.fill()

      // Window frame
      ctx.strokeStyle = crashed ? "#8B0000" : "#4682B4"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.ellipse(15, -2, 8, 4, 0, 0, Math.PI * 2)
      ctx.stroke()

      // Tail
      ctx.fillStyle = bodyGradient
      ctx.beginPath()
      ctx.moveTo(-30, 0)
      ctx.lineTo(-45, -12)
      ctx.lineTo(-40, -12)
      ctx.lineTo(-28, -3)
      ctx.lineTo(-28, 3)
      ctx.lineTo(-40, 12)
      ctx.lineTo(-45, 12)
      ctx.closePath()
      ctx.fill()

      // Propeller (spinning when flying)
      if (gamePhase === "flying") {
        const propSpeed = Date.now() * 0.05
        ctx.save()
        ctx.translate(35, 0)
        ctx.rotate(propSpeed)

        ctx.strokeStyle = "rgba(150, 150, 150, 0.7)"
        ctx.lineWidth = 3
        ctx.lineCap = "round"

        // Propeller blades
        for (let i = 0; i < 3; i++) {
          ctx.save()
          ctx.rotate((i * Math.PI * 2) / 3)
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(0, -15)
          ctx.stroke()
          ctx.restore()
        }

        ctx.restore()
      }

      // Engine exhaust trail (when flying)
      if (gamePhase === "flying") {
        for (let i = 0; i < 8; i++) {
          const exhaustX = -35 - i * 4
          const exhaustY = (Math.random() - 0.5) * 6
          const alpha = 0.8 - i * 0.1

          const exhaustGradient = ctx.createRadialGradient(exhaustX, exhaustY, 0, exhaustX, exhaustY, 3)
          exhaustGradient.addColorStop(0, `rgba(255, 165, 0, ${alpha})`)
          exhaustGradient.addColorStop(0.7, `rgba(255, 69, 0, ${alpha * 0.6})`)
          exhaustGradient.addColorStop(1, `rgba(255, 0, 0, 0)`)

          ctx.fillStyle = exhaustGradient
          ctx.beginPath()
          ctx.arc(exhaustX, exhaustY, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Highlight on body
      ctx.fillStyle = crashed ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.5)"
      ctx.beginPath()
      ctx.ellipse(5, -5, 20, 2, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    },
    [gamePhase],
  )

  // Draw BIG multiplier
  const drawMultiplier = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const displayMultiplier = gamePhase === "crashed" ? crashMultiplier : currentMultiplier
      const multiplierText = `${displayMultiplier.toFixed(2)}x`

      // MUCH BIGGER font sizing
      const fontSize = Math.max(32, Math.min(width * 0.15, height * 0.2)) // Increased from 0.08 to 0.15
      ctx.font = `bold ${fontSize}px Arial`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Color based on multiplier
      let color = "#ff4757"
      if (displayMultiplier >= 2) color = "#ffa502"
      if (displayMultiplier >= 5) color = "#2ed573"
      if (displayMultiplier >= 10) color = "#1e90ff"
      if (displayMultiplier >= 20) color = "#a55eea"

      const x = width / 2
      const y = height * 0.15

      // Strong glow effect
      ctx.shadowColor = color
      ctx.shadowBlur = fontSize / 2
      ctx.fillStyle = color
      ctx.fillText(multiplierText, x, y)

      // Main text - white and bold
      ctx.shadowBlur = fontSize / 4
      ctx.fillStyle = "#ffffff"
      ctx.fillText(multiplierText, x, y)

      // Status text - also bigger
      const statusFontSize = Math.max(16, fontSize * 0.35) // Increased from 0.3 to 0.35
      ctx.font = `bold ${statusFontSize}px Arial`
      let statusText = ""
      switch (gamePhase) {
        case "flying":
          statusText = "FLYING..."
          break
        case "crashed":
          statusText = "FLEW AWAY!"
          break
        default:
          statusText = "WAITING..."
      }

      ctx.shadowBlur = statusFontSize / 3
      ctx.fillStyle = color
      ctx.fillText(statusText, x, y + fontSize * 0.7)
    },
    [gamePhase, currentMultiplier, crashMultiplier],
  )

  // Main animation loop
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

      // Calculate smooth angle
      const deltaX = position.x - prevPosition.x
      const deltaY = position.y - prevPosition.y
      if (deltaX !== 0 || deltaY !== 0) {
        const targetAngle = Math.atan2(deltaY, deltaX) * 0.3
        planeAngleRef.current += (targetAngle - planeAngleRef.current) * 0.15
      }

      // Add to curve
      curvePointsRef.current.push({ x: position.x, y: position.y })
      if (curvePointsRef.current.length > 300) {
        curvePointsRef.current.shift()
      }

      // Add to trail with age tracking
      trailPointsRef.current.push({ x: position.x, y: position.y, age: 0 })
      if (trailPointsRef.current.length > 150) {
        trailPointsRef.current.shift()
      }

      // Age the trail points
      trailPointsRef.current.forEach((point) => {
        point.age++
      })
    } else if (gamePhase === "crashed") {
      // Plane flies away smoothly
      planePositionRef.current.x += 4
      planePositionRef.current.y -= 3
      planeAngleRef.current += 0.03

      // Continue aging trail points during crash
      trailPointsRef.current.forEach((point) => {
        point.age++
      })
    }

    // Draw everything in order
    drawPlaneTrail(ctx, width)
    drawCurve(ctx, width)
    if (gamePhase !== "waiting") {
      drawSimplePlane(ctx, width, height)
    }
    drawMultiplier(ctx, width, height)

    if (gamePhase === "flying" || gamePhase === "crashed") {
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [gamePhase, drawBackground, calculatePlanePosition, drawPlaneTrail, drawCurve, drawSimplePlane, drawMultiplier])

  // Start game
  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    startTimeRef.current = Date.now()
    planePositionRef.current = { x: rect.width * 0.08, y: rect.height * 0.85 }
    planeAngleRef.current = 0
    curvePointsRef.current = []
    trailPointsRef.current = []
    isAnimatingRef.current = true

    animate()
  }, [animate])

  // Stop game
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

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const setupCanvas = () => {
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height

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
    <Card className="bg-gradient-to-br from-slate-900/20 via-slate-800/10 to-slate-900/20 backdrop-blur-sm border border-slate-700/30 shadow-2xl overflow-hidden rounded-2xl">
      <CardContent className="p-0 relative">
        {isBettingPhase || !isInitialized ? (
          <div className="flex flex-col items-center justify-center h-[200px] sm:h-[300px] md:h-[350px] lg:h-[400px] bg-gradient-to-br from-slate-900/95 via-slate-800/50 to-slate-900/95 relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>

            <div className="relative z-10 text-center px-4">
              {!isInitialized ? (
                <>
                  <div className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 animate-pulse">
                    AVIATOR
                  </div>
                  <div className="text-sm sm:text-lg text-white/80 mb-4">Connecting...</div>
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-blue-400 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-4 animate-pulse">
                    {roundCountdown}
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl text-white font-bold mb-4">NEXT ROUND</div>
                  <div className="flex items-center justify-center gap-3 text-white/70">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                    <span className="text-sm sm:text-base font-medium">Place your bets!</span>
                  </div>
                </>
              )}
            </div>

            {isInitialized && (
              <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-2 bg-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${((5 - roundCountdown) / 5) * 100}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-[200px] sm:h-[300px] md:h-[350px] lg:h-[400px] rounded-2xl bg-slate-900"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />

            {showCrashScreen && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-500/20 via-orange-500/10 to-red-500/20 backdrop-blur-sm rounded-2xl">
                <div className="text-center animate-pulse px-4">
                  <div className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent mb-3">
                    FLEW AWAY!
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl text-white font-bold">
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
