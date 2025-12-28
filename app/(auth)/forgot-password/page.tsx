"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { AuthLayout, AuthInput, AuthButton } from "@/components/auth/auth-layout";
import { InlineNotification, notify } from "@/components/ui/inline-notification";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { requestPasswordReset, isLoading, error, clearError, setEmail } = useAuth();
  const [email, setEmailValue] = useState("");

  // CRITICAL: Clear ALL Supabase cookies on page load to prevent 431 errors
  useEffect(() => {
    const clearAllCookies = () => {
      try {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (name.startsWith('sb-')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=;`;
          }
        });
        fetch("/api/clear-supabase-cookies", { method: "POST" }).catch(() => {});
      } catch (error) {
        // Silent fail
      }
    };
    clearAllCookies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await requestPasswordReset(email);
      setEmail(email);
      notify.success("Reset code sent to your email!");
      router.push("/verify-reset");
    } catch (err: any) {
      notify.error(err.message || "Failed to send reset code");
    }
  };

  return (
    <AuthLayout showArrow={false}>
      <div>
        <div className="w-16 h-16 bg-[#4780C6]/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-in">
          <svg className="w-8 h-8 text-[#4780C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>

        <h1 className="text-3xl font-medium text-gray-900 mb-2 text-center animate-fade-in animate-delay-100">
          Forgot password?
        </h1>
        
        <p className="text-gray-500 text-sm mb-8 text-center animate-fade-in animate-delay-200">
          No worries, we&apos;ll send you reset instructions
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InlineNotification className="mb-4" />
          <div className="animate-fade-in animate-delay-300">
            <AuthInput
              label="Email*"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmailValue(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs animate-fade-in">{error}</p>
          )}

          <div className="animate-fade-in animate-delay-400">
            <AuthButton type="submit" isLoading={isLoading}>
              Send reset code
            </AuthButton>
          </div>
        </form>

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 animate-fade-in animate-delay-500"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}

