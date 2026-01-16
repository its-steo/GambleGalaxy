import dynamic from "next/dynamic"

// Heavy components that should be loaded dynamically
export const AviatorGameSimplified = dynamic(
  () => import("@/components/games/aviator-game-simplified").then((mod) => ({ default: mod.AviatorGameSimplified })),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    ),
    ssr: false, // Disable SSR for game component
  },
)

export const GlassSideNav = dynamic(() => import("@/components/layout/glass-side-nav"), {
  loading: () => <div className="w-64 h-full bg-white/5 backdrop-blur-xl animate-pulse"></div>,
})

export const BettingPanel = dynamic(() => import("@/components/games/aviator/betting-panel"), {
  loading: () => <div className="h-48 bg-white/5 backdrop-blur-xl rounded-xl animate-pulse"></div>,
})

// Icon optimization - load icons dynamically when needed
export const createDynamicIcon = (iconName) => {
  return dynamic(() => import("lucide-react").then((mod) => ({ default: mod[iconName] })), { ssr: false })
}
