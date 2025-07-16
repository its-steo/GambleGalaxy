import React from "react"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-3 py-2 border border-gray-600 bg-gray-700 rounded-md text-sm text-white placeholder-gray-400 ${className}`}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
