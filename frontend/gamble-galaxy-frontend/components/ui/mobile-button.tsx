"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useMobileSafeHover } from "@/lib/mobile-utils"

interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
}

export const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    const { isHovered, hoverProps } = useMobileSafeHover()

    const baseClasses = cn(
      "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
      "disabled:opacity-50 disabled:pointer-events-none",
      "touch-target no-select", // Mobile-specific classes
      {
        // Variants
        "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg": variant === "default",
        "bg-transparent text-gray-300 hover:text-white": variant === "ghost",
        "border border-white/20 bg-white/5 text-white backdrop-blur-sm": variant === "outline",

        // Sizes with mobile-friendly touch targets
        "px-3 py-2 text-sm min-h-[44px]": size === "sm",
        "px-4 py-3 text-base min-h-[48px]": size === "md",
        "px-6 py-4 text-lg min-h-[52px]": size === "lg",

        // Mobile-safe hover states
        "hover:shadow-xl hover:scale-105": !isHovered && variant === "default",
        "shadow-xl scale-105": isHovered && variant === "default",
        "hover:bg-white/10": !isHovered && variant === "ghost",
        "bg-white/10": isHovered && variant === "ghost",
        "hover:bg-white/15 hover:border-white/30": !isHovered && variant === "outline",
        "bg-white/15 border-white/30": isHovered && variant === "outline",
      },
      className,
    )

    return (
      <button ref={ref} className={baseClasses} {...hoverProps} {...props}>
        {children}
      </button>
    )
  },
)

MobileButton.displayName = "MobileButton"
