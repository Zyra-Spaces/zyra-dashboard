"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AuthLayout, AuthButton } from "@/components/auth/auth-layout";
import { InlineNotification, notify } from "@/components/ui/inline-notification";

const passwordRequirements = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
];

export default function NewPasswordPage() {
  const router = useRouter();
  const { resetPassword, isLoading, error, clearError, step, user } = useAuth();
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if not in the right step
  useEffect(() => {
    if (!user && step !== 'creating_new_password') {
      router.push("/forgot-password");
    }
  }, [user, step, router]);

  const allRequirementsMet = passwordRequirements.every(req => req.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!allRequirementsMet) {
      notify.error("Please meet all password requirements");
      return;
    }

    if (!passwordsMatch) {
      notify.error("Passwords don't match");
      return;
    }

    try {
      await resetPassword(password);
      notify.success("Password reset successfully! Redirecting to login...");
    } catch (err: any) {
      notify.error(err.message || "Failed to reset password");
    }
  };

  return (
    <AuthLayout showArrow={false}>
      <div>
        <div className="w-16 h-16 bg-[#4780C6]/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-in">
          <svg className="w-8 h-8 text-[#4780C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-3xl font-medium text-gray-900 mb-2 text-center animate-fade-in animate-delay-100">
          Set new password
        </h1>
        
        <p className="text-gray-500 text-sm mb-8 text-center animate-fade-in animate-delay-200">
          Your new password must be different from previously used passwords
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InlineNotification className="mb-4" />
          <div className="animate-fade-in animate-delay-300">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              New Password*
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                required
                value={password}
                onChange={(e) => setPasswordValue(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 pr-12 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="space-y-2 animate-fade-in animate-delay-300">
            {passwordRequirements.map((req) => (
              <div key={req.id} className="flex items-center gap-2 text-xs">
                {req.test(password) ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-300" />
                )}
                <span className={req.test(password) ? 'text-green-600' : 'text-gray-500'}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          <div className="animate-fade-in animate-delay-400">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Confirm Password*
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 border ${confirmPassword && !passwordsMatch ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 pr-12 text-xs`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-red-500 text-xs mt-1">Passwords don&apos;t match</p>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-xs animate-fade-in">{error}</p>
          )}

          <div className="animate-fade-in animate-delay-500">
            <AuthButton 
              type="submit" 
              isLoading={isLoading}
              disabled={!allRequirementsMet || !passwordsMatch}
            >
              Reset password
            </AuthButton>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

