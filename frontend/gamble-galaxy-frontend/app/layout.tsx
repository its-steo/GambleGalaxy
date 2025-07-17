import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/layout/navbar"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gamble Galaxy - Next Generation Betting Platform",
  description: "Experience the thrill of Aviator game and sports betting on Gamble Galaxy",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
