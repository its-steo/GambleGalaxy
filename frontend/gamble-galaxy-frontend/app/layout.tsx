//"use client";
//
//import { usePathname } from "next/navigation";
//import { Navbar } from "@/components/layout/navbar";
//import { WalletProvider } from "@/context/WalletContext";
//import { useAuth } from "@/lib/auth";
//import { useEffect } from "react";
//import "./globals.css";
//import { Toaster } from "sonner";
//import { ThemeProvider } from "../components/themes/theme-provider";
//
//const excludeNavbarRoutes = ["/auth/login", "/auth/register"];
//
//export default function RootLayout({
//  children,
//}: {
//  children: React.ReactNode;
//}) {
//  const pathname = usePathname();
//  const { loadUser, isLoading } = useAuth();
//
//  // Sync user session on mount
//  useEffect(() => {
//    loadUser();
//  }, [loadUser]);
//
//  // Loading state
//  if (isLoading) {
//    return (
//      <html lang="en">
//        <head>
//          {/* <link
//            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
//            rel="stylesheet"
//          /> */}
//          <link rel="icon" href="/assets/images/home.png" />
//        </head>
//        <body className="bg-gray-900 text-white">
//          <div className="min-h-screen flex items-center justify-center">
//            <div className="text-center">
//              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-4"></div>
//              <p className="text-white text-lg">Loading...</p>
//            </div>
//          </div>
//        </body>
//      </html>
//    );
//  }
//
//  return (
//    <html lang="en">
//      <head>
//        {/* <link
//          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
//          rel="stylesheet"
//        /> */}
//        <link rel="icon" href="/assets/images/home.png" />
//      </head>
//      <body className="bg-gray-900 text-white font-sans antialiased">
//        <ThemeProvider
//          attribute="class"
//          defaultTheme="system"
//          enableSystem
//          disableTransitionOnChange
//        >
//          <WalletProvider>
//            {/* Optional Navbar */}
//            {!excludeNavbarRoutes.includes(pathname) && <Navbar />}
//
//            {/* Main content */}
//            <main className="min-h-screen w-full overflow-x-hidden">
//              {children}
//            </main>
//
//            {/* Global Toaster with Glassmorphism */}
//            <Toaster
//              position="top-center"
//              richColors
//              expand
//              closeButton
//              duration={3500}
//              toastOptions={{
//                classNames: {
//                  toast:
//                    "rounded-xl border border-white/10 bg-white/10 backdrop-blur-md text-white shadow-lg",
//                  title: "font-semibold text-sm sm:text-base",
//                  description: "text-xs sm:text-sm text-neutral-200",
//                  closeButton: "text-white hover:text-red-400",
//                },
//                style: {
//                  padding: "12px 16px",
//                  borderRadius: "12px",
//                  background: "rgba(255, 255, 255, 0.1)", // Semi-transparent white for glass effect
//                  backdropFilter: "blur(10px)", // Blur for frosted glass
//                  WebkitBackdropFilter: "blur(10px)", // Safari support
//                  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)", // Soft shadow
//                  border: "1px solid rgba(255, 255, 255, 0.2)", // Subtle border
//                  fontSize: "14px",
//                },
//              }}
//            />
//          </WalletProvider>
//        </ThemeProvider>
//      </body>
//    </html>
//  );
//}

"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { WalletProvider } from "@/context/WalletContext";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes"; // Assuming this is from next-themes

const excludeNavbarRoutes = ["/auth/login", "/auth/register"];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { loadUser, isLoading } = useAuth();

  // Sync user session on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Loading state
  if (isLoading) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/assets/images/home.png" />
        </head>
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/assets/images/home.png" />
      </head>
      <body className="bg-gray-900 text-white font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            {/* Optional Navbar */}
            {!excludeNavbarRoutes.includes(pathname) && <Navbar />}

            {/* Main content */}
            <main className="min-h-screen w-full overflow-x-hidden">
              {children}
            </main>

            {/* Global Toaster with Glassmorphism */}
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
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}