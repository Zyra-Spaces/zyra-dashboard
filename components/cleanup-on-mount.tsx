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
      // Clean up metadata immediately on mount
      fetch("/api/cleanup-cookies", { method: "POST" }).catch(() => {
        // Silent fail
      });
    }
  }, [isAuthenticated]);

  return null;
}

