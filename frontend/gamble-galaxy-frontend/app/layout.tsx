"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { WalletProvider } from "@/context/WalletContext";
import "./globals.css";

const excludeNavbarRoutes = ["/login", "/register"]; // Add your routes to exclude Navbar here

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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