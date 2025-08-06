import React from "react"
import classNames from "classnames"

interface BadgeProps {
  children: React.ReactNode
  variant?: "primary" | "success" | "warning" | "danger"
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "primary",
  className = "",
}) => {
  const baseStyles =
    "inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full"

  const variants = {
    primary: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  }

  return (
    <span className={classNames(baseStyles, variants[variant], className)}>
      {children}
    </span>
  )
}