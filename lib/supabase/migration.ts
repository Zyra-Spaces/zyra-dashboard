/**
 * Migration utility to move localStorage data to Supabase database
 * This should be run once per user to migrate their existing data
 */

import { createClient } from './client';
import { saveUserProfile, markOnboardingComplete } from './profile';
import { saveProject } from './projects';
import type { UserProfile } from '../onboarding';

/**
 * Migrate all localStorage data to Supabase database
 * This is a one-time migration that should be called when a user logs in
 */
export async function migrateLocalStorageToDatabase(): Promise<{
  success: boolean;
  migrated: {
    profile: boolean;
    projects: boolean;
  };
  errors: string[];
}> {
  const result = {
    success: true,
    migrated: {
      profile: false,
      projects: false,
    },
    errors: [] as string[],
  };

  if (typeof window === 'undefined') {
    return result;
  }

  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      result.errors.push('User not authenticated');
      return result;
    }

    // Migrate profile data
    try {
      const profile: Partial<UserProfile> = {};

      // Get details
      const details = localStorage.getItem('onboarding_details');
      if (details) {
        try {
          const detailsData = JSON.parse(details);
          profile.firstName = detailsData.firstName;
          profile.lastName = detailsData.lastName;
          profile.username = detailsData.username;
          profile.dateOfBirth = detailsData.dateOfBirth;
          profile.gender = detailsData.gender;
          profile.bio = detailsData.bio;
          profile.occupation = detailsData.occupation;
          profile.referralSource = detailsData.referralSource;
        } catch (e) {
          result.errors.push('Failed to parse onboarding_details');
        }
      }

      // Get profile picture
      const profilePic = localStorage.getItem('onboarding_profile_pic');
      if (profilePic) {
        profile.profilePic = profilePic;
      }

      // Get banner picture
      const bannerPic = localStorage.getItem('onboarding_banner_pic');
      if (bannerPic) {
        profile.bannerPic = bannerPic;
      }

      // Get team emails
      const team = localStorage.getItem('onboarding_team');
      if (team) {
        try {
          profile.teamEmails = JSON.parse(team);
        } catch (e) {
          result.errors.push('Failed to parse onboarding_team');
        }
      }

      // Get socials
      const socials = localStorage.getItem('onboarding_socials');
      if (socials) {
        try {
          profile.socials = JSON.parse(socials);
        } catch (e) {
          result.errors.push('Failed to parse onboarding_socials');
        }
      }

      // Get first idea
      const firstIdea = localStorage.getItem('onboarding_first_idea');
      if (firstIdea) {
        try {
          profile.firstIdea = JSON.parse(firstIdea);
        } catch (e) {
          result.errors.push('Failed to parse onboarding_first_idea');
        }
      }

      // Save profile if we have any data
      if (Object.keys(profile).length > 0) {
        await saveUserProfile(profile);
        result.migrated.profile = true;
      }

      // Mark onboarding as complete if the flag exists
      const onboardingComplete = localStorage.getItem('onboarding_complete');
      if (onboardingComplete === 'true') {
        await markOnboardingComplete();
      }
    } catch (error: any) {
      result.errors.push(`Profile migration failed: ${error.message}`);
      result.success = false;
    }

    // Migrate projects
    try {
      const projectsStr = localStorage.getItem('zyra_projects');
      if (projectsStr) {
        try {
          const projects = JSON.parse(projectsStr);
          if (Array.isArray(projects)) {
            for (const project of projects) {
              try {
                await saveProject({
                  title: project.title || 'Untitled Project',
                  description: project.description || '',
                  source_idea_id: project.sourceIdea || undefined,
                  status: 'active',
                  metadata: {
                    migrated: true,
                    originalCreatedAt: project.createdAt,
                  },
                });
              } catch (error: any) {
                result.errors.push(`Failed to migrate project: ${error.message}`);
              }
            }
            result.migrated.projects = true;
          }
        } catch (e) {
          result.errors.push('Failed to parse zyra_projects');
        }
      }
    } catch (error: any) {
      result.errors.push(`Projects migration failed: ${error.message}`);
      result.success = false;
    }

    // Clear localStorage after successful migration (optional - comment out if you want to keep backup)
    // if (result.success && result.migrated.profile && result.migrated.projects) {
    //   localStorage.removeItem('onboarding_complete');
    //   localStorage.removeItem('onboarding_details');
    //   localStorage.removeItem('onboarding_profile_pic');
    //   localStorage.removeItem('onboarding_banner_pic');
    //   localStorage.removeItem('onboarding_team');
    //   localStorage.removeItem('onboarding_socials');
    //   localStorage.removeItem('onboarding_first_idea');
    //   localStorage.removeItem('zyra_projects');
    // }

    return result;
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Migration failed: ${error.message}`);
    return result;
  }
}

/**
 * Check if migration is needed
 */
export function isMigrationNeeded(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if any localStorage keys exist
  return !!(
    localStorage.getItem('onboarding_details') ||
    localStorage.getItem('onboarding_profile_pic') ||
    localStorage.getItem('onboarding_banner_pic') ||
    localStorage.getItem('onboarding_team') ||
    localStorage.getItem('onboarding_socials') ||
    localStorage.getItem('onboarding_first_idea') ||
    localStorage.getItem('zyra_projects')
  );
}















