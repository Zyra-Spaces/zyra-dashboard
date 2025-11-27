"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { AuthInput, AuthButton } from "@/components/auth/auth-layout";
import { Select } from "@/components/ui/select";
import { saveUserProfile } from "@/lib/supabase/profile";
import { toast } from "react-toastify";

export default function OnboardingDetailsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    username: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.username) {
      toast.error("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    try {
      // Save to localStorage
      localStorage.setItem("onboarding_details", JSON.stringify(formData));
      
      // Save to Supabase
      await saveUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        username: formData.username,
      });
      
      toast.success("Details saved!");
      setTimeout(() => {
        router.push("/onboarding/profile-pictures");
      }, 500);
    } catch (error: any) {
      console.error("Error saving details:", error);
      toast.error(error.message || "Failed to save details");
      setIsLoading(false);
    }
  };

  return (
    <OnboardingGuard>
      <OnboardingLayout currentStep={1}>
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        {/* Icon */}
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-gray-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-medium text-gray-900 text-center mb-2">
          Tell us About You
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Please provide your personal information to get started
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <AuthInput
              label="First Name*"
              name="firstName"
              type="text"
              placeholder="eg: John"
              required
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, firstName: e.target.value }))
              }
            />

            <AuthInput
              label="Last Name*"
              name="lastName"
              type="text"
              placeholder="eg: Doe"
              required
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AuthInput
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
              }
            />

            <Select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, gender: e.target.value }))
              }
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

          <AuthInput
            label="Username*"
            name="username"
            type="text"
            placeholder="Enter a unique username"
            required
            value={formData.username}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, username: e.target.value }))
            }
          />

          <AuthButton type="submit" isLoading={isLoading}>
            Continue
          </AuthButton>
        </form>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
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
            Back to log in
          </Link>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-all ${
                step === 1
                  ? "bg-[#4780C6] w-6"
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

