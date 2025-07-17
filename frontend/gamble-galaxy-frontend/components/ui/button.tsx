// components/ui/Button.tsx
import React from "react"
import clsx from "clsx"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive"
  className?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"

    const variantClasses = {
      default: "bg-blue-600 text-white hover:bg-blue-700",
      outline: "border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:text-white",
      ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800",
      destructive: "bg-red-600 text-white hover:bg-red-700",
    }

    return (
      <button
        ref={ref}
        className={clsx(baseClasses, variantClasses[variant], className)}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
