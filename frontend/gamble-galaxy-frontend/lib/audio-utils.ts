// Audio utilities for the aviator game
let backgroundMusic: HTMLAudioElement | null = null
let soundEffects: { [key: string]: HTMLAudioElement } = {}

// Initialize background music
export const playBackgroundMusic = () => {
  try {
    if (!backgroundMusic) {
      backgroundMusic = new Audio("/sounds/background-music.mp3")
      backgroundMusic.loop = true
      backgroundMusic.volume = 0.15 // Low volume so it doesn't interfere with game sounds

      // Handle the end event to restart the music (though loop should handle this)
      backgroundMusic.addEventListener("ended", () => {
        if (backgroundMusic) {
          backgroundMusic.currentTime = 0
          backgroundMusic.play().catch(console.error)
        }
      })
    }

    // Try to play, handle autoplay restrictions
    const playPromise = backgroundMusic.play()
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Background music autoplay prevented:", error)
        // Try again on first user interaction
        const playOnInteraction = () => {
          if (backgroundMusic) {
            backgroundMusic.play().catch(console.error)
          }
          document.removeEventListener("click", playOnInteraction)
          document.removeEventListener("keydown", playOnInteraction)
        }
        document.addEventListener("click", playOnInteraction)
        document.addEventListener("keydown", playOnInteraction)
      })
    }
  } catch (error) {
    console.error("Error playing background music:", error)
  }
}

// Stop background music
export const stopBackgroundMusic = () => {
  if (backgroundMusic) {
    backgroundMusic.pause()
    backgroundMusic.currentTime = 0
  }
}

// Play sound effects
export const playSound = (soundName: string) => {
  try {
    // Create or get existing sound effect
    if (!soundEffects[soundName]) {
      let soundPath = ""

      switch (soundName) {
        case "crash":
          soundPath = "/sounds/crash.mp3"
          break
        case "cashout":
          soundPath = "/sounds/cashout.mp3"
          break
        default:
          console.warn(`Unknown sound: ${soundName}`)
          return
      }

      soundEffects[soundName] = new Audio(soundPath)
      soundEffects[soundName].volume = 0.5 // Higher volume for sound effects
    }

    // Reset and play the sound
    const sound = soundEffects[soundName]
    sound.currentTime = 0
    sound.play().catch((error) => {
      console.error(`Error playing ${soundName} sound:`, error)
    })
  } catch (error) {
    console.error(`Error with ${soundName} sound:`, error)
  }
}

// Cleanup function
export const cleanupAudio = () => {
  stopBackgroundMusic()

  // Clean up sound effects
  Object.values(soundEffects).forEach((sound) => {
    sound.pause()
    sound.currentTime = 0
  })
  soundEffects = {}
}
