"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "./navbar"
import { WalletProvider } from "@/context/WalletContext"
import { Toaster } from "sonner"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/register"

  if (isAuthPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  return (
    <WalletProvider>
      <Navbar />
      <main>{children}</main>
      <Toaster />
    </WalletProvider>
  )
}
