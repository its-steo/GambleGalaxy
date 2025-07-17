// components/ui/Input.tsx
import React from "react"
import clsx from "clsx"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          "w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
