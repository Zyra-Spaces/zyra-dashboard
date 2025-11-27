import { createClient } from "./client";
import type { UserProfile } from "../onboarding";

// Save user profile to Supabase
export async function saveUserProfile(profile: UserProfile) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Update user metadata
  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      full_name: profile.firstName && profile.lastName 
        ? `${profile.firstName} ${profile.lastName}` 
        : profile.firstName || profile.lastName || undefined,
      first_name: profile.firstName,
      last_name: profile.lastName,
      username: profile.username,
      date_of_birth: profile.dateOfBirth,
      gender: profile.gender,
      profile_pic: profile.profilePic,
      banner_pic: profile.bannerPic,
      team_emails: profile.teamEmails,
      socials: profile.socials,
    },
  });

  if (metadataError) throw metadataError;

  // Optionally save to profiles table if it exists
  // This is disabled by default - user metadata is sufficient
  // Uncomment below if you create a profiles table in Supabase
  /*
  try {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        first_name: profile.firstName,
        last_name: profile.lastName,
        username: profile.username,
        date_of_birth: profile.dateOfBirth,
        gender: profile.gender,
        profile_pic: profile.profilePic,
        banner_pic: profile.bannerPic,
        team_emails: profile.teamEmails,
        socials: profile.socials,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.warn("Profile table error:", profileError);
    }
  } catch (error) {
    // Table might not exist, that's fine
  }
  */

  return { success: true };
}

// Get user profile from Supabase
export async function getUserProfileFromSupabase() {
  const supabase = createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("User not authenticated");

  const profile: UserProfile = {
    firstName: user.user_metadata?.first_name,
    lastName: user.user_metadata?.last_name,
    username: user.user_metadata?.username,
    dateOfBirth: user.user_metadata?.date_of_birth,
    gender: user.user_metadata?.gender,
    profilePic: user.user_metadata?.profile_pic,
    bannerPic: user.user_metadata?.banner_pic,
    teamEmails: user.user_metadata?.team_emails,
    socials: user.user_metadata?.socials,
  };

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




