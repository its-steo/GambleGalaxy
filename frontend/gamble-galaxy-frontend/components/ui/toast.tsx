// toast.tsx
import * as React from "react"

export type ToastActionElement = React.ReactNode

export type ToastProps = {
  open?: boolean
  title?: string
  description?: string
  action?: ToastActionElement
  // Add any other props your toast supports
}

// Example component
export function Toast({ open, title, description, action }: ToastProps) {
  return open ? (
    <div className="toast">
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  ) : null
}
