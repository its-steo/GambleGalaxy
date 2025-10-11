// app/root-layout.tsx
import type { Metadata } from "next";
import { ReactNode } from "react";
import Head from "next/head";

export const metadata: Metadata = {
  title: "GambleGalaxy - Professional Gambling Platform",
  description:
    "Professional platform for gambling with advanced features, analytics, and user management",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/assets/images/gamblegalaxy-logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/images/gamblegalaxy-logo-512.png", sizes: "512x512", type: "image/png" },
      { url: "/assets/images/gamblegalaxy-logo-maskable-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/images/gamblegalaxy-logo-maskable-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/assets/images/gamblegalaxy-logo-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3d3d3d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/assets/images/home.png" />
      </Head>
      <body>{children}</body>
    </html>
  );
}