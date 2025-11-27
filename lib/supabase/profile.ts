import { createClient } from "./client";
import type { UserProfile } from "../onboarding";

// Save user profile - STORE EVERYTHING IN LOCALSTORAGE ONLY
// DO NOT save to Supabase metadata to prevent cookie size issues
// Only auth tokens should be in cookies
export async function saveUserProfile(profile: Partial<UserProfile>) {
  // Store everything in localStorage only - no metadata updates
  // This prevents cookie size issues completely
  
  if (typeof window === "undefined") {
    return { success: true };
  }

  // Save all data to localStorage
  if (profile.firstName !== undefined || profile.lastName !== undefined || 
      profile.username !== undefined || profile.dateOfBirth !== undefined || 
      profile.gender !== undefined || profile.bio !== undefined ||
      profile.occupation !== undefined || profile.referralSource !== undefined) {
    
    const existingDetails = localStorage.getItem("onboarding_details");
    const detailsData = existingDetails ? JSON.parse(existingDetails) : {};
    
    const updatedDetails = {
      ...detailsData,
      ...(profile.firstName !== undefined && { firstName: profile.firstName }),
      ...(profile.lastName !== undefined && { lastName: profile.lastName }),
      ...(profile.username !== undefined && { username: profile.username }),
      ...(profile.dateOfBirth !== undefined && { dateOfBirth: profile.dateOfBirth }),
      ...(profile.gender !== undefined && { gender: profile.gender }),
      ...(profile.bio !== undefined && { bio: profile.bio }),
      ...(profile.occupation !== undefined && { occupation: profile.occupation }),
      ...(profile.referralSource !== undefined && { referralSource: profile.referralSource }),
    };
    
    localStorage.setItem("onboarding_details", JSON.stringify(updatedDetails));
  }

  if (profile.profilePic !== undefined) {
    if (profile.profilePic) {
      localStorage.setItem("onboarding_profile_pic", profile.profilePic);
    } else {
      localStorage.removeItem("onboarding_profile_pic");
    }
  }

  if (profile.bannerPic !== undefined) {
    if (profile.bannerPic) {
      localStorage.setItem("onboarding_banner_pic", profile.bannerPic);
    } else {
      localStorage.removeItem("onboarding_banner_pic");
    }
  }

  if (profile.teamEmails !== undefined) {
    if (profile.teamEmails && profile.teamEmails.length > 0) {
      localStorage.setItem("onboarding_team", JSON.stringify(profile.teamEmails));
    } else {
      localStorage.removeItem("onboarding_team");
    }
  }

  if (profile.socials !== undefined) {
    const hasSocials = Object.values(profile.socials).some(v => v);
    if (hasSocials) {
      localStorage.setItem("onboarding_socials", JSON.stringify(profile.socials));
    } else {
      localStorage.removeItem("onboarding_socials");
    }
  }

  // DO NOT update Supabase metadata - keep cookies minimal (only auth tokens)
  return { success: true };
}

// Get user profile - ONLY from localStorage
// Do not read from Supabase metadata to avoid cookie issues
export async function getUserProfileFromSupabase() {
  const supabase = createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("User not authenticated");

  // Get ALL data from localStorage only (not from metadata)
  const profile: UserProfile = {};

  if (typeof window !== "undefined") {
    try {
      const details = localStorage.getItem("onboarding_details");
      const profilePic = localStorage.getItem("onboarding_profile_pic");
      const bannerPic = localStorage.getItem("onboarding_banner_pic");
      const team = localStorage.getItem("onboarding_team");
      const socials = localStorage.getItem("onboarding_socials");

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
    } catch (error) {
      console.warn("Could not load from localStorage:", error);
    }
  }

  // Optionally get from profiles table if it exists
  // This is disabled by default - user metadata is sufficient
  // Uncomment below if you create a profiles table in Supabase
  /*
  try {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) {
      profile.firstName = profileData.first_name || profile.firstName;
      profile.lastName = profileData.last_name || profile.lastName;
      profile.username = profileData.username || profile.username;
      profile.dateOfBirth = profileData.date_of_birth || profile.dateOfBirth;
      profile.gender = profileData.gender || profile.gender;
      profile.profilePic = profileData.profile_pic || profile.profilePic;
      profile.bannerPic = profileData.banner_pic || profile.bannerPic;
      profile.teamEmails = profileData.team_emails || profile.teamEmails;
      profile.socials = profileData.socials || profile.socials;
    }
  } catch (error) {
    // Table might not exist, use metadata only
  }
  */

  return profile;
}




