import React from "react"

export const Button = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-md transition ${className}`}
    {...props}
  >
    {children}
  </button>
)
