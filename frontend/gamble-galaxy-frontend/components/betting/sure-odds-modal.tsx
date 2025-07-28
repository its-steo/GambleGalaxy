"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Lock,
  Unlock,
  DollarSign,
  Eye,
  EyeOff,
  Star,
  Trophy,
  Target,
  Zap,
  Crown,
  Sparkles,
  TrendingUp,
  Award,
  Shield,
  Flame,
  X,
  CheckCircle,
  AlertTriangle,
  Timer,
} from "lucide-react";
import type { SureOddSlip } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface SureOddsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SureOddsModal({ isOpen, onClose }: SureOddsModalProps) {
  const [sureOdds, setSureOdds] = useState<SureOddSlip | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour countdown

  // Countdown timer effect
  useEffect(() => {
    if (isOpen && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, timeLeft]);

  // Memoized loadSureOdds function
  const loadSureOdds = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getSureOdds();
      if (response.data) {
        setSureOdds(response.data);
      } else {
        toast.error("No sure odds available", {
          description: "Please check back later",
          className: "bg-red-500/90 text-white border-red-400",
        });
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }, [setLoading, setSureOdds, onClose]);

  // Load sure odds when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSureOdds();
    }
  }, [isOpen, loadSureOdds]);

  const handlePayment = async () => {
    setPaying(true);
    try {
      const response = await api.paySureOdds();
      if (response.data) {
        setShowPaymentSuccess(true);
        setTimeout(() => {
          setShowPaymentSuccess(false);
          loadSureOdds(); // Reload to show predictions
        }, 2000);
        toast.success("🎉 Payment successful!", {
          description: "Premium predictions unlocked!",
          className: "bg-green-500/90 text-white border-green-400",
        });
      } else {
        toast.error("Payment failed", {
          description: response.error || "Please try again",
          className: "bg-red-500/90 text-white border-red-400",
        });
      }
    } finally {
      setPaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getPredictionColor = (prediction: string) => {
    switch (prediction.toLowerCase()) {
      case "home win":
      case "1":
        return "from-green-500 to-emerald-500";
      case "draw":
      case "x":
        return "from-yellow-500 to-orange-500";
      case "away win":
      case "2":
        return "from-blue-500 to-cyan-500";
      default:
        return "from-purple-500 to-pink-500";
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/20 text-white max-w-2xl rounded-3xl overflow-hidden">
          <div className="relative p-12">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

            <div className="relative z-10 text-center">
              <div className="relative mb-8">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500 mx-auto"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-purple-400/50 mx-auto"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Loading Premium Predictions</h3>
              <p className="text-gray-400">Accessing our expert analysis...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!sureOdds) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/20 text-white w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl rounded-2xl sm:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto mx-4">
        {/* Enhanced Header */}
        <DialogHeader className="relative p-4 sm:p-6 lg:p-8 border-b border-white/10 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-orange-600/10 animate-pulse" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl">
                <Crown className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-1 sm:mb-2">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Premium Sure Odds
                  </span>
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    Code: {sureOdds.code}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs">
                    <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    95.2% Success Rate
                  </Badge>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 self-end sm:self-auto"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>

          {/* Countdown Timer */}
          {timeLeft > 0 && (
            <div className="mt-4 sm:mt-6 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                <span className="text-white font-semibold text-sm sm:text-base">Offer expires in:</span>
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-mono text-base sm:text-lg font-bold">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Enhanced Status Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-white/20 transition-all duration-300">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                    sureOdds.paid
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : "bg-gradient-to-r from-red-500 to-pink-500"
                  }`}
                >
                  {sureOdds.paid ? (
                    <Unlock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  ) : (
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-bold text-base sm:text-lg">Payment Status</h3>
                  <p className={`text-sm font-semibold ${sureOdds.paid ? "text-green-400" : "text-red-400"}`}>
                    {sureOdds.paid ? "✅ Premium Access Unlocked" : "🔒 Payment Required"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-white/20 transition-all duration-300">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                    sureOdds.show_predictions
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                      : "bg-gradient-to-r from-gray-500 to-gray-600"
                  }`}
                >
                  {sureOdds.show_predictions ? (
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  ) : (
                    <EyeOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-bold text-base sm:text-lg">Predictions</h3>
                  <p
                    className={`text-sm font-semibold ${sureOdds.show_predictions ? "text-blue-400" : "text-gray-400"}`}
                  >
                    {sureOdds.show_predictions ? "👁️ Visible & Ready" : "🙈 Hidden Until Payment"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Enhanced Matches Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-purple-400" />
                Premium Matches
              </h3>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 sm:px-4 py-2 rounded-full text-sm">
                {sureOdds.matches.length} Matches
              </Badge>
            </div>

            <div className="grid gap-4 sm:gap-6">
              {sureOdds.matches.map((match, index) => (
                <Card
                  key={index}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:scale-105 group"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm sm:text-base">#{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-base sm:text-lg">
                            {match.home_team} <span className="text-gray-400 mx-1 sm:mx-2">vs</span> {match.away_team}
                          </h4>
                          <div className="flex items-center text-gray-400 text-xs sm:text-sm mt-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            {new Date(match.match_time).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Match Stats */}
                      <div className="text-left sm:text-right">
                        <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                          <span className="text-green-400 font-bold text-sm">98.5% Confidence</span>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Target className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-bold text-sm">High Value</span>
                        </div>
                      </div>
                    </div>

                    {/* Prediction Section */}
                    {sureOdds.show_predictions && match.prediction ? (
                      <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-500/30">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-3 sm:space-x-4">
                            <div
                              className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${getPredictionColor(
                                match.prediction
                              )} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg`}
                            >
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div>
                              <h5 className="text-white font-bold text-base sm:text-lg">Expert Prediction</h5>
                              <p className="text-green-400 font-semibold text-sm sm:text-base">{match.prediction}</p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                              <Award className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                              <span className="text-yellow-400 font-bold text-sm">Premium Pick</span>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                              <span className="text-red-400 font-bold text-sm">Hot Tip</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10">
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="text-center sm:text-left">
                            <h5 className="text-gray-400 font-bold text-base sm:text-lg mb-1">
                              {sureOdds.paid ? "🔮 Prediction Coming Soon" : "🔒 Premium Prediction Locked"}
                            </h5>
                            <p className="text-gray-500 text-sm">
                              {sureOdds.paid
                                ? "Will be revealed 30 minutes before match"
                                : "Unlock with premium access"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Enhanced Payment Section */}
          {sureOdds.allow_payment && !sureOdds.paid && (
            <Card className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 backdrop-blur-sm border border-yellow-500/50 rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="p-6 sm:p-8 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-orange-600/10 animate-pulse" />

                <div className="relative z-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl">
                    <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>

                  <h4 className="text-2xl sm:text-3xl font-black text-white mb-3 sm:mb-4">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                      Unlock Premium Predictions
                    </span>
                  </h4>

                  <p className="text-gray-300 mb-4 sm:mb-6 text-base sm:text-lg max-w-2xl mx-auto">
                    Get access to our expert analysts&apos; guaranteed winning predictions with 95%+ accuracy rate
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {[
                      { icon: Award, label: "95.2% Success Rate", color: "from-green-500 to-emerald-500" },
                      { icon: Target, label: "Expert Analysis", color: "from-blue-500 to-cyan-500" },
                      { icon: Zap, label: "Instant Access", color: "from-purple-500 to-pink-500" },
                    ].map((feature, idx) => (
                      <div
                        key={idx}
                        className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20"
                      >
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${feature.color} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3`}
                        >
                          <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <p className="text-white font-semibold text-xs sm:text-sm">{feature.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="text-3xl sm:text-4xl font-black text-white mb-2">
                      <span className="line-through text-gray-500 text-xl sm:text-2xl mr-2 sm:mr-3">$15,000</span>
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        $10,000
                      </span>
                    </div>
                    <p className="text-yellow-400 font-semibold text-sm sm:text-base">
                      ⚡ Limited Time Offer - 33% OFF
                    </p>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={paying}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 sm:py-4 px-8 sm:px-12 rounded-xl sm:rounded-2xl text-base sm:text-xl transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-yellow-500/25 mt-4 sm:mt-6 w-full sm:w-auto"
                  >
                    {paying ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-white/30 border-t-white mr-2 sm:mr-3"></div>
                        <span className="text-sm sm:text-base">Processing Payment...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                        <span className="text-sm sm:text-base">Unlock Premium Access</span>
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3" />
                      </div>
                    )}
                  </Button>

                  <p className="text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">
                    🔒 Secure payment • 💰 Money-back guarantee • ⚡ Instant access
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Payment Success Animation */}
          {showPaymentSuccess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-12 text-center shadow-2xl">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Payment Successful!</h3>
                <p className="text-green-100">Premium predictions unlocked</p>
              </div>
            </div>
          )}

          {/* Dismiss Notice */}
          {sureOdds.dismiss && (
            <Card className="bg-gradient-to-r from-red-900/30 to-pink-900/30 backdrop-blur-sm border border-red-500/50 rounded-2xl">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-red-400 mb-2">Offer Expired</h4>
                <p className="text-red-300">This sure odds slip has expired as matches have started.</p>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}