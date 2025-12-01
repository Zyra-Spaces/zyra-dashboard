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
    // Fallback to localStorage for migration
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('onboarding_complete');
      if (completed === 'true') return true;
      const details = localStorage.getItem('onboarding_details');
      return !!details;
    }
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
    // Fallback to localStorage for migration
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_complete', 'true');
    }
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
    // Fallback to localStorage for migration
    if (typeof window === 'undefined') return null;
    
    try {
      const details = localStorage.getItem('onboarding_details');
      const profilePic = localStorage.getItem('onboarding_profile_pic');
      const bannerPic = localStorage.getItem('onboarding_banner_pic');
      const team = localStorage.getItem('onboarding_team');
      const socials = localStorage.getItem('onboarding_socials');
      const firstIdea = localStorage.getItem('onboarding_first_idea');

      const profile: UserProfile = {};

      if (details) {
        const detailsData = JSON.parse(details);
        profile.firstName = detailsData.firstName;
        profile.lastName = detailsData.lastName;
        profile.username = detailsData.username;
        profile.dateOfBirth = detailsData.dateOfBirth;
        profile.gender = detailsData.gender;
        profile.bio = detailsData.bio;
        profile.occupation = detailsData.occupation;
        profile.referralSource = detailsData.referralSource;
      }

      if (profilePic) profile.profilePic = profilePic;
      if (bannerPic) profile.bannerPic = bannerPic;
      if (team) profile.teamEmails = JSON.parse(team);
      if (socials) profile.socials = JSON.parse(socials);
      if (firstIdea) profile.firstIdea = JSON.parse(firstIdea);

      return Object.keys(profile).length > 0 ? profile : null;
    } catch (parseError) {
      console.error('Error parsing user profile from localStorage:', parseError);
      return null;
    }
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

  // Also clear localStorage for migration
  if (typeof window !== 'undefined') {
    localStorage.removeItem('onboarding_complete');
    localStorage.removeItem('onboarding_details');
    localStorage.removeItem('onboarding_profile_pic');
    localStorage.removeItem('onboarding_banner_pic');
    localStorage.removeItem('onboarding_team');
    localStorage.removeItem('onboarding_socials');
    localStorage.removeItem('onboarding_first_idea');
  }
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
    // Fallback to localStorage
    if (typeof window === 'undefined') {
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

    const details = !!localStorage.getItem('onboarding_details');
    const profilePictures = !!(localStorage.getItem('onboarding_profile_pic') || localStorage.getItem('onboarding_banner_pic'));
    const team = !!localStorage.getItem('onboarding_team');
    const socials = !!localStorage.getItem('onboarding_socials');
    const firstIdea = !!localStorage.getItem('onboarding_first_idea');

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
  }
}
