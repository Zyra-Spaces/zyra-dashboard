"use client";

import { useEffect } from "react";

/**
 * Component that clears Supabase cookies on mount to prevent 431 errors
 * Runs once per session to clear accumulated cookies
 */
export function ClearCookiesOnMount() {
  useEffect(() => {
    // Clear Supabase cookies on mount to prevent accumulation
    const clearCookies = async () => {
      try {
        // Check if we've already cleared cookies this session
        const cleared = sessionStorage.getItem("cookies_cleared");
        if (cleared) {
          return; // Already cleared this session
        }

        // Clear all Supabase cookies via API
        await fetch("/api/clear-supabase-cookies", { method: "POST" });
        
        // Mark as cleared for this session
        sessionStorage.setItem("cookies_cleared", "true");
      } catch (error) {
        // Silent fail - not critical
        console.warn("Could not clear cookies:", error);
      }
    };

    clearCookies();
  }, []);

  return null;
}

