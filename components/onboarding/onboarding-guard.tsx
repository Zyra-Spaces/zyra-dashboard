"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { isOnboardingComplete } from "@/lib/onboarding";
import { Loading } from "@/components/ui/loading";

interface OnboardingGuardProps {
  children: React.ReactNode;
  requiredStep?: number;
}

export function OnboardingGuard({ children, requiredStep }: OnboardingGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // No redirects - users can access onboarding even if completed

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}

