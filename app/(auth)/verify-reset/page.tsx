"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { AuthLayout, AuthButton, OTPInput } from "@/components/auth/auth-layout";
import { InlineNotification, notify } from "@/components/ui/inline-notification";

export default function VerifyResetPage() {
  const router = useRouter();
  const { 
    verifyResetOTP, 
    requestPasswordReset,
    isLoading, 
    error, 
    clearError, 
    email,
    step 
  } = useAuth();
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Redirect if no email in context
  useEffect(() => {
    if (!email) {
      router.push("/forgot-password");
    }
  }, [email, router]);

  // Redirect when OTP is verified
  useEffect(() => {
    if (step === 'creating_new_password') {
      router.push("/new-password");
    }
  }, [step, router]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !isVerifying && !isLoading) {
      const timer = setTimeout(() => {
        handleVerify();
      }, 100); // Small delay to ensure state is updated
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    clearError();

    if (otp.length !== 6) {
      notify.error("Please enter a valid 6-digit code");
      return;
    }

    if (isVerifying || isLoading) return;

    setIsVerifying(true);
    try {
      await verifyResetOTP(otp);
      notify.success("Code verified! Redirecting...");
    } catch (err: any) {
      notify.error(err.message || "Verification failed");
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;

    try {
      await requestPasswordReset(email);
      notify.success("Reset code resent!");
      setCountdown(60);
      setCanResend(false);
      setOtp("");
    } catch (err: any) {
      notify.error(err.message || "Failed to resend code");
    }
  };

  return (
    <AuthLayout showArrow={false}>
      <div className="text-center">
        <div className="w-16 h-16 bg-[#4780C6]/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-in">
          <svg className="w-8 h-8 text-[#4780C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-3xl font-medium text-gray-900 mb-2 animate-fade-in animate-delay-100">
          Password reset
        </h1>
        
        <p className="text-gray-500 text-sm mb-8 animate-fade-in animate-delay-200">
          We sent a code to<br />
          <span className="font-medium text-gray-700">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <InlineNotification className="mb-4" />
          <div className="animate-fade-in animate-delay-300">
            <OTPInput
              length={6}
              value={otp}
              onChange={setOtp}
              error={error || undefined}
            />
          </div>

          <div className="animate-fade-in animate-delay-400">
            <AuthButton type="submit" isLoading={isLoading || isVerifying} disabled={otp.length !== 6}>
              Verify code
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
          href="/forgot-password"
          className="mt-4 inline-block text-sm text-gray-500 hover:text-gray-700 animate-fade-in animate-delay-600"
        >
          ← Back
        </Link>
      </div>
    </AuthLayout>
  );
}
