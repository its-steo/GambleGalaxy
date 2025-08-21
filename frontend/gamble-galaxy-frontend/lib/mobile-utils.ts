"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"

export const isMobile = () => {
  if (typeof window === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export const isTouchDevice = () => {
  if (typeof window === "undefined") return false
  return "ontouchstart" in window || navigator.maxTouchPoints > 0
}

export const isIOS = () => {
  if (typeof window === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export const useMobileOptimizedTracking = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const touchDevice = isTouchDevice()
    setIsTouch(touchDevice)

    if (touchDevice) {
      // Don't track mouse on touch devices to save performance
      return
    }

    let animationFrame: number

    const handleMouseMove = (e: MouseEvent) => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }

      animationFrame = requestAnimationFrame(() => {
        setPosition({ x: e.clientX, y: e.clientY })
      })
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return { position, isTouch }
}

export const useMobileSafeHover = () => {
  const [isHovered, setIsHovered] = useState(false)
  const touchDevice = isTouchDevice()

  const handleMouseEnter = useCallback(() => {
    if (!touchDevice) {
      setIsHovered(true)
    }
  }, [touchDevice])

  const handleMouseLeave = useCallback(() => {
    if (!touchDevice) {
      setIsHovered(false)
    }
  }, [touchDevice])

  const handleTouchStart = useCallback(() => {
    if (touchDevice) {
      setIsHovered(true)
    }
  }, [touchDevice])

  const handleTouchEnd = useCallback(() => {
    if (touchDevice) {
      setTimeout(() => setIsHovered(false), 150) // Brief delay for visual feedback
    }
  }, [touchDevice])

  return {
    isHovered,
    hoverProps: touchDevice
      ? {
          onTouchStart: handleTouchStart,
          onTouchEnd: handleTouchEnd,
        }
      : {
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        },
  }
}

export const useMobileViewport = () => {
  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    const updateViewportHeight = () => {
      // Use visualViewport API if available, fallback to window.innerHeight
      const height = window.visualViewport?.height || window.innerHeight
      setViewportHeight(height)

      // Set CSS custom property for mobile viewport
      document.documentElement.style.setProperty("--vh", `${height * 0.01}px`)
    }

    updateViewportHeight()

    // Listen for viewport changes (keyboard open/close, orientation change)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateViewportHeight)
    } else {
      window.addEventListener("resize", updateViewportHeight)
      window.addEventListener("orientationchange", updateViewportHeight)
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateViewportHeight)
      } else {
        window.removeEventListener("resize", updateViewportHeight)
        window.removeEventListener("orientationchange", updateViewportHeight)
      }
    }
  }, [])

  return viewportHeight
}

export const preventIOSZoom = () => {
  if (!isIOS()) return

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault()
    }
  }

  let lastTouchEnd = 0
  const handleTouchEnd = (e: TouchEvent) => {
    const now = new Date().getTime()
    if (now - lastTouchEnd <= 300) {
      e.preventDefault()
    }
    lastTouchEnd = now
  }

  document.addEventListener("touchstart", handleTouchStart, { passive: false })
  document.addEventListener("touchend", handleTouchEnd, { passive: false })

  return () => {
    document.removeEventListener("touchstart", handleTouchStart)
    document.removeEventListener("touchend", handleTouchEnd)
  }
}

export const useMobileSafeAnimation = (callback: () => void, deps: React.DependencyList) => {
  const memoizedCallback = useCallback(callback, [callback, ...deps])

  useEffect(() => {
    if (isMobile()) {
      // Reduce animation frequency on mobile
      const interval = setInterval(memoizedCallback, 100) // 10fps instead of 60fps
      return () => clearInterval(interval)
    } else {
      // Use requestAnimationFrame on desktop
      let animationFrame: number
      const animate = () => {
        memoizedCallback()
        animationFrame = requestAnimationFrame(animate)
      }
      animationFrame = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animationFrame)
    }
  }, [memoizedCallback])
}
