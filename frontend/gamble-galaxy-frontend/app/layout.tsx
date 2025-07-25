"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { WalletProvider } from "@/context/WalletContext"
import { useAuth } from "@/lib/auth"
import { useEffect } from "react"
import "./globals.css"
import { Toaster } from "sonner"

const excludeNavbarRoutes = ["/auth/login", "/auth/register"]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { loadUser, isLoading } = useAuth()

  // Sync user session on mount
  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Loading state
  if (isLoading) {
    return (
      <html lang="en">
        <body className="bg-gray-900 text-white">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading...</p>
            </div>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className="bg-gray-900 text-white font-sans antialiased">
        <WalletProvider>
          {/* Optional Navbar */}
          {!excludeNavbarRoutes.includes(pathname) && <Navbar />}

          {/* Main content */}
          <main className="min-h-screen w-full overflow-x-hidden">
            {children}
          </main>

          {/* Global Toaster */}
          <Toaster
            position="top-center"
            richColors
            expand
            closeButton
            duration={3500}
            toastOptions={{
              classNames: {
                toast:
                  "rounded-xl shadow-xl border border-white/20 bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-800 text-white",
                title: "font-semibold text-sm sm:text-base",
                description: "text-xs sm:text-sm text-neutral-300",
                closeButton: "text-white hover:text-red-400",
              },
              style: {
                padding: "12px 16px",
                borderRadius: "12px",
                boxShadow: "0 0 12px rgba(0, 255, 164, 0.3)",
                fontSize: "14px",
              },
            }}
          />
        </WalletProvider>
      </body>
    </html>
  )
}
