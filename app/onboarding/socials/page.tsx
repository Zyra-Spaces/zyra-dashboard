"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { AuthButton } from "@/components/auth/auth-layout";
import { saveUserProfile } from "@/lib/supabase/profile";
import { markOnboardingComplete } from "@/lib/onboarding";
import { toast } from "react-toastify";

export default function OnboardingSocialsPage() {
  const router = useRouter();
  const [socials, setSocials] = useState({
    twitter: "",
    linkedin: "",
    instagram: "",
    facebook: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Save to localStorage
      localStorage.setItem("onboarding_socials", JSON.stringify(socials));
      
      // Save to Supabase
      await saveUserProfile({
        socials: socials,
      });
      
      toast.success("Social accounts saved!");
      
      // Redirect to create idea step
      setTimeout(() => {
        router.push("/onboarding/create-idea");
      }, 500);
    } catch (error: any) {
      console.error("Error saving socials:", error);
      toast.error(error.message || "Failed to save social accounts");
      setIsLoading(false);
    }
  };

  const updateSocial = (platform: string, value: string) => {
    setSocials((prev) => ({ ...prev, [platform]: value }));
  };

  return (
    <OnboardingGuard>
      <OnboardingLayout currentStep={4}>
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        {/* Icon */}
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-medium text-gray-900 text-center mb-2">
          Add Your Socials
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Connect your social media accounts (optional)
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Twitter
            </label>
            <input
              type="text"
              placeholder="@username"
              value={socials.twitter}
              onChange={(e) => updateSocial("twitter", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              LinkedIn
            </label>
            <input
              type="text"
              placeholder="linkedin.com/in/username"
              value={socials.linkedin}
              onChange={(e) => updateSocial("linkedin", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Instagram
            </label>
            <input
              type="text"
              placeholder="@username"
              value={socials.instagram}
              onChange={(e) => updateSocial("instagram", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Facebook
            </label>
            <input
              type="text"
              placeholder="facebook.com/username"
              value={socials.facebook}
              onChange={(e) => updateSocial("facebook", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 text-xs"
            />
          </div>

          <div className="pt-4">
            <AuthButton type="submit" isLoading={isLoading}>
              Complete Setup
            </AuthButton>
          </div>
        </form>

        {/* Skip Option */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              markOnboardingComplete();
              toast.success("Socials skipped. You can add them later!");
            }}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
        </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-all ${
                  step === 4
                    ? "bg-[#4780C6] w-6"
                    : step < 4
                    ? "bg-[#4780C6]"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
      </div>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}

