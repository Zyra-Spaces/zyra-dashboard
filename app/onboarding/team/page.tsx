"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, X } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { AuthButton } from "@/components/auth/auth-layout";
import { InlineNotification, notify } from "@/components/ui/inline-notification";
import { saveUserProfile } from "@/lib/supabase/profile";

export default function OnboardingTeamPage() {
  const router = useRouter();
  const [emails, setEmails] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addEmailField = () => {
    if (emails.length < 5) {
      setEmails([...emails, ""]);
    }
  };

  const removeEmailField = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const validEmails = emails.map(email => email.trim()).filter(email => email !== "");
    
    // Validate email format
    const invalidEmails = validEmails.filter(email => !validateEmail(email));
    if (invalidEmails.length > 0) {
      notify.error("Please enter valid email addresses");
      setIsLoading(false);
      return;
    }
    
    try {
      if (validEmails.length > 0) {
        // Save team emails to database
        await saveUserProfile({
          teamEmails: validEmails,
        });
        
        // Send invitations via API
        try {
          const response = await fetch("/api/invite-team", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emails: validEmails }),
          });
          
          if (response.ok) {
            notify.success(`${validEmails.length} invitation${validEmails.length > 1 ? 's' : ''} sent!`);
          }
        } catch (inviteError) {
          console.warn("Could not send invitations:", inviteError);
        }
      }
      
      setTimeout(() => {
        router.push("/onboarding/socials");
      }, 500);
    } catch (error: any) {
      console.error("Error saving team:", error);
      notify.error("Failed to save invitations");
      setIsLoading(false);
    }
  };

  return (
    <OnboardingGuard>
      <OnboardingLayout currentStep={3}>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-h-[calc(100vh-120px)] overflow-hidden">
          {/* Notification */}
          <InlineNotification className="mb-4" />

          {/* Header - Compact */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">Invite Your Team</h1>
              <p className="text-xs text-gray-500">Add team members to collaborate (optional)</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="email"
                    placeholder="team@example.com"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
                  />
                  {emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmailField(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {emails.length < 5 && (
              <button
                type="button"
                onClick={addEmailField}
                className="flex items-center gap-1 text-xs text-[#4780C6] hover:text-[#3a6db0] transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add another
              </button>
            )}

            {/* Info */}
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-600">
              Team members will receive an email invitation to join Zyra Spaces.
            </div>

            {/* Submit */}
            <AuthButton type="submit" isLoading={isLoading}>
              Continue
            </AuthButton>
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
              onClick={() => router.push("/onboarding/socials")}
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
