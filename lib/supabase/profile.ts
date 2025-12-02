import { createClient } from "./client";
import { requireAuth, checkAuth } from "./auth-guard";
import type { UserProfile } from "../onboarding";

/**
 * Save user profile to Supabase database
 * All profile data is now stored in the user_profiles table
 */
export async function saveUserProfile(profile: Partial<UserProfile>) {
  const { user, supabase } = await requireAuth();

  // Prepare update object for database
  const updateData: any = {};

  if (profile.firstName !== undefined) updateData.first_name = profile.firstName;
  if (profile.lastName !== undefined) updateData.last_name = profile.lastName;
  if (profile.username !== undefined) updateData.username = profile.username;
  // Convert empty string to null for date fields
  if (profile.dateOfBirth !== undefined) {
    updateData.date_of_birth = profile.dateOfBirth && profile.dateOfBirth.trim() !== '' 
      ? profile.dateOfBirth 
      : null;
  }
  if (profile.gender !== undefined) {
    updateData.gender = profile.gender && profile.gender.trim() !== '' ? profile.gender : null;
  }
  if (profile.bio !== undefined) updateData.bio = profile.bio || null;
  if (profile.occupation !== undefined) {
    updateData.occupation = profile.occupation && profile.occupation.trim() !== '' ? profile.occupation : null;
  }
  if (profile.referralSource !== undefined) {
    updateData.referral_source = profile.referralSource && profile.referralSource.trim() !== '' ? profile.referralSource : null;
  }
  if (profile.profilePic !== undefined) updateData.profile_pic_url = profile.profilePic || null;
  if (profile.bannerPic !== undefined) updateData.banner_pic_url = profile.bannerPic || null;
  if (profile.teamEmails !== undefined) updateData.team_emails = profile.teamEmails || [];
  if (profile.socials !== undefined) updateData.socials = profile.socials || {};
  if (profile.firstIdea !== undefined) updateData.first_idea = profile.firstIdea || null;

  // Upsert profile (insert or update)
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({
      id: user.id,
      ...updateData,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    })
    .select();

  if (error) {
    console.error("Error saving profile to database:", error);
    throw new Error(`Failed to save profile: ${error.message}`);
  }

  return { success: true };
}

/**
 * Get user profile from Supabase database
 * Database only - no localStorage fallback
 */
export async function getUserProfileFromSupabase(): Promise<UserProfile> {
  // Use checkAuth instead of requireAuth to avoid throwing if not authenticated
  // The ProtectedRoute will handle redirecting unauthenticated users
  const auth = await checkAuth();
  
  if (!auth) {
    // Return empty profile if not authenticated (ProtectedRoute will redirect)
    return {};
  }

  const { user, supabase } = auth;

  // Try to get from database first
  try {
    const { data: profileData, error } = await supabase
      .from("user_profiles")
      .select(`
        first_name,
        last_name,
        username,
        date_of_birth,
        gender,
        bio,
        occupation,
        referral_source,
        profile_pic_url,
        banner_pic_url,
        team_emails,
        socials,
        first_idea,
        onboarding_completed
      `)
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      // If error is "permission denied" or "not found", try to create profile
      if (error.code === 'PGRST116' || error.message?.includes('permission denied')) {
        console.warn("Profile access denied or not found, attempting to create:", error);
        // Try to create an empty profile record
        try {
          const { error: insertError } = await supabase
            .from("user_profiles")
            .insert({ id: user.id })
            .select()
            .single();
          
          if (!insertError) {
            // Profile created, return empty profile
            return {};
          }
        } catch (createError) {
          console.warn("Could not create profile:", createError);
        }
      }
      console.warn("Error loading profile from database:", error);
    } else if (profileData) {
      // Map database fields to UserProfile interface
      const profile: UserProfile = {
        firstName: profileData.first_name,
        lastName: profileData.last_name,
        username: profileData.username,
        dateOfBirth: profileData.date_of_birth,
        gender: profileData.gender,
        bio: profileData.bio,
        occupation: profileData.occupation,
        referralSource: profileData.referral_source,
        profilePic: profileData.profile_pic_url,
        bannerPic: profileData.banner_pic_url,
        teamEmails: profileData.team_emails as string[],
        socials: profileData.socials as UserProfile['socials'],
        firstIdea: profileData.first_idea as UserProfile['firstIdea'],
      };

      return profile;
    }
  } catch (error) {
    console.warn("Could not load profile from database:", error);
  }

  // Return empty profile if database load fails - no localStorage fallback
  return {};
}

/**
 * Mark onboarding as complete in database
 */
export async function markOnboardingComplete() {
  const { user, supabase } = await requireAuth();

  const { error } = await supabase
    .from("user_profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  if (error) {
    console.error("Error marking onboarding complete:", error);
    throw new Error(`Failed to mark onboarding complete: ${error.message}`);
  }

  return { success: true };
}

/**
 * Check if onboarding is complete
 */
export async function isOnboardingComplete(): Promise<boolean> {
  const auth = await checkAuth();
  if (!auth) {
    return false;
  }
  
  const { supabase, user } = auth;

  try {
    const { data: profileData, error } = await supabase
      .from("user_profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && profileData) {
      return profileData.onboarding_completed === true;
    }
  } catch (error) {
    console.warn("Could not check onboarding status:", error);
  }

  // No localStorage fallback - database only
  return false;
}




