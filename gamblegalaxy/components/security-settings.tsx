"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Lock, Shield, Smartphone, Key, Eye, EyeOff, CheckCircle, AlertCircle, Clock, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface SecuritySettingsProps {
  onUpdate: () => void
}

export default function SecuritySettings({ onUpdate }: SecuritySettingsProps) {
  const { token, logout } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation must match",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.new_password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      })

      if (response.ok) {
        toast({
          title: "Password Changed! 🔒",
          description: "Your password has been successfully updated",
        })
        setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_password: "",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Password Change Failed",
          description: error.error || "Failed to change password",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while changing your password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const enableTwoFactor = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/profile/2fa/enable", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setQrCodeUrl(data.qr_code)
        setBackupCodes(data.backup_codes)
        setShowTwoFactorSetup(true)
      } else {
        const error = await response.json()
        toast({
          title: "Setup Failed",
          description: error.error || "Failed to setup 2FA",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while setting up 2FA",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const confirmTwoFactor = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/profile/2fa/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: twoFactorCode }),
      })

      if (response.ok) {
        toast({
          title: "2FA Enabled! 🛡️",
          description: "Two-factor authentication has been successfully enabled",
        })
        setTwoFactorEnabled(true)
        setShowTwoFactorSetup(false)
        setTwoFactorCode("")
        onUpdate()
      } else {
        const error = await response.json()
        toast({
          title: "Verification Failed",
          description: error.error || "Invalid verification code",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while verifying 2FA",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const disableTwoFactor = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/profile/2fa/disable", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "2FA Disabled",
          description: "Two-factor authentication has been disabled",
        })
        setTwoFactorEnabled(false)
        onUpdate()
      } else {
        const error = await response.json()
        toast({
          title: "Disable Failed",
          description: error.error || "Failed to disable 2FA",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while disabling 2FA",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.")

    if (!confirmed) return

    setLoading(true)
    try {
      const response = await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted",
        })
        logout()
      } else {
        const error = await response.json()
        toast({
          title: "Deletion Failed",
          description: error.error || "Failed to delete account",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting your account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Lock className="w-5 h-5 mr-2 text-blue-400" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="text-white">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
                  className="glass-input text-white pr-10"
                  placeholder="Enter current password"
                  required
                />
                <Button
                  type="button"
                  onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-white">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
                  className="glass-input text-white pr-10"
                  placeholder="Enter new password"
                  required
                />
                <Button
                  type="button"
                  onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-white">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                  className="glass-input text-white pr-10"
                  placeholder="Confirm new password"
                  required
                />
                <Button
                  type="button"
                  onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">
              {loading ? "Changing Password..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-400" />
              Two-Factor Authentication
            </span>
            <Badge
              className={
                twoFactorEnabled
                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                  : "bg-red-500/20 text-red-300 border-red-500/30"
              }
            >
              {twoFactorEnabled ? (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Enabled</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Disabled</span>
                </div>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-400">
            Add an extra layer of security to your account with two-factor authentication using an authenticator app.
          </p>

          {!twoFactorEnabled && !showTwoFactorSetup && (
            <Button
              onClick={enableTwoFactor}
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              {loading ? "Setting up..." : "Enable 2FA"}
            </Button>
          )}

          {showTwoFactorSetup && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center">
                <h4 className="text-white font-semibold mb-2">Scan QR Code</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                {qrCodeUrl && (
                  <div className="inline-block p-4 bg-white rounded-lg">
                    <img src={qrCodeUrl || "/placeholder.svg"} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="twoFactorCode" className="text-white">
                  Enter Verification Code
                </Label>
                <Input
                  id="twoFactorCode"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="glass-input text-white text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={confirmTwoFactor}
                  disabled={loading || twoFactorCode.length !== 6}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  {loading ? "Verifying..." : "Verify & Enable"}
                </Button>
                <Button
                  onClick={() => setShowTwoFactorSetup(false)}
                  variant="outline"
                  className="glass-button bg-transparent"
                >
                  Cancel
                </Button>
              </div>

              {backupCodes.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h4 className="text-yellow-300 font-semibold mb-2">Backup Codes</h4>
                  <p className="text-gray-300 text-sm mb-3">
                    Save these backup codes in a safe place. You can use them to access your account if you lose your
                    authenticator device.
                  </p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-black/20 p-2 rounded text-center text-white">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {twoFactorEnabled && (
            <div className="flex items-center justify-between p-4 glass rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">2FA is Active</p>
                  <p className="text-gray-400 text-sm">Your account is protected with 2FA</p>
                </div>
              </div>
              <Button
                onClick={disableTwoFactor}
                disabled={loading}
                variant="outline"
                className="glass-button bg-transparent text-red-400 border-red-400/30 hover:bg-red-500/10"
              >
                {loading ? "Disabling..." : "Disable"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login Sessions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Key className="w-5 h-5 mr-2 text-purple-400" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-400">Manage your active login sessions across different devices and browsers.</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 glass rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Current Session</p>
                  <p className="text-gray-400 text-sm">Chrome on Windows • Active now</p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Current</Badge>
            </div>

            <div className="flex items-center justify-between p-4 glass rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Mobile App</p>
                  <p className="text-gray-400 text-sm">iPhone • Last active 2 hours ago</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="glass-button bg-transparent text-red-400 border-red-400/30 hover:bg-red-500/10"
              >
                Revoke
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full glass-button bg-transparent text-red-400 border-red-400/30 hover:bg-red-500/10"
          >
            Revoke All Other Sessions
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="glass-card border-red-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Trash2 className="w-5 h-5 mr-2 text-red-400" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="text-red-300 font-semibold mb-2">Delete Account</h4>
            <p className="text-gray-300 text-sm mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              onClick={deleteAccount}
              disabled={loading}
              variant="outline"
              className="bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
            >
              {loading ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
