"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

/**
 * Component that runs cleanup on mount to reduce cookie size
 * Should be added to root layout or main app component
 */
export function CleanupOnMount() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // Clean up metadata immediately on mount - remove ALL profile data from cookies
      // Run cleanup multiple times to ensure it works
      const cleanup = async () => {
        try {
          await fetch("/api/cleanup-cookies", { method: "POST" });
          // Run again after short delay to ensure cleanup
          setTimeout(() => {
            fetch("/api/cleanup-cookies", { method: "POST" }).catch(() => {});
          }, 1000);
        } catch {
          // Silent fail
        }
      };
      cleanup();
    }
  }, [isAuthenticated]);

  return null;
}

