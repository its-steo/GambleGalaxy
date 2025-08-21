"use client"

import { useEffect } from "react"

import { useState } from "react"

import { useCallback, useRef } from "react"

// Throttle function for mouse events
export const useThrottledCallback = (callback, delay) => {
  const lastRun = useRef(Date.now())

  return useCallback(
    (...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    },
    [callback, delay],
  )
}

// Debounce function for expensive operations
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null)

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay],
  )
}

// Memoized animation variants to prevent recreation
export const animationVariants = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },
  slideIn: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: 0.2 },
  },
}

// Optimized intersection observer hook
export const useIntersectionObserver = (options = {}) => {
  const elementRef = useRef(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => setIsIntersecting(entry.isIntersecting), {
      threshold: 0.1,
      ...options,
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [options])

  return [elementRef, isIntersecting]
}

export const createOptimizedParticles = (count = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    opacity: Math.random() * 0.5 + 0.1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }))
}
