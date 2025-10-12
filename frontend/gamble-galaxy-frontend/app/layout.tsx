import type { Metadata } from "next";
import type { ReactNode } from "react";
import Head from "next/head";
import ClientLayout from "./ClientLayout"; // New Client Component
import "./globals.css";

export const metadata: Metadata = {
  title: "Gamble Galaxy - Premier Gambling Platform",
  description: "Professional gambling platform with advanced features and analytics",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/assets/images/gamble-logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/images/gamble-logo-512.png", sizes: "512x512", type: "image/png" },
      { url: "/assets/images/gamble-logo-maskable-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/images/gamble-logo-maskable-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/assets/images/gamble-logo-192.png", sizes: "192x192", type: "image/png" },
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
        <script
          defer
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </Head>
      <body className="bg-gray-900 text-white font-sans antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}