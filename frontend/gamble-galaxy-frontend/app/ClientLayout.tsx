"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { WalletProvider } from "@/context/WalletContext";
import { useAuth } from "@/lib/auth";
import { useEffect, Suspense } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";

const excludeNavbarRoutes = ["/auth/login", "/auth/register"];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loadUser, isLoading } = useAuth();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <img
            src="/assets/images/gamble-logo-192.png"
            alt="Gamble Galaxy Logo"
            className="w-48 h-auto mx-auto mb-4"
          />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      <WalletProvider>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <img
                  src="/assets/images/gamble-logo-192.png"
                  alt="Gamble Galaxy Logo"
                  className="w-48 h-auto mx-auto mb-4"
                />
                <p className="text-white text-lg">Loading...</p>
              </div>
            </div>
          }
        >
          {!excludeNavbarRoutes.includes(pathname) && <Navbar />}
          <main className="min-h-screen w-full overflow-x-hidden">{children}</main>
          <Toaster
            position="top-center"
            richColors
            expand
            closeButton
            duration={3500}
            toastOptions={{
              classNames: {
                toast:
                  "rounded-xl border border-white/10 bg-white/10 backdrop-blur-md text-white shadow-lg",
                title: "font-semibold text-sm sm:text-base",
                description: "text-xs sm:text-sm text-neutral-200",
                closeButton: "text-white hover:text-red-400",
              },
              style: {
                padding: "12px 16px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                fontSize: "14px",
              },
            }}
          />
        </Suspense>
      </WalletProvider>
    </ThemeProvider>
  );
}