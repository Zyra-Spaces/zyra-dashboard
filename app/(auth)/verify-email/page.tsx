"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { AuthLayout, AuthButton, OTPInput } from "@/components/auth/auth-layout";
import { toast } from "react-toastify";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { 
    verifyEmail, 
    resendVerificationEmail, 
    isLoading, 
    error, 
    clearError, 
    email 
  } = useAuth();
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Redirect if no email in context
  useEffect(() => {
    if (!email) {
      router.push("/register");
    }
  }, [email, router]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    try {
      await verifyEmail(otp);
      toast.success("Email verified successfully!");
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      await resendVerificationEmail();
      toast.success("Verification code resent!");
      setCountdown(60);
      setCanResend(false);
      setOtp("");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code");
    }
  };

  return (
    <AuthLayout heroImageSrc="/images/banner-2.png" showArrow={false}>
      <div className="text-center">
        <div className="w-16 h-16 bg-[#4780C6]/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-in">
          <svg className="w-8 h-8 text-[#4780C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-3xl font-light text-gray-900 mb-2 animate-fade-in animate-delay-100">
          Check your email
        </h1>
        
        <p className="text-gray-500 text-sm mb-8 animate-fade-in animate-delay-200">
          We sent a verification code to<br />
          <span className="font-medium text-gray-700">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="animate-fade-in animate-delay-300">
            <OTPInput
              length={6}
              value={otp}
              onChange={setOtp}
              error={error || undefined}
            />
          </div>

          <div className="animate-fade-in animate-delay-400">
            <AuthButton type="submit" isLoading={isLoading} disabled={otp.length !== 6}>
              Verify email
            </AuthButton>
          </div>
        </form>

        <p className="mt-6 text-sm text-gray-500 animate-fade-in animate-delay-500">
          Didn&apos;t receive the code?{" "}
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-[#4780C6] hover:underline font-medium"
            >
              Resend
            </button>
          ) : (
            <span className="text-gray-400">
              Resend in {countdown}s
            </span>
          )}
        </p>

        <Link
          href="/register"
          className="mt-4 inline-block text-sm text-gray-500 hover:text-gray-700 animate-fade-in animate-delay-600"
        >
          ← Back to sign up
        </Link>
      </div>
    </AuthLayout>
  );
}
