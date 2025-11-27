"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AuthLayout, AuthInput, AuthButton, GoogleButton } from "@/components/auth/auth-layout";
import { InlineNotification, notify } from "@/components/ui/inline-notification";

export default function RegisterPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await signUpWithEmail(email);
      notify.success("Verification code sent to your email!");
      router.push("/verify-email");
    } catch (err: any) {
      notify.error(err.message || "Sign up failed");
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      notify.error(err.message || "Google sign-up failed");
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-4xl font-medium text-gray-900 mb-8 animate-fade-in animate-delay-100">
        Sign up
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-red-500 text-xs animate-fade-in">{error}</p>
        )}

        <div className="animate-fade-in animate-delay-300">
          <AuthButton type="submit" isLoading={isLoading}>
            Get started
          </AuthButton>
        </div>
      </form>

      <div className="animate-fade-in animate-delay-400 mt-4">
        <GoogleButton onClick={handleGoogleSignUp} text="Sign up with Google" />
      </div>

      <p className="animate-fade-in animate-delay-500 text-center mt-6 text-gray-600 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-[#4780C6] hover:underline font-medium">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
