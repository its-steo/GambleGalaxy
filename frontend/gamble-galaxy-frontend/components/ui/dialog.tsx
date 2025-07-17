import React from "react"
import ReactDOM from "react-dom"

interface DialogProps {
  isOpen: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  title,
  onClose,
  children,
}) => {
  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        {title && (
          <h2 className="text-lg font-semibold mb-4 text-gray-800">{title}</h2>
        )}
        <button
          className="absolute top-2 right-3 text-gray-600 hover:text-black"
          onClick={onClose}
        >
          ×
        </button>
        <div>{children}</div>
      </div>
    </div>,
    document.body
  )
}
