"use client"
import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"
import { useNotifications } from "@/contexts/notification-context"
import { Button } from "@/components/ui/button"

export function ToastContainer() {
  const { notifications, removeNotification } = useNotifications()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} onClose={() => removeNotification(notification.id)} />
      ))}
    </div>
  )
}

function Toast({ notification, onClose }: { notification: any; onClose: () => void }) {
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-400" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-400" />
      default:
        return <Info className="h-5 w-5 text-blue-400" />
    }
  }

  const getBorderColor = () => {
    switch (notification.type) {
      case "success":
        return "border-green-500/30"
      case "error":
        return "border-red-500/30"
      case "warning":
        return "border-yellow-500/30"
      default:
        return "border-blue-500/30"
    }
  }

  return (
    <div
      className={`glass-dark p-4 rounded-lg border ${getBorderColor()} min-w-80 max-w-md animate-in slide-in-from-right`}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1">
          <h4 className="text-white font-medium text-sm">{notification.title}</h4>
          <p className="text-white/70 text-sm mt-1">{notification.message}</p>
        </div>
        <Button onClick={onClose} variant="ghost" size="sm" className="text-white/60 hover:text-white h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
