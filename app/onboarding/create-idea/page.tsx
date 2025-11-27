"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { AuthInput, AuthButton } from "@/components/auth/auth-layout";
import { markOnboardingComplete } from "@/lib/onboarding";
import { toast } from "react-toastify";

export default function OnboardingCreateIdeaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.title.trim()) {
      toast.error("Please enter a project title");
      setIsLoading(false);
      return;
    }

    try {
      // Save to localStorage
      localStorage.setItem("onboarding_first_idea", JSON.stringify(formData));
      
      // Mark onboarding as complete
      markOnboardingComplete();
      
      toast.success("First project created! Welcome to Zyra Spaces!");
      
      // Don't auto-redirect - let user stay on page or navigate manually
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(error.message || "Failed to create project");
      setIsLoading(false);
    }
  };

  return (
    <OnboardingGuard>
      <OnboardingLayout currentStep={5}>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          {/* Icon */}
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lightbulb className="w-8 h-8 text-gray-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-medium text-gray-900 text-center mb-2">
            Create Your First Idea
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8">
            Start your first project and bring your ideas to life
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <AuthInput
              label="Project Title*"
              name="title"
              type="text"
              placeholder="Enter your project title"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
            />

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                placeholder="Describe your project..."
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 text-xs resize-none"
              />
            </div>

            <div className="pt-4">
              <AuthButton type="submit" isLoading={isLoading}>
                Create Project
              </AuthButton>
            </div>
          </form>

          {/* Skip Option */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                markOnboardingComplete();
                toast.success("Onboarding skipped. You can complete it later!");
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
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
                  step === 5
                    ? "bg-[#4780C6] w-6"
                    : step < 5
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

