"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PiggyBank, DollarSign, Plus, Minus, Sparkles } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { getAuthHeader } from "@/lib/auth";

export function DepositForm() {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const { refreshBalance, balance } = useWallet();
  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  // Polling for transaction status
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    if (checkoutRequestId) {
      pollingInterval = setInterval(async () => {
        try {
          const res = await fetch(
            `https://gamblegalaxy.onrender.com/api/wallet/transaction-status/${checkoutRequestId}/`,
            {
              method: "GET",
              headers: {
                ...getAuthHeader(),
              },
            }
          );
          const data = await res.json();
          console.log("Transaction status:", data);

          if (res.status === 200 && data.status !== "pending") {
            clearInterval(pollingInterval!);
            setCheckoutRequestId(null);
            await refreshBalance();

            if (data.status === "completed") {
              toast.success("Deposit Successful", {
                description: data.message || `Deposit of KES ${Number(amount).toLocaleString()} successful.`,
                className: "bg-green-500/90 text-white border-green-400",
                duration: 5000,
              });
            } else if (data.status === "failed") {
              toast.error("Deposit Failed", {
                description: data.message || "Deposit could not be processed. Please try again.",
                className: "bg-red-500/90 text-white border-red-400",
                duration: 5000,
              });
            }
          }
        } catch (error) {
          console.error("Error polling transaction status:", error);
        }
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [checkoutRequestId, amount, refreshBalance]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const depositAmount = Number(amount);

    // Validate amount
    if (!amount || isNaN(depositAmount) || depositAmount <= 0) {
      console.error("Invalid amount entered:", amount);
      toast.error("Invalid amount", {
        description: "Please enter a valid positive number for deposit.",
        className: "bg-red-500/90 text-white border-red-400",
      });
      return;
    }

    // Validate phone number (must start with 254 and be 12 digits)
    if (!phoneNumber || !phoneNumber.match(/^254\d{9}$/)) {
      console.error("Invalid phone number entered:", phoneNumber);
      toast.error("Invalid phone number", {
        description: "Please enter a valid phone number starting with '254' (e.g., 254712345678).",
        className: "bg-red-500/90 text-white border-red-400",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Initiating STK Push deposit:", { amount: depositAmount, phone_number: phoneNumber });
      const res = await fetch("https://gamblegalaxy.onrender.com/api/wallet/deposit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          amount: depositAmount,
          phone_number: phoneNumber,
        }),
      });

      console.log("Deposit response:", { status: res.status, statusText: res.statusText });
      const data = await res.json();
      console.log("Deposit response data:", data);

      if (res.status === 202) {
        // STK Push initiated
        toast.info("STK Push Initiated", {
          description: data.message || `Please check your phone (${phoneNumber}) and enter your MPESA PIN to complete the deposit.`,
          className: "bg-blue-500/90 text-white border-blue-400",
          duration: 10000,
        });
        setCheckoutRequestId(data.checkout_request_id);
        setAmount("");
        setPhoneNumber("");
      } else {
        console.error("Deposit failed:", data);
        toast.error("Deposit Failed", {
          description: data.error || data.detail || "Please try again later.",
          className: "bg-red-500/90 text-white border-red-400",
        });
      }
    } catch (error) {
      console.error("Deposit network error:", error);
      toast.error("Network Error", {
        description: "Could not connect to the server. Please check your internet connection.",
        className: "bg-red-500/90 text-white border-red-400",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const adjustAmount = (increment: boolean) => {
    const current = Number.parseFloat(amount) || 0;
    const newAmount = increment ? current + 100 : Math.max(0, current - 100);
    setAmount(newAmount.toString());
  };

  return (
    <form onSubmit={handleDeposit} className="space-y-4 sm:space-y-6 text-white">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
          <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold">Deposit Funds</h3>
      </div>

      {/* Quick Amount Buttons */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">
          Quick Amounts (KES)
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
          {quickAmounts.map((val) => (
            <Button
              key={val}
              type="button"
              variant="ghost"
              onClick={() => setAmount(val.toString())}
              className={`text-xs sm:text-sm py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-300 ${
                amount === val.toString()
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              {val.toLocaleString()}
            </Button>
          ))}
        </div>
      </div>

      {/* Amount Input with Controls */}
      <div>
        <label htmlFor="deposit-amount" className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">
          Enter Amount (KES)
        </label>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => adjustAmount(false)}
            className="bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl p-2 sm:p-2.5"
          >
            <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Input
            id="deposit-amount"
            type="number"
            placeholder="e.g., 1000"
            className="flex-1 bg-white/10 border-white/20 placeholder:text-gray-400 text-white text-center text-base sm:text-lg font-bold rounded-lg sm:rounded-xl h-10 sm:h-12 focus:border-purple-400 transition-all duration-300"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="100"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => adjustAmount(true)}
            className="bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl p-2 sm:p-2.5"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Phone Number Input */}
      <div>
        <label htmlFor="phone-number" className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">
          Phone Number (e.g., 254712345678)
        </label>
        <Input
          id="phone-number"
          type="text"
          placeholder="254XXXXXXXXX"
          className="w-full bg-white/10 border-white/20 placeholder:text-gray-400 text-white text-base sm:text-lg rounded-lg sm:rounded-xl h-10 sm:h-12 focus:border-purple-400 transition-all duration-300"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
            Processing...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Deposit Now
            <Sparkles className="w-4 h-4 ml-2" />
          </div>
        )}
      </Button>
    </form>
  );
}