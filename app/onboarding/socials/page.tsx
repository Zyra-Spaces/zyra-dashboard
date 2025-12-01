"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Twitter, Linkedin, Instagram, Facebook } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { AuthButton } from "@/components/auth/auth-layout";
import { InlineNotification, notify } from "@/components/ui/inline-notification";
import { saveUserProfile } from "@/lib/supabase/profile";

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
      const hasAnySocial = Object.values(socials).some(v => v.trim());
      
      if (hasAnySocial) {
        // Save socials to database
        await saveUserProfile({
          socials: socials,
        });
        notify.success("Social accounts saved!");
      }
      
      setTimeout(() => {
        router.push("/onboarding/create-idea");
      }, 500);
    } catch (error: any) {
      console.error("Error saving socials:", error);
      notify.error("Failed to save social accounts");
      setIsLoading(false);
    }
  };

  const socialInputs = [
    { key: "twitter", icon: Twitter, placeholder: "@username", color: "text-[#1DA1F2]" },
    { key: "linkedin", icon: Linkedin, placeholder: "linkedin.com/in/username", color: "text-[#0A66C2]" },
    { key: "instagram", icon: Instagram, placeholder: "@username", color: "text-[#E4405F]" },
    { key: "facebook", icon: Facebook, placeholder: "facebook.com/username", color: "text-[#1877F2]" },
  ];

  return (
    <OnboardingGuard>
      <OnboardingLayout currentStep={4}>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-h-[calc(100vh-120px)] overflow-hidden">
          {/* Notification */}
          <InlineNotification className="mb-4" />

          {/* Header - Compact */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">Add Your Socials</h1>
              <p className="text-xs text-gray-500">Connect your social media accounts (optional)</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {socialInputs.map(({ key, icon: Icon, placeholder, color }) => (
              <div key={key} className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={socials[key as keyof typeof socials]}
                  onChange={(e) => setSocials((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
                />
              </div>
            ))}

            {/* Submit */}
            <div className="pt-2">
              <AuthButton type="submit" isLoading={isLoading}>
                Continue
              </AuthButton>
            </div>
          </form>

          {/* Navigation */}
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <button
              type="button"
              onClick={() => router.push("/onboarding/create-idea")}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </div>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}
