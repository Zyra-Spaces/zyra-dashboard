"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { AuthInput, AuthButton } from "@/components/auth/auth-layout";
import { saveUserProfile } from "@/lib/supabase/profile";
import { toast } from "react-toastify";

export default function OnboardingTeamPage() {
  const router = useRouter();
  const [emails, setEmails] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);

  const addEmailField = () => {
    setEmails([...emails, ""]);
  };

  const removeEmailField = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Filter out empty emails and validate
    const validEmails = emails
      .map(email => email.trim())
      .filter(email => email !== "");
    
    // Validate email format
    const invalidEmails = validEmails.filter(email => !validateEmail(email));
    if (invalidEmails.length > 0) {
      toast.error(`Please enter valid email addresses: ${invalidEmails.join(", ")}`);
      setIsLoading(false);
      return;
    }
    
    try {
      // Save to localStorage
      if (validEmails.length > 0) {
        localStorage.setItem("onboarding_team", JSON.stringify(validEmails));
        
        // Send actual invitation emails via API
        const response = await fetch("/api/invite-team", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ emails: validEmails }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || "Failed to send invitations");
        }
        
        // Save to Supabase metadata as well
        await saveUserProfile({
          teamEmails: validEmails,
        });
        
        // Show results
        const successCount = result.results?.filter((r: any) => r.success).length || 0;
        const failedResults = result.results?.filter((r: any) => !r.success) || [];
        
        if (successCount > 0) {
          toast.success(`${successCount} invitation${successCount > 1 ? 's' : ''} sent successfully!`);
        }
        
        if (failedResults.length > 0) {
          failedResults.forEach((r: any) => {
            toast.error(`Failed to invite ${r.email}: ${r.error}`);
          });
        }
      } else {
        // Remove from localStorage if no emails
        localStorage.removeItem("onboarding_team");
        
        // Clear team emails in Supabase
        await saveUserProfile({
          teamEmails: [],
        });
      }
      
      setTimeout(() => {
        router.push("/onboarding/socials");
      }, 500);
    } catch (error: any) {
      console.error("Error saving team:", error);
      toast.error(error.message || "Failed to send invitations");
      setIsLoading(false);
    }
  };

  return (
    <OnboardingGuard>
      <OnboardingLayout currentStep={3}>
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-medium text-gray-900 text-center mb-2">
          Invite Your Team
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Add team members to start collaborating (optional)
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <AuthInput
                label={index === 0 ? "Email Address" : ""}
                name={`email-${index}`}
                type="email"
                placeholder="team@example.com"
                value={email}
                onChange={(e) => updateEmail(index, e.target.value)}
                className={index === 0 ? "" : "mt-6"}
              />
              {emails.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEmailField(index)}
                  className="mt-6 px-3 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addEmailField}
            className="text-sm text-[#4780C6] hover:underline transition-colors cursor-pointer"
          >
            + Add another email
          </button>

          <div className="pt-4">
            <AuthButton 
              type="submit" 
              isLoading={isLoading}
              disabled={isLoading}
            >
              Continue
            </AuthButton>
          </div>
        </form>

        {/* Skip Option */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => router.push("/onboarding/socials")}
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
                  step === 3
                    ? "bg-[#4780C6] w-6"
                    : step < 3
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

