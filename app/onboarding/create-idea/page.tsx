"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Rocket } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { AuthButton } from "@/components/auth/auth-layout";
import { InlineNotification, notify } from "@/components/ui/inline-notification";
import { markOnboardingComplete } from "@/lib/onboarding";

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
      notify.error("Please enter a project title");
      setIsLoading(false);
      return;
    }

    try {
      localStorage.setItem("onboarding_first_idea", JSON.stringify(formData));
      markOnboardingComplete();
      
      notify.success("Welcome to Zyra Spaces!");
      setIsLoading(false);
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error("Error creating project:", error);
      notify.error("Failed to create project");
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    markOnboardingComplete();
    notify.success("Welcome to Zyra Spaces!");
    setTimeout(() => {
      router.push("/dashboard");
    }, 500);
  };

  return (
    <OnboardingGuard>
      <OnboardingLayout currentStep={5}>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-h-[calc(100vh-120px)] overflow-hidden">
          {/* Notification */}
          <InlineNotification className="mb-4" />

          {/* Header - Compact */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">Create Your First Idea</h1>
              <p className="text-xs text-gray-500">Start your first project and bring your ideas to life</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Project Title*</label>
              <input
                type="text"
                placeholder="My Awesome Project"
                required
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="What's your project about?"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 placeholder-gray-400 text-sm resize-none"
              />
            </div>

            {/* Submit */}
            <AuthButton type="submit" isLoading={isLoading}>
              <Rocket className="w-4 h-4 mr-2" />
              Launch Project
            </AuthButton>
          </form>

          {/* Navigation */}
          <div className="mt-4 flex items-center justify-between">
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
              onClick={handleSkip}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              Skip & Go to Dashboard
            </button>
          </div>

          {/* Celebration Graphic */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">🎉 You're almost done! This is the final step.</p>
          </div>
        </div>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}
