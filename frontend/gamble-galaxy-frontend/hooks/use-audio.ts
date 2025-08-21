//"use client"
//
//import type React from "react"
//
//import { useEffect, useRef, useCallback } from "react"
//
//interface AudioManager {
//  playBackgroundMusic: () => void
//  stopBackgroundMusic: () => void
//  playSound: (soundType: "crash" | "cashout") => void
//  setBackgroundVolume: (volume: number) => void
//  setSoundVolume: (volume: number) => void
//}
//
//export function useAudio(): AudioManager {
//  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)
//  const crashSoundRef = useRef<HTMLAudioElement | null>(null)
//  const cashoutSoundRef = useRef<HTMLAudioElement | null>(null)
//  const isBackgroundPlayingRef = useRef(false)
//
//  // Initialize audio elements
//  useEffect(() => {
//    // Background music - loops continuously
//    backgroundMusicRef.current = new Audio("/sounds/background-music.mp3")
//    backgroundMusicRef.current.loop = true
//    backgroundMusicRef.current.volume = 0.15 // Lower volume for background
//    backgroundMusicRef.current.preload = "auto"
//
//    // Crash sound - plays once per crash
//    crashSoundRef.current = new Audio("/sounds/crash.mp3")
//    crashSoundRef.current.volume = 0.5
//    crashSoundRef.current.preload = "auto"
//
//    // Cashout sound - plays on successful cashout
//    cashoutSoundRef.current = new Audio("/sounds/cashout.mp3")
//    cashoutSoundRef.current.volume = 0.4
//    cashoutSoundRef.current.preload = "auto"
//
//    return () => {
//      // Cleanup
//      if (backgroundMusicRef.current) {
//        backgroundMusicRef.current.pause()
//        backgroundMusicRef.current = null
//      }
//      if (crashSoundRef.current) {
//        crashSoundRef.current.pause()
//        crashSoundRef.current = null
//      }
//      if (cashoutSoundRef.current) {
//        cashoutSoundRef.current.pause()
//        cashoutSoundRef.current = null
//      }
//    }
//  }, [])
//
//  const playBackgroundMusic = useCallback(() => {
//    if (backgroundMusicRef.current && !isBackgroundPlayingRef.current) {
//      console.log("[v0] Starting background music")
//
//      const playPromise = backgroundMusicRef.current.play()
//
//      if (playPromise !== undefined) {
//        playPromise
//          .then(() => {
//            isBackgroundPlayingRef.current = true
//            console.log("[v0] Background music started successfully")
//          })
//          .catch((error) => {
//            console.log("[v0] Background music autoplay blocked, will retry on user interaction:", error)
//
//            // Retry on first user interaction
//            const handleFirstInteraction = () => {
//              if (backgroundMusicRef.current && !isBackgroundPlayingRef.current) {
//                backgroundMusicRef.current
//                  .play()
//                  .then(() => {
//                    isBackgroundPlayingRef.current = true
//                    console.log("[v0] Background music started after user interaction")
//                  })
//                  .catch(console.error)
//              }
//
//              // Remove listeners after first attempt
//              document.removeEventListener("click", handleFirstInteraction)
//              document.removeEventListener("keydown", handleFirstInteraction)
//              document.removeEventListener("touchstart", handleFirstInteraction)
//            }
//
//            document.addEventListener("click", handleFirstInteraction, { once: true })
//            document.addEventListener("keydown", handleFirstInteraction, { once: true })
//            document.addEventListener("touchstart", handleFirstInteraction, { once: true })
//          })
//      }
//    }
//  }, [])
//
//  const stopBackgroundMusic = useCallback(() => {
//    if (backgroundMusicRef.current && isBackgroundPlayingRef.current) {
//      console.log("[v0] Stopping background music")
//      backgroundMusicRef.current.pause()
//      backgroundMusicRef.current.currentTime = 0
//      isBackgroundPlayingRef.current = false
//    }
//  }, [])
//
//  const playSound = useCallback((soundType: "crash" | "cashout") => {
//    let audioRef: React.MutableRefObject<HTMLAudioElement | null>
//
//    switch (soundType) {
//      case "crash":
//        audioRef = crashSoundRef
//        break
//      case "cashout":
//        audioRef = cashoutSoundRef
//        break
//      default:
//        return
//    }
//
//    if (audioRef.current) {
//      console.log(`[v0] Playing ${soundType} sound`)
//
//      // Reset to beginning and play
//      audioRef.current.currentTime = 0
//
//      const playPromise = audioRef.current.play()
//
//      if (playPromise !== undefined) {
//        playPromise
//          .then(() => {
//            console.log(`[v0] ${soundType} sound played successfully`)
//          })
//          .catch((error) => {
//            console.log(`[v0] ${soundType} sound play failed:`, error)
//          })
//      }
//    }
//  }, [])
//
//  const setBackgroundVolume = useCallback((volume: number) => {
//    if (backgroundMusicRef.current) {
//      backgroundMusicRef.current.volume = Math.max(0, Math.min(1, volume))
//    }
//  }, [])
//
//  const setSoundVolume = useCallback((volume: number) => {
//    const clampedVolume = Math.max(0, Math.min(1, volume))
//
//    if (crashSoundRef.current) {
//      crashSoundRef.current.volume = clampedVolume
//    }
//    if (cashoutSoundRef.current) {
//      cashoutSoundRef.current.volume = clampedVolume
//    }
//  }, [])
//
//  return {
//    playBackgroundMusic,
//    stopBackgroundMusic,
//    playSound,
//    setBackgroundVolume,
//    setSoundVolume,
//  }
//}
//