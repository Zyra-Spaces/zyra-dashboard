import { createClient } from "./client";
import type { UserProfile } from "../onboarding";

// Save user profile to Supabase
// CRITICAL: Only store minimal data in metadata to avoid cookie size issues
// Store large data (images, arrays, objects) in localStorage only
export async function saveUserProfile(profile: Partial<UserProfile>) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Build metadata object - ONLY small, essential fields
  // NEVER store: images, arrays, objects, or large strings
  const metadata: Record<string, any> = {};
  
  // Only set full_name if we have name data
  if (profile.firstName !== undefined || profile.lastName !== undefined) {
    const firstName = profile.firstName ?? user.user_metadata?.first_name ?? "";
    const lastName = profile.lastName ?? user.user_metadata?.last_name ?? "";
    if (firstName && lastName) {
      metadata.full_name = `${firstName} ${lastName}`;
    } else if (firstName || lastName) {
      metadata.full_name = firstName || lastName;
    }
  }
  
  // ONLY store small, essential fields in metadata (to keep cookies small)
  // Store everything else in localStorage
  const smallFields: [keyof UserProfile, string][] = [
    ["firstName", "first_name"],
    ["lastName", "last_name"],
    ["username", "username"],
    ["dateOfBirth", "date_of_birth"],
    ["gender", "gender"],
    ["occupation", "occupation"],
    ["referralSource", "referral_source"],
  ];

  // Only include small fields that are explicitly provided
  for (const [profileKey, metadataKey] of smallFields) {
    if (profile[profileKey] !== undefined) {
      const value = profile[profileKey];
      // Only store if it's a small string (max 100 chars) or simple value
      if (typeof value === "string" && value.length <= 100) {
        metadata[metadataKey] = value;
      } else if (value === null || value === "") {
        metadata[metadataKey] = null;
      }
    }
  }

  // Bio - only if short (max 50 chars for metadata, full version in localStorage)
  if (profile.bio !== undefined) {
    if (profile.bio && profile.bio.length <= 50) {
      metadata.bio = profile.bio;
    } else {
      metadata.bio = null; // Don't store long bios in metadata
    }
  }

  // NEVER store in metadata:
  // - Images (profilePic, bannerPic) - store in localStorage only
  // - Arrays (teamEmails) - store in localStorage only
  // - Objects (socials) - store in localStorage only

  // Only update if we have something to update
  if (Object.keys(metadata).length === 0) {
    return { success: true };
  }

  // Update user metadata (minimal data only)
  const { error: metadataError } = await supabase.auth.updateUser({
    data: metadata,
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
// Gets minimal data from metadata, rest from localStorage
export async function getUserProfileFromSupabase() {
  const supabase = createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("User not authenticated");

  // Get minimal data from metadata (small fields only)
  const profile: UserProfile = {
    firstName: user.user_metadata?.first_name,
    lastName: user.user_metadata?.last_name,
    username: user.user_metadata?.username,
    dateOfBirth: user.user_metadata?.date_of_birth,
    gender: user.user_metadata?.gender,
    occupation: user.user_metadata?.occupation,
    referralSource: user.user_metadata?.referral_source,
    // Bio from metadata (short version) or localStorage (full version)
    bio: user.user_metadata?.bio,
  };

  // Get large data from localStorage (not from metadata to avoid cookie issues)
  if (typeof window !== "undefined") {
    try {
      const profilePic = localStorage.getItem("onboarding_profile_pic");
      const bannerPic = localStorage.getItem("onboarding_banner_pic");
      const team = localStorage.getItem("onboarding_team");
      const socials = localStorage.getItem("onboarding_socials");
      const details = localStorage.getItem("onboarding_details");

      if (profilePic) profile.profilePic = profilePic;
      if (bannerPic) profile.bannerPic = bannerPic;
      if (team) profile.teamEmails = JSON.parse(team);
      if (socials) profile.socials = JSON.parse(socials);
      
      // Get full bio from details if available
      if (details) {
        const detailsData = JSON.parse(details);
        if (detailsData.bio && detailsData.bio.length > 50) {
          profile.bio = detailsData.bio; // Use full bio from localStorage
        }
      }
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




