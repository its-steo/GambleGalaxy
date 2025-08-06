"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Upload,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Camera,
  Clock,
  XCircle,
} from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface AccountVerificationProps {
  profile: any
  onUpdate: () => void
}

export default function AccountVerification({ profile, onUpdate }: AccountVerificationProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [verificationStep, setVerificationStep] = useState<"email" | "phone" | "kyc" | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || "")
  const [kycFiles, setKycFiles] = useState<{
    id_front?: File
    id_back?: File
    selfie?: File
    address_proof?: File
  }>({})

  const sendEmailVerification = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/profile/verify/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Verification Email Sent! 📧",
          description: "Check your email for the verification link",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Failed to Send Email",
          description: error.error || "Please try again later",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while sending verification email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendPhoneVerification = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/profile/verify/phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: phoneNumber }),
      })

      if (response.ok) {
        setVerificationStep("phone")
        toast({
          title: "Verification Code Sent! 📱",
          description: "Check your phone for the verification code",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Failed to Send Code",
          description: error.error || "Please try again later",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while sending verification code",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const verifyPhoneCode = async () => {
    if (!verificationCode) {
      toast({
        title: "Code Required",
        description: "Please enter the verification code",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/profile/verify/phone/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      })

      if (response.ok) {
        toast({
          title: "Phone Verified! 🎉",
          description: "Your phone number has been successfully verified",
        })
        setVerificationStep(null)
        setVerificationCode("")
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
        description: "An error occurred while verifying your phone",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKycFileChange = (type: string, file: File | null) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File must be less than 10MB",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please select an image or PDF file",
          variant: "destructive",
        })
        return
      }
    }

    setKycFiles((prev) => ({ ...prev, [type]: file || undefined }))
  }

  const submitKycDocuments = async () => {
    const requiredFiles = ["id_front", "id_back", "selfie"]
    const missingFiles = requiredFiles.filter((file) => !kycFiles[file as keyof typeof kycFiles])

    if (missingFiles.length > 0) {
      toast({
        title: "Missing Documents",
        description: "Please upload all required documents",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(kycFiles).forEach(([key, file]) => {
        if (file) formData.append(key, file)
      })

      const response = await fetch("/api/profile/verify/kyc", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "KYC Documents Submitted! 📄",
          description: "Your documents are being reviewed. This may take 1-3 business days.",
        })
        setVerificationStep(null)
        onUpdate()
      } else {
        const error = await response.json()
        toast({
          title: "Submission Failed",
          description: error.error || "Failed to submit documents",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while submitting your documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getVerificationStatus = (level: string) => {
    switch (level) {
      case "full":
        return {
          color: "bg-green-500/20 text-green-300 border-green-500/30",
          icon: CheckCircle,
          text: "Fully Verified",
        }
      case "basic":
        return {
          color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
          icon: AlertCircle,
          text: "Basic Verification",
        }
      default:
        return { color: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle, text: "Unverified" }
    }
  }

  const getKycStatus = (status: string) => {
    switch (status) {
      case "approved":
        return { color: "bg-green-500/20 text-green-300 border-green-500/30", icon: CheckCircle, text: "Approved" }
      case "pending":
        return { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", icon: Clock, text: "Under Review" }
      case "rejected":
        return { color: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle, text: "Rejected" }
      default:
        return { color: "bg-gray-500/20 text-gray-300 border-gray-500/30", icon: FileText, text: "Not Submitted" }
    }
  }

  const verificationStatus = getVerificationStatus(profile?.verification_level || "unverified")
  const kycStatus = getKycStatus(profile?.kyc_status || "not_submitted")

  return (
    <div className="space-y-6">
      {/* Verification Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-400" />
            Account Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 glass rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <verificationStatus.icon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Overall Verification Level</p>
                <p className="text-gray-400 text-sm">Your current account verification status</p>
              </div>
            </div>
            <Badge className={verificationStatus.color}>{verificationStatus.text}</Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Email Verification */}
            <div className="glass p-4 rounded-lg text-center">
              <Mail className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <p className="text-white font-semibold mb-2">Email Verification</p>
              {profile?.is_email_verified ? (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Verified
                </Badge>
              )}
            </div>

            {/* Phone Verification */}
            <div className="glass p-4 rounded-lg text-center">
              <Phone className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <p className="text-white font-semibold mb-2">Phone Verification</p>
              {profile?.is_phone_verified ? (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Verified
                </Badge>
              )}
            </div>

            {/* KYC Verification */}
            <div className="glass p-4 rounded-lg text-center">
              <CreditCard className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <p className="text-white font-semibold mb-2">KYC Verification</p>
              <Badge className={kycStatus.color}>
                <kycStatus.icon className="w-3 h-3 mr-1" />
                {kycStatus.text}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Verification */}
      {!profile?.is_email_verified && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-400" />
                Email Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400">
                Verify your email address to secure your account and receive important notifications.
              </p>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <p className="text-white font-semibold">{profile?.email}</p>
                  <p className="text-gray-400 text-sm">We'll send a verification link to this email</p>
                </div>
                <Button
                  onClick={sendEmailVerification}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  {loading ? "Sending..." : "Send Verification"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Phone Verification */}
      {!profile?.is_phone_verified && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Phone className="w-5 h-5 mr-2 text-green-400" />
                Phone Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {verificationStep !== "phone" ? (
                <>
                  <p className="text-gray-400">
                    Verify your phone number to enable SMS notifications and enhance account security.
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Label htmlFor="phone" className="text-white">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="glass-input text-white"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <Button
                      onClick={sendPhoneVerification}
                      disabled={loading || !phoneNumber}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 mt-6"
                    >
                      {loading ? "Sending..." : "Send Code"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-400">Enter the 6-digit verification code sent to {phoneNumber}</p>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Label htmlFor="code" className="text-white">
                        Verification Code
                      </Label>
                      <Input
                        id="code"
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="glass-input text-white text-center text-2xl tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <Button
                      onClick={verifyPhoneCode}
                      disabled={loading || verificationCode.length !== 6}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 mt-6"
                    >
                      {loading ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                  <Button
                    onClick={() => setVerificationStep(null)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    Change Phone Number
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* KYC Verification */}
      {profile?.kyc_status !== "approved" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-purple-400" />
                KYC Document Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-400">
                Complete your KYC verification to unlock higher withdrawal limits and premium features.
              </p>

              {profile?.kyc_status === "pending" && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div>
                      <h4 className="text-yellow-300 font-semibold">Documents Under Review</h4>
                      <p className="text-gray-300 text-sm">
                        Your KYC documents are being reviewed. This process typically takes 1-3 business days.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {profile?.kyc_status === "rejected" && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <div>
                      <h4 className="text-red-300 font-semibold">Documents Rejected</h4>
                      <p className="text-gray-300 text-sm">
                        Your KYC documents were rejected. Please upload new documents with better quality.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(profile?.kyc_status === "not_submitted" || profile?.kyc_status === "rejected") && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* ID Front */}
                  <div className="space-y-3">
                    <Label className="text-white">ID Card (Front)</Label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                      {kycFiles.id_front ? (
                        <div className="space-y-2">
                          <FileText className="w-8 h-8 text-green-400 mx-auto" />
                          <p className="text-white text-sm">{kycFiles.id_front.name}</p>
                          <Button
                            onClick={() => handleKycFileChange("id_front", null)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">Click to upload ID front</p>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleKycFileChange("id_front", e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* ID Back */}
                  <div className="space-y-3">
                    <Label className="text-white">ID Card (Back)</Label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                      {kycFiles.id_back ? (
                        <div className="space-y-2">
                          <FileText className="w-8 h-8 text-green-400 mx-auto" />
                          <p className="text-white text-sm">{kycFiles.id_back.name}</p>
                          <Button
                            onClick={() => handleKycFileChange("id_back", null)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">Click to upload ID back</p>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleKycFileChange("id_back", e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Selfie */}
                  <div className="space-y-3">
                    <Label className="text-white">Selfie with ID</Label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                      {kycFiles.selfie ? (
                        <div className="space-y-2">
                          <Camera className="w-8 h-8 text-green-400 mx-auto" />
                          <p className="text-white text-sm">{kycFiles.selfie.name}</p>
                          <Button
                            onClick={() => handleKycFileChange("selfie", null)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">Click to upload selfie</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleKycFileChange("selfie", e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Address Proof (Optional) */}
                  <div className="space-y-3">
                    <Label className="text-white">Address Proof (Optional)</Label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                      {kycFiles.address_proof ? (
                        <div className="space-y-2">
                          <FileText className="w-8 h-8 text-green-400 mx-auto" />
                          <p className="text-white text-sm">{kycFiles.address_proof.name}</p>
                          <Button
                            onClick={() => handleKycFileChange("address_proof", null)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">Utility bill or bank statement</p>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleKycFileChange("address_proof", e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(profile?.kyc_status === "not_submitted" || profile?.kyc_status === "rejected") && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={submitKycDocuments}
                    disabled={loading || !kycFiles.id_front || !kycFiles.id_back || !kycFiles.selfie}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Submit Documents</span>
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
