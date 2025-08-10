"use client"

import type React from "react"
import ReactDOM from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

export interface DialogHeaderProps {
  className?: string
  children: React.ReactNode
}

export interface DialogTitleProps {
  className?: string
  children: React.ReactNode
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null

  const handleClose = () => {
    onOpenChange?.(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg">{children}</div>
    </div>,
    document.body,
  )
}

export const DialogContent: React.FC<DialogContentProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-2xl w-full p-0 relative animate-in fade-in-0 zoom-in-95 duration-300",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ className, children }) => {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>{children}</div>
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ className, children }) => {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h2>
}

// For backward compatibility with your existing Dialog usage
export interface LegacyDialogProps {
  isOpen: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
}

export const LegacyDialog: React.FC<LegacyDialogProps> = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in-0 zoom-in-95 duration-300">
        {title && <h2 className="text-lg font-semibold mb-4 text-gray-800">{title}</h2>}
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-black transition-colors p-1 rounded-lg hover:bg-gray-100"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <div>{children}</div>
      </div>
    </div>,
    document.body,
  )
}