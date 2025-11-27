// Onboarding completion tracking and profile management

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

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

export function isOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage
  const completed = localStorage.getItem(ONBOARDING_COMPLETE_KEY);
  if (completed === 'true') return true;
  
  // Check if all required steps are completed
  const details = localStorage.getItem('onboarding_details');
  
  // At minimum, details should be set (profile pictures, team, and socials are optional)
  return !!details;
}

export function markOnboardingComplete() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}

export function getUserProfile(): UserProfile | null {
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
  } catch (error) {
    console.error('Error parsing user profile:', error);
    return null;
  }
}

export function clearOnboardingData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  localStorage.removeItem('onboarding_details');
  localStorage.removeItem('onboarding_profile_pic');
  localStorage.removeItem('onboarding_banner_pic');
  localStorage.removeItem('onboarding_team');
  localStorage.removeItem('onboarding_socials');
  localStorage.removeItem('onboarding_first_idea');
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

export function getOnboardingProgress(): OnboardingProgress {
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
