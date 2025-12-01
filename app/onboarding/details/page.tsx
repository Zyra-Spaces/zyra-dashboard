"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { AuthButton } from "@/components/auth/auth-layout";
import { Select } from "@/components/ui/select";
import { InlineNotification, notify } from "@/components/ui/inline-notification";
import { saveUserProfile } from "@/lib/supabase/profile";

export default function OnboardingDetailsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    dateOfBirth: "",
    gender: "",
    bio: "",
    occupation: "",
    referralSource: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.username) {
      notify.error("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    try {
      // Save to Supabase database
      await saveUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bio: formData.bio,
        occupation: formData.occupation,
        referralSource: formData.referralSource,
      });
      
      notify.success("Details saved!");
      setTimeout(() => {
        router.push("/onboarding/profile-pictures");
      }, 500);
    } catch (error: any) {
      console.error("Error saving details:", error);
      notify.error(error.message || "Failed to save details");
      setIsLoading(false);
    }
  };

  const occupationOptions = [
    { value: "", label: "Select your role" },
    { value: "designer", label: "Designer" },
    { value: "developer", label: "Developer" },
    { value: "product-manager", label: "Product Manager" },
    { value: "marketing", label: "Marketing" },
    { value: "founder", label: "Founder / CEO" },
    { value: "freelancer", label: "Freelancer" },
    { value: "student", label: "Student" },
    { value: "other", label: "Other" },
  ];

  const referralOptions = [
    { value: "", label: "Select an option" },
    { value: "google", label: "Google Search" },
    { value: "social-media", label: "Social Media" },
    { value: "friend", label: "Friend / Colleague" },
    { value: "blog", label: "Blog / Article" },
    { value: "youtube", label: "YouTube" },
    { value: "podcast", label: "Podcast" },
    { value: "other", label: "Other" },
  ];

  return (
    <OnboardingGuard>
      <OnboardingLayout currentStep={1}>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-h-[calc(100vh-120px)] overflow-hidden">
          {/* Notification */}
          <InlineNotification className="mb-4" />

          {/* Header - Compact */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">Tell us About You</h1>
              <p className="text-xs text-gray-500">Help us personalize your experience</p>
            </div>
          </div>

          {/* Form - Compact Grid Layout */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Row 1: Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name*</label>
                <input
                  type="text"
                  placeholder="John"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name*</label>
                <input
                  type="text"
                  placeholder="Doe"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
                />
              </div>
            </div>

            {/* Row 2: Username */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username*</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input
                  type="text"
                  placeholder="johndoe"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
                />
              </div>
            </div>

            {/* Row 3: DOB & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 text-sm"
                />
              </div>
              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                placeholder="Select"
                options={[
                  { value: "", label: "Select" },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                  { value: "prefer-not-to-say", label: "Prefer not to say" },
                ]}
              />
            </div>

            {/* Row 4: Occupation & Referral */}
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="What do you do?"
                name="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData((prev) => ({ ...prev, occupation: e.target.value }))}
                placeholder="Select your role"
                options={occupationOptions}
              />
              <Select
                label="How did you hear about us?"
                name="referralSource"
                value={formData.referralSource}
                onChange={(e) => setFormData((prev) => ({ ...prev, referralSource: e.target.value }))}
                placeholder="Select"
                options={referralOptions}
              />
            </div>

            {/* Row 5: Bio */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                placeholder="Tell us a bit about yourself..."
                rows={2}
                maxLength={160}
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 placeholder-gray-400 text-sm resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{formData.bio.length}/160</p>
            </div>

            {/* Submit */}
            <AuthButton type="submit" isLoading={isLoading}>
              Continue
            </AuthButton>
          </form>

          {/* Back Link */}
          <div className="mt-3 text-center">
            <Link
              href="/login"
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to log in
            </Link>
          </div>
        </div>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}
