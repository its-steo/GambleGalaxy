"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { WalletProvider } from "@/context/WalletContext";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import "./globals.css";

const excludeNavbarRoutes = ["/auth/login", "/auth/register"]; // Updated to match exact routes

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { loadUser, isLoading } = useAuth();

  // Load user on app initialization to sync auth state
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Prevent rendering until auth state is loaded
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
    );
  }

  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <WalletProvider>
          {!excludeNavbarRoutes.includes(pathname) && <Navbar />}
          <main>{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}