"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Gift, Copy, Share2, DollarSign, UserPlus } from "lucide-react"
import { useNotification } from "./notification-system"

interface ReferralData {
  referral_code: string
  total_referrals: number
  total_earnings: number
  pending_earnings: number
  referrals: Array<{
    username: string
    joined_date: string
    status: "active" | "pending"
    earnings: number
  }>
}

export default function ReferralSystem() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const { addNotification } = useNotification()

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    try {
      // Simulate referral data
      const mockData: ReferralData = {
        referral_code: "BET2024XYZ",
        total_referrals: 12,
        total_earnings: 15600,
        pending_earnings: 2400,
        referrals: [
          {
            username: "NewPlayer1",
            joined_date: "2024-01-15",
            status: "active",
            earnings: 1200,
          },
          {
            username: "BetFan22",
            joined_date: "2024-01-14",
            status: "active",
            earnings: 800,
          },
          {
            username: "LuckyUser",
            joined_date: "2024-01-13",
            status: "pending",
            earnings: 400,
          },
        ],
      }
      setReferralData(mockData)
    } catch (error) {
      console.error("Error fetching referral data:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = () => {
    if (referralData) {
      navigator.clipboard.writeText(referralData.referral_code)
      addNotification({
        type: "success",
        title: "Copied!",
        message: "Referral code copied to clipboard",
        duration: 3000,
      })
    }
  }

  const shareReferral = async () => {
    if (referralData && navigator.share) {
      try {
        await navigator.share({
          title: "Join the best betting platform!",
          text: `Use my referral code ${referralData.referral_code} and get bonus rewards!`,
          url: `https://yourapp.com/register?ref=${referralData.referral_code}`,
        })
      } catch (error) {
        copyReferralCode()
      }
    } else {
      copyReferralCode()
    }
  }

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-32"></div>
          <div className="h-32 bg-white/10 rounded-xl"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Referral Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-xl flex items-center">
            <Gift className="mr-2 text-purple-400" size={20} />
            Referral Program
          </h3>
          <div className="text-purple-400 text-sm">Earn 10% commission!</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white/10 rounded-xl text-center">
            <UserPlus className="mx-auto mb-2 text-blue-400" size={24} />
            <div className="text-2xl font-bold text-white">{referralData?.total_referrals}</div>
            <div className="text-white/60 text-sm">Total Referrals</div>
          </div>

          <div className="p-4 bg-white/10 rounded-xl text-center">
            <DollarSign className="mx-auto mb-2 text-green-400" size={24} />
            <div className="text-2xl font-bold text-white">KES {referralData?.total_earnings.toLocaleString()}</div>
            <div className="text-white/60 text-sm">Total Earned</div>
          </div>
        </div>

        {/* Referral Code */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="text-white/70 text-sm mb-2">Your Referral Code</div>
          <div className="flex items-center space-x-3">
            <div className="flex-1 p-3 bg-white/10 rounded-lg">
              <code className="text-white font-mono text-lg">{referralData?.referral_code}</code>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={copyReferralCode}
              className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              <Copy size={20} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={shareReferral}
              className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg text-white hover:from-green-600 hover:to-blue-600 transition-all"
            >
              <Share2 size={20} />
            </motion.button>
          </div>
        </div>

        {/* Pending Earnings */}
        {referralData && referralData.pending_earnings > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Pending Earnings</div>
                <div className="text-white/60 text-sm">Will be credited after 7 days</div>
              </div>
              <div className="text-yellow-400 font-bold text-lg">
                KES {referralData.pending_earnings.toLocaleString()}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Referral List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6"
      >
        <h4 className="text-white font-bold text-lg mb-4 flex items-center">
          <Users className="mr-2" size={18} />
          Your Referrals
        </h4>

        <div className="space-y-3">
          {referralData?.referrals.map((referral, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {referral.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-medium">{referral.username}</div>
                  <div className="text-white/60 text-xs">
                    Joined {new Date(referral.joined_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-green-400 font-bold">KES {referral.earnings.toLocaleString()}</div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    referral.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {referral.status}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {referralData?.referrals.length === 0 && (
          <div className="text-center py-8 text-white/60">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No referrals yet. Start sharing your code!</p>
          </div>
        )}
      </motion.div>

      {/* How it Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6"
      >
        <h4 className="text-white font-bold text-lg mb-4">How it Works</h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              1
            </div>
            <div>
              <div className="text-white font-medium">Share your code</div>
              <div className="text-white/60 text-sm">Send your referral code to friends</div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              2
            </div>
            <div>
              <div className="text-white font-medium">They sign up</div>
              <div className="text-white/60 text-sm">Friends register using your code</div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              3
            </div>
            <div>
              <div className="text-white font-medium">Earn commission</div>
              <div className="text-white/60 text-sm">Get 10% of their betting activity</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
