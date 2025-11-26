"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AuthLayout, AuthInput, AuthButton, GoogleButton } from "@/components/auth/auth-layout";
import { toast } from "react-toastify";

const passwordRequirements = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, isLoading, error, clearError, setEmail } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const allRequirementsMet = passwordRequirements.every(req => req.test(formData.password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!allRequirementsMet) {
      toast.error("Please meet all password requirements");
      return;
    }

    try {
      await signUp(formData.email, formData.password);
      setEmail(formData.email);
      toast.success("Verification code sent to your email!");
      router.push("/verify-email");
    } catch (err: any) {
      toast.error(err.message || "Sign up failed");
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      toast.error(err.message || "Google sign-up failed");
    }
  };

  return (
    <AuthLayout heroImageSrc="/images/banner-2.png">
      <h1 className="text-4xl font-light text-gray-900 mb-8 animate-fade-in animate-delay-100">
        Sign up
      </h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
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
              placeholder="Create a password"
              required
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
        {formData.password && (
          <div className="space-y-1 animate-fade-in">
            {passwordRequirements.map((req) => (
              <div key={req.id} className="flex items-center gap-2 text-xs">
                {req.test(formData.password) ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <X className="w-3 h-3 text-gray-300" />
                )}
                <span className={req.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-red-500 text-xs animate-fade-in">{error}</p>
        )}

        <div className="animate-fade-in animate-delay-400">
          <AuthButton type="submit" isLoading={isLoading} disabled={!allRequirementsMet}>
            Get started
          </AuthButton>
        </div>
      </form>

      <div className="animate-fade-in animate-delay-500 mt-4">
        <GoogleButton onClick={handleGoogleSignUp} text="Sign up with Google" />
      </div>

      <p className="animate-fade-in animate-delay-600 text-center mt-6 text-gray-600 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-[#4780C6] hover:underline font-medium">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
