"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, Smartphone, Key, AlertTriangle, CheckCircle, Copy, Download, Lock } from "lucide-react"
import { useNotification } from "./notification-system"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SecurityEvent {
  id: string
  type: "login" | "failed_login" | "password_change" | "2fa_enabled" | "suspicious_activity"
  description: string
  timestamp: Date
  location: string
  device: string
  riskLevel: "low" | "medium" | "high"
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  loginNotifications: boolean
  deviceTracking: boolean
  sessionTimeout: number
  passwordExpiry: number
}

export default function SecuritySystem() {
  const [activeTab, setActiveTab] = useState("overview")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginNotifications: true,
    deviceTracking: true,
    sessionTimeout: 30,
    passwordExpiry: 90,
  })
  const { addNotification } = useNotification()

  useEffect(() => {
    // Load security events
    const mockEvents: SecurityEvent[] = Array.from({ length: 20 }, (_, i) => ({
      id: `event_${i}`,
      type: ["login", "failed_login", "password_change", "2fa_enabled", "suspicious_activity"][
        Math.floor(Math.random() * 5)
      ] as any,
      description: [
        "Successful login from new device",
        "Failed login attempt",
        "Password changed successfully",
        "Two-factor authentication enabled",
        "Suspicious betting pattern detected",
      ][Math.floor(Math.random() * 5)],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      location: ["Nairobi, Kenya", "Mombasa, Kenya", "Kisumu, Kenya", "Nakuru, Kenya"][Math.floor(Math.random() * 4)],
      device: ["iPhone 14", "Samsung Galaxy S23", "Chrome on Windows", "Firefox on Mac"][Math.floor(Math.random() * 4)],
      riskLevel: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as any,
    }))

    setSecurityEvents(mockEvents)

    // Check if 2FA is enabled
    const twoFAStatus = localStorage.getItem("twoFactorEnabled") === "true"
    setTwoFactorEnabled(twoFAStatus)
    setSettings((prev) => ({ ...prev, twoFactorEnabled: twoFAStatus }))
  }, [])

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 8 }, () => Math.random().toString(36).substr(2, 8).toUpperCase())
    setBackupCodes(codes)
    return codes
  }

  const enableTwoFactor = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      addNotification({
        type: "error",
        title: "Invalid Code",
        message: "Please enter a valid 6-digit code",
      })
      return
    }

    // Simulate verification
    if (verificationCode === "123456") {
      setTwoFactorEnabled(true)
      localStorage.setItem("twoFactorEnabled", "true")

      const codes = generateBackupCodes()

      addNotification({
        type: "success",
        title: "2FA Enabled!",
        message: "Two-factor authentication has been successfully enabled",
      })

      setShowQRCode(false)
      setVerificationCode("")
    } else {
      addNotification({
        type: "error",
        title: "Invalid Code",
        message: "The verification code is incorrect",
      })
    }
  }

  const disableTwoFactor = () => {
    setTwoFactorEnabled(false)
    localStorage.setItem("twoFactorEnabled", "false")
    setBackupCodes([])

    addNotification({
      type: "info",
      title: "2FA Disabled",
      message: "Two-factor authentication has been disabled",
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addNotification({
      type: "success",
      title: "Copied!",
      message: "Code copied to clipboard",
    })
  }

  const downloadBackupCodes = () => {
    const content = backupCodes.join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-green-600">85%</p>
              <p className="text-sm text-muted-foreground">Your account is well protected</p>
            </div>
            <Badge className="bg-green-100 text-green-800">Good</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {securityEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded">
                <span>{event.description}</span>
                <Badge variant="secondary">{event.timestamp.toLocaleDateString()}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTwoFactor = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
          {!twoFactorEnabled ? (
            <Button onClick={() => setShowQRCode(true)}>Enable 2FA</Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                <CheckCircle className="text-green-400" size={24} />
                <div>
                  <div className="text-white font-medium">Two-Factor Authentication Enabled</div>
                  <div className="text-white/70 text-sm">Your account is protected with 2FA</div>
                </div>
              </div>

              {backupCodes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Backup Codes</h4>
                  <p className="text-white/70 text-sm">
                    Save these backup codes in a safe place. You can use them to access your account if you lose your
                    phone.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                        <span className="text-white font-mono text-sm">{code}</span>
                        <button onClick={() => copyToClipboard(code)} className="text-white/60 hover:text-white">
                          <Copy size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={downloadBackupCodes}
                    className="w-full py-2 bg-white/10 text-white rounded-xl flex items-center justify-center space-x-2"
                  >
                    <Download size={16} />
                    <span>Download Backup Codes</span>
                  </Button>
                </div>
              )}

              <Button
                onClick={disableTwoFactor}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl"
              >
                Disable Two-Factor Authentication
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              key: "loginNotifications",
              label: "Login Notifications",
              description: "Get notified when someone logs into your account",
            },
            {
              key: "deviceTracking",
              label: "Device Tracking",
              description: "Track devices that access your account",
            },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <div className="text-white font-medium">{setting.label}</div>
                <div className="text-white/60 text-sm">{setting.description}</div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    [setting.key as keyof SecuritySettings]: !prev[setting.key as keyof SecuritySettings],
                  }))
                }
                className={`w-12 h-6 rounded-full transition-all ${
                  settings[setting.key as keyof SecuritySettings]
                    ? "bg-gradient-to-r from-green-500 to-blue-500"
                    : "bg-white/20"
                }`}
              >
                <motion.div
                  animate={{
                    x: settings[setting.key as keyof SecuritySettings] ? 24 : 0,
                  }}
                  className="w-6 h-6 bg-white rounded-full shadow-lg"
                />
              </motion.button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  const renderDeviceManagement = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Device Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <p className="font-medium">Chrome on Windows</p>
              <p className="text-sm text-muted-foreground">Current session</p>
            </div>
            <Badge>Active</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen p-4 pt-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Security Center</h1>
          <p className="text-muted-foreground">Protect your account with advanced security</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: Shield },
            { id: "2fa", label: "2FA", icon: Smartphone },
            { id: "settings", label: "Settings", icon: Key },
            { id: "devices", label: "Devices", icon: Smartphone },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && renderOverview()}
          {activeTab === "2fa" && renderTwoFactor()}
          {activeTab === "settings" && renderSettings()}
          {activeTab === "devices" && renderDeviceManagement()}
        </motion.div>
      </motion.div>
    </div>
  )
}
