//"use client";
//
//import type React from "react";
//import { useState } from "react";
//import { useRouter, useSearchParams } from "next/navigation";
//import Link from "next/link";
//import { Button } from "@/components/ui/button";
//import { Input } from "@/components/ui/input";
//import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardHeader and CardTitle for better structure
//import { useAuth } from "@/lib/auth";
//import { toast } from "sonner";
//import { Eye, EyeOff, LogIn } from "lucide-react";
//
//export default function LoginPage() {
//  const [username, setUsername] = useState("");
//  const [password, setPassword] = useState("");
//  const [showPassword, setShowPassword] = useState(false);
//  const { login, isLoading } = useAuth();
//  const router = useRouter();
//  const searchParams = useSearchParams();
//  const redirect = searchParams.get("redirect") || "/dashboard";
//
//  const handleSubmit = async (e: React.FormEvent) => {
//    e.preventDefault();
//
//    // Basic client-side validation
//    if (!username.trim() || !password.trim()) {
//      toast.error("Invalid input", {
//        description: "Please enter both username and password.",
//      });
//      return;
//    }
//
//    try {
//      const success = await login(username, password);
//
//      if (success) {
//        toast.success("Welcome back!", {
//          description: "You have successfully logged in.",
//        });
//        router.push(redirect);
//      } else {
//        toast.error("Login failed", {
//          description: "Invalid username or password.",
//        });
//      }
//    } catch (error) {
//      toast.error("Login error", {
//        description: "An unexpected error occurred. Please try again later.",
//      });
//      console.error("Login error:", error);
//    }
//  };
//
//  return (
//    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
//      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
//        <CardHeader className="text-center">
//          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
//            <LogIn className="w-8 h-8 text-white" aria-hidden="true" />
//          </div>
//          <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
//          <p className="text-gray-400">Sign in to your Gamble Galaxy account</p>
//        </CardHeader>
//        <CardContent className="p-6">
//          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
//            <div>
//              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
//                Username
//              </label>
//              <Input
//                id="username"
//                type="text"
//                value={username}
//                onChange={(e) => setUsername(e.target.value)}
//                className="bg-gray-700 border-gray-600 text-white"
//                placeholder="Enter your username"
//                required
//                aria-required="true"
//                autoComplete="username"
//              />
//            </div>
//
//            <div>
//              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
//                Password
//              </label>
//              <div className="relative">
//                <Input
//                  id="password"
//                  type={showPassword ? "text" : "password"}
//                  value={password}
//                  onChange={(e) => setPassword(e.target.value)}
//                  className="bg-gray-700 border-gray-600 text-white pr-10"
//                  placeholder="Enter your password"
//                  required
//                  aria-required="true"
//                  autoComplete="current-password"
//                />
//                <button
//                  type="button"
//                  onClick={() => setShowPassword(!showPassword)}
//                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
//                  aria-label={showPassword ? "Hide password" : "Show password"}
//                >
//                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                </button>
//              </div>
//            </div>
//
//            <Button
//              type="submit"
//              disabled={isLoading}
//              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
//              aria-disabled={isLoading}
//            >
//              {isLoading ? "Signing in..." : "Sign In"}
//            </Button>
//          </form>
//
//          <div className="mt-6 text-center">
//            <p className="text-gray-400">
//              Don&apos;t have an account?{" "}
//              <Link
//                href="/auth/register"
//                className="text-purple-400 hover:text-purple-300"
//                aria-label="Sign up for a new account"
//              >
//                Sign up
//              </Link>
//            </p>
//          </div>
//        </CardContent>
//      </Card>
//    </div>
//  );
//}

"use client";

import type React from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error("Invalid input", {
        description: "Please enter both username and password.",
      });
      return;
    }

    try {
      const success = await login(username, password);

      if (success) {
        toast.success("Welcome back!", {
          description: "You have successfully logged in.",
        });
        router.push(redirect);
      } else {
        toast.error("Login failed", {
          description: "Invalid username or password.",
        });
      }
    } catch (error) {
      toast.error("Login error", {
        description: "An unexpected error occurred. Please try again later.",
      });
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-6 h-6 sm:w-8 sm:h-8 text-white" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-white">Welcome Back</CardTitle>
          <p className="text-sm sm:text-base text-gray-400">Sign in to your Gamble Galaxy account</p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your username"
                required
                aria-required="true"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500 pr-10"
                  placeholder="Enter your password"
                  required
                  aria-required="true"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-sm sm:text-base"
              aria-disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-purple-400 hover:text-purple-300"
                aria-label="Sign up for a new account"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}