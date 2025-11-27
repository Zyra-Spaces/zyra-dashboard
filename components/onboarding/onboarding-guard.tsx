"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { isOnboardingComplete } from "@/lib/onboarding";

interface OnboardingGuardProps {
  children: React.ReactNode;
  requiredStep?: number;
}

export function OnboardingGuard({ children, requiredStep }: OnboardingGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // No redirects - users can access onboarding even if completed

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4780C6]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}

