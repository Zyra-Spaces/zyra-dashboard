"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { AuthLayout, AuthInput, AuthButton, GoogleButton } from "@/components/auth/auth-layout";
import { InlineNotification, notify } from "@/components/ui/inline-notification";

export default function LoginPage() {
  const { signIn, signInWithGoogle, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await signIn(formData.email, formData.password);
      notify.success("Welcome back! Redirecting...");
    } catch (err: any) {
      notify.error(err.message || "Login failed");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      notify.error(err.message || "Google sign-in failed");
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-4xl font-medium text-gray-900 mb-8 animate-fade-in animate-delay-100">
        Log in
      </h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <InlineNotification className="mb-4" />
        <div className="animate-fade-in animate-delay-200">
          <AuthInput
            label="Email*"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <div className="animate-fade-in animate-delay-300">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Password*
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 pr-12 text-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end animate-fade-in animate-delay-300">
          <Link
            href="/forgot-password"
            className="text-xs text-[#4780C6] hover:underline transition-colors cursor-pointer"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <p className="text-red-500 text-xs animate-fade-in">{error}</p>
        )}

        <div className="animate-fade-in animate-delay-400">
          <AuthButton type="submit" isLoading={isLoading}>
            Sign in
          </AuthButton>
        </div>
      </form>

      <div className="animate-fade-in animate-delay-500 mt-4">
        <GoogleButton onClick={handleGoogleSignIn} text="Sign in with Google" />
      </div>

      <p className="animate-fade-in animate-delay-600 text-center mt-6 text-gray-600 text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#4780C6] hover:underline font-medium cursor-pointer">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
