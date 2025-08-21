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
  const startTimeRef = useRef(0)
  const isAnimatingRef = useRef(false)

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height)

    const skyGradient = ctx.createLinearGradient(0, 0, width, height)
    skyGradient.addColorStop(0, "rgba(139, 69, 19, 0.1)") // Dark brown/purple tint
    skyGradient.addColorStop(0.3, "rgba(88, 28, 135, 0.15)") // Purple tint
    skyGradient.addColorStop(0.7, "rgba(219, 39, 119, 0.1)") // Pink tint
    skyGradient.addColorStop(1, "rgba(30, 41, 59, 0.2)") // Dark slate

    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, width, height)

    const gridSize = Math.max(40, width / 15)
    ctx.strokeStyle = "rgba(168, 85, 247, 0.12)" // Purple with low opacity
    ctx.lineWidth = 1
    ctx.setLineDash([3, 15])

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

    const time = Date.now() * 0.0008
    for (let i = 0; i < 6; i++) {
      const x = (width / 6) * i + Math.sin(time + i * 0.7) * 25
      const y = height * 0.2 + Math.cos(time * 0.8 + i * 0.5) * 20
      const size = 8 + Math.sin(time * 1.5 + i) * 3

      ctx.fillStyle = `rgba(236, 72, 153, ${0.15 + Math.sin(time + i) * 0.1})` // Pink accent
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.strokeStyle = "rgba(168, 85, 247, 0.3)" // Purple accent
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, height * 0.75)
    ctx.lineTo(width, height * 0.75)
    ctx.stroke()
  }, [])

  const drawCenteredMultiplier = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const displayMultiplier = gamePhase === "crashed" ? crashMultiplier : currentMultiplier
      const multiplierText = `${displayMultiplier.toFixed(2)}x`

      const centerX = width / 2
      const centerY = height / 2

      const baseFontSize = Math.max(
        24, // Minimum font size for very small screens
        Math.min(
          width * 0.15, // Scale with width (reduced from 0.22)
          height * 0.2, // Scale with height (reduced from 0.28)
          width < 400 ? width * 0.18 : width * 0.15, // Larger scaling for mobile
          height < 300 ? height * 0.25 : height * 0.2, // Larger scaling for short screens
        ),
      )

      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      ctx.font = `900 ${baseFontSize}px system-ui, -apple-system, sans-serif`

      ctx.shadowColor = "#ec4899" // Pink accent
      ctx.shadowBlur = baseFontSize / 1.8
      ctx.fillStyle = "rgba(236, 72, 153, 0.6)"
      ctx.fillText(multiplierText, centerX, centerY)

      // Mid glow with purple
      ctx.shadowBlur = baseFontSize / 3
      ctx.fillStyle = "#a855f7" // Purple accent
      ctx.fillText(multiplierText, centerX, centerY)

      ctx.shadowBlur = baseFontSize / 6
      ctx.fillStyle = "#8b5cf6" // Bright purple
      ctx.fillText(multiplierText, centerX, centerY)

      ctx.shadowBlur = 0
      ctx.fillStyle = "#ffffff" // Clean white highlight
      ctx.font = `900 ${baseFontSize * 0.95}px system-ui, -apple-system, sans-serif`
      ctx.fillText(multiplierText, centerX, centerY - 2)

      const statusFontSize = Math.max(8, baseFontSize * 0.25) // Minimum 8px for readability
      ctx.font = `700 ${statusFontSize}px system-ui, -apple-system, sans-serif`

      let statusText = ""
      let statusColor = "#ec4899"

      switch (gamePhase) {
        case "flying":
          statusText = "ALTITUDE RISING..."
          statusColor = "#a855f7" // Purple
          break
        case "crashed":
          statusText = "FLIGHT ENDED"
          statusColor = "#ef4444" // Red
          break
        default:
          statusText = "CLEARED FOR TAKEOFF"
          statusColor = "#ec4899" // Pink
      }

      ctx.shadowColor = statusColor
      ctx.shadowBlur = statusFontSize / 1.5
      ctx.fillStyle = statusColor
      ctx.fillText(statusText, centerX, centerY + baseFontSize * 0.75)

      if (gamePhase === "flying") {
        const time = Date.now() * 0.004
        const ringRadius = Math.max(30, baseFontSize * 1.2) + Math.sin(time) * 8

        ctx.strokeStyle = `rgba(168, 85, 247, ${0.6 + Math.sin(time * 2) * 0.3})`
        ctx.lineWidth = Math.max(1, width < 400 ? 2 : 3) // Thinner lines on mobile
        ctx.shadowBlur = 15
        ctx.shadowColor = "#a855f7"
        ctx.beginPath()
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
        ctx.stroke()

        const innerRing = ringRadius * 0.7
        ctx.strokeStyle = `rgba(236, 72, 119, ${0.4 + Math.sin(time * 3) * 0.2})`
        ctx.lineWidth = Math.max(1, width < 400 ? 1 : 2)
        ctx.beginPath()
        ctx.arc(centerX, centerY, innerRing, 0, Math.PI * 2)
        ctx.stroke()
      }
    },
    [gamePhase, currentMultiplier, crashMultiplier],
  )

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !isAnimatingRef.current) return

    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    drawBackground(ctx, width, height)
    drawCenteredMultiplier(ctx, width, height)

    if (gamePhase === "flying" || gamePhase === "crashed") {
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [gamePhase, drawBackground, drawCenteredMultiplier])

  // Start/stop game functions
  const startGame = useCallback(() => {
    startTimeRef.current = Date.now()
    isAnimatingRef.current = true
    animate()
  }, [animate])

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
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      drawBackground(ctx, rect.width, rect.height)
      drawCenteredMultiplier(ctx, rect.width, rect.height)
    }

    setupCanvas()

    const handleResize = () => {
      setTimeout(setupCanvas, 100)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [drawBackground, drawCenteredMultiplier])

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-2 border-white/10 shadow-xl overflow-hidden rounded-xl sm:rounded-2xl hover:shadow-purple-500/20 hover:border-purple-400/40 transition-all duration-500 relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 rounded-xl sm:rounded-2xl"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/30 to-transparent"></div>

      <CardContent className="p-0 relative z-10">
        {isBettingPhase || !isInitialized ? (
          <div className="flex flex-col items-center justify-center h-[180px] xs:h-[220px] sm:h-[280px] md:h-[320px] lg:h-[380px] xl:h-[420px] bg-gradient-to-br from-black/30 via-purple-900/20 to-pink-900/20 relative overflow-hidden rounded-xl sm:rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-purple-500/15" />
            <div className="absolute top-1/3 left-1/3 w-24 h-24 xs:w-32 xs:h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/3 right-1/3 w-32 h-32 xs:w-40 xs:h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-96 lg:h-96 xl:w-[28rem] xl:h-[28rem] bg-pink-500/15 rounded-full blur-3xl animate-pulse delay-1000" />

            <div className="relative z-10 text-center px-3 sm:px-4">
              {!isInitialized ? (
                <>
                  <div className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4 sm:mb-6 animate-pulse">
                    AVIATOR
                  </div>
                  <div className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-300 mb-4 sm:mb-6 font-medium">
                    Connecting to flight control...
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <Loader2 className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 animate-spin text-purple-400" />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse"
                      style={{ animationDelay: "1s" }}
                    ></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4 sm:mb-6 animate-pulse">
                    {roundCountdown}
                  </div>
                  <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl text-white font-bold mb-4 sm:mb-6 flex items-center justify-center gap-2 sm:gap-3">
                    <Plane className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-purple-400 animate-bounce" />
                    <span className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl">NEXT FLIGHT</span>
                    <Plane
                      className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-pink-400 animate-bounce"
                      style={{ animationDelay: "0.5s" }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-3 sm:gap-4 text-gray-300">
                    <Clock className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 animate-pulse text-purple-400" />
                    <span className="text-sm xs:text-base sm:text-lg font-semibold">Ready for takeoff!</span>
                  </div>
                </>
              )}
            </div>

            {isInitialized && (
              <div className="absolute bottom-0 left-0 right-0 h-1.5 xs:h-2 sm:h-3 bg-black/30 backdrop-blur-sm">
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
              className="w-full h-[180px] xs:h-[220px] sm:h-[280px] md:h-[320px] lg:h-[380px] xl:h-[420px] rounded-xl sm:rounded-2xl"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                background:
                  "linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(88, 28, 135, 0.15) 30%, rgba(219, 39, 119, 0.1) 70%, rgba(30, 41, 59, 0.2) 100%)",
              }}
            />

            {showCrashScreen && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/20 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                <div className="text-center animate-pulse px-3 sm:px-4">
                  <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent mb-3 sm:mb-4">
                    FLIGHT ENDED!
                  </div>
                  <div className="text-xl xs:text-2xl sm:text-3xl md:text-4xl text-white font-bold">
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
