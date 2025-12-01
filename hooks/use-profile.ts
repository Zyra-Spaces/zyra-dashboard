"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getUserProfileFromSupabase, saveUserProfile } from "@/lib/supabase/profile";
import { getUserProfile as getLocalProfile } from "@/lib/onboarding";
import type { UserProfile } from "@/lib/onboarding";

export function useProfile() {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Try to get from Supabase database first
        try {
          const supabaseProfile = await getUserProfileFromSupabase();
          // Even if profile is empty, set it (user might not have filled profile yet)
          setProfile(supabaseProfile || {});
          setIsLoading(false);
          return;
        } catch (supabaseError: any) {
          console.warn("Could not load from database, trying localStorage fallback:", supabaseError);
          // If it's an auth error, don't try localStorage - let ProtectedRoute handle it
          if (supabaseError?.message?.includes('not authenticated') || supabaseError?.message?.includes('Session expired')) {
            setIsLoading(false);
            return;
          }
        }

        // Fallback to localStorage for migration (one-time sync)
        try {
          const localProfile = await getLocalProfile();
          if (localProfile) {
            setProfile(localProfile);
            // Sync to database in background
            try {
              await saveUserProfile(localProfile);
            } catch (syncError) {
              console.warn("Could not sync localStorage to database:", syncError);
            }
          }
        } catch (localError) {
          console.warn("Could not load from localStorage:", localError);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, isAuthenticated]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setError(null);
      const updatedProfile = { ...profile, ...updates } as UserProfile;
      
      // Save to Supabase
      await saveUserProfile(updatedProfile);
      
      // Update local state
      setProfile(updatedProfile);
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      throw err;
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refresh: async () => {
      setIsLoading(true);
      try {
        const supabaseProfile = await getUserProfileFromSupabase();
        setProfile(supabaseProfile);
      } catch (err: any) {
        setError(err.message || "Failed to refresh profile");
      } finally {
        setIsLoading(false);
      }
    },
  };
}




