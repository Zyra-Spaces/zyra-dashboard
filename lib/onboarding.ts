// Onboarding completion tracking and profile management
// Now uses Supabase database instead of localStorage

import { isOnboardingComplete as checkOnboardingComplete, markOnboardingComplete as markComplete, getUserProfileFromSupabase } from './supabase/profile';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  username?: string;
  bio?: string;
  occupation?: string;
  referralSource?: string;
  profilePic?: string;
  bannerPic?: string;
  teamEmails?: string[];
  socials?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
  firstIdea?: {
    title: string;
    description: string;
  };
}

/**
 * Check if onboarding is complete (from database)
 */
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    return await checkOnboardingComplete();
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Mark onboarding as complete (in database)
 */
export async function markOnboardingComplete() {
  try {
    await markComplete();
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
    // No localStorage fallback - database only
  }
}

/**
 * Get user profile (from database)
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const profile = await getUserProfileFromSupabase();
    return Object.keys(profile).length > 0 ? profile : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Clear onboarding data (from database and localStorage)
 */
export async function clearOnboardingData() {
  // Clear from database
  try {
    const { saveUserProfile } = await import('./supabase/profile');
    await saveUserProfile({
      firstName: undefined,
      lastName: undefined,
      username: undefined,
      dateOfBirth: undefined,
      gender: undefined,
      bio: undefined,
      occupation: undefined,
      referralSource: undefined,
      profilePic: undefined,
      bannerPic: undefined,
      teamEmails: undefined,
      socials: undefined,
      firstIdea: undefined,
    });
  } catch (error) {
    console.error('Error clearing onboarding data from database:', error);
  }
  // No localStorage - database only
}

export interface OnboardingProgress {
  details: boolean;
  profilePictures: boolean;
  team: boolean;
  socials: boolean;
  firstIdea: boolean;
  completedSteps: number;
  totalSteps: number;
}

/**
 * Get onboarding progress (from database)
 */
export async function getOnboardingProgress(): Promise<OnboardingProgress> {
  try {
    const profile = await getUserProfile();
    
    if (!profile) {
      return {
        details: false,
        profilePictures: false,
        team: false,
        socials: false,
        firstIdea: false,
        completedSteps: 0,
        totalSteps: 5,
      };
    }

    const details = !!(profile.firstName && profile.lastName && profile.username);
    const profilePictures = !!(profile.profilePic || profile.bannerPic);
    const team = !!(profile.teamEmails && profile.teamEmails.length > 0);
    const socials = !!(profile.socials && Object.values(profile.socials).some(v => v));
    const firstIdea = !!profile.firstIdea;

    const completedSteps = [details, profilePictures, team, socials, firstIdea].filter(Boolean).length;

    return {
      details,
      profilePictures,
      team,
      socials,
      firstIdea,
      completedSteps,
      totalSteps: 5,
    };
  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    // Return default progress if database check fails
    return {
      details: false,
      profilePictures: false,
      team: false,
      socials: false,
      firstIdea: false,
      completedSteps: 0,
      totalSteps: 5,
    };
  }
}
