"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Onboarding password step. Not in the main onboarding flow; redirect to details.
 * Kept as a valid route to satisfy Next.js (empty files cause "is not a module" build errors).
 */
export default function OnboardingPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/details");
  }, [router]);

  return null;
}
