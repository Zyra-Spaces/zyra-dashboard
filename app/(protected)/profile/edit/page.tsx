"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/use-profile";
import { saveUserProfile } from "@/lib/supabase/profile";
import { Select } from "@/components/ui/select";
import { Loading } from "@/components/ui/loading";
import {
  User,
  Camera,
  ArrowLeft,
  Save,
  Loader2,
  Check,
  X,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  AlertCircle,
} from "lucide-react";

type TabType = "personal" | "pictures" | "socials";

export default function EditProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, updateProfile } = useProfile();
  
  // Get initial tab from URL or default to personal
  const initialTab = (searchParams.get("tab") as TabType) || "personal";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    dateOfBirth: "",
    gender: "",
    bio: "",
    occupation: "",
    referralSource: "",
    profilePic: "",
    bannerPic: "",
    socials: {
      twitter: "",
      linkedin: "",
      instagram: "",
      facebook: "",
    },
  });

  // File refs
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        username: profile.username || "",
        dateOfBirth: profile.dateOfBirth || "",
        gender: profile.gender || "",
        bio: profile.bio || "",
        occupation: profile.occupation || "",
        referralSource: profile.referralSource || "",
        profilePic: profile.profilePic || "",
        bannerPic: profile.bannerPic || "",
        socials: {
          twitter: profile.socials?.twitter || "",
          linkedin: profile.socials?.linkedin || "",
          instagram: profile.socials?.instagram || "",
          facebook: profile.socials?.facebook || "",
        },
      });
    }
  }, [profile]);

  // Track changes
  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => {
      if (field.startsWith("socials.")) {
        const socialField = field.split(".")[1];
        return {
          ...prev,
          socials: { ...prev.socials, [socialField]: value },
        };
      }
      return { ...prev, [field]: value };
    });
    setHasChanges(true);
    setSaveStatus("idle");
  }, []);

  // Handle image upload - upload to storage first, then save URL
  const handleImageUpload = useCallback(async (type: "profile" | "banner", file: File) => {
    const maxSize = type === "profile" ? 2 * 1024 * 1024 : 3 * 1024 * 1024;
    
    if (file.size > maxSize) {
      setSaveStatus("error");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (type === "profile") {
        updateField("profilePic", preview);
      } else {
        updateField("bannerPic", preview);
      }
    };
    reader.readAsDataURL(file);

    // Upload to storage in background
    try {
      const { uploadImage } = await import("@/lib/supabase/storage");
      const url = await uploadImage(file, type);
      
      // Update with URL (replaces base64 preview)
      if (type === "profile") {
        updateField("profilePic", url);
      } else {
        updateField("bannerPic", url);
      }
    } catch (uploadError) {
      console.warn("Could not upload to storage, keeping base64 in localStorage only:", uploadError);
      // Keep base64 in form state but don't save to metadata
    }
  }, [updateField]);

  // Save all changes
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("saving");

    try {
      // Save to localStorage for immediate access
      localStorage.setItem("onboarding_details", JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bio: formData.bio,
        occupation: formData.occupation,
        referralSource: formData.referralSource,
      }));

      // Only save URLs to localStorage (or keep base64 for preview)
      if (formData.profilePic) {
        localStorage.setItem("onboarding_profile_pic", formData.profilePic);
      }
      if (formData.bannerPic) {
        localStorage.setItem("onboarding_banner_pic", formData.bannerPic);
      }

      const hasSocials = Object.values(formData.socials).some(v => v);
      if (hasSocials) {
        localStorage.setItem("onboarding_socials", JSON.stringify(formData.socials));
      }

      // Prepare profile data - only include URLs in metadata, not base64
      const profileData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bio: formData.bio,
        occupation: formData.occupation,
        referralSource: formData.referralSource,
        socials: formData.socials,
      };

      // Only include image URLs (not base64) in metadata
      if (formData.profilePic && formData.profilePic.startsWith("http")) {
        profileData.profilePic = formData.profilePic;
      } else if (formData.profilePic === "") {
        profileData.profilePic = null;
      }

      if (formData.bannerPic && formData.bannerPic.startsWith("http")) {
        profileData.bannerPic = formData.bannerPic;
      } else if (formData.bannerPic === "") {
        profileData.bannerPic = null;
      }

      // Save to Supabase (only URLs, never base64)
      await saveUserProfile(profileData);

      setSaveStatus("saved");
      setHasChanges(false);
      
      // Reset status after delay
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save on blur (debounced)
  const handleBlur = useCallback(() => {
    if (hasChanges) {
      handleSave();
    }
  }, [hasChanges]);

  const tabs = [
    { id: "personal" as const, label: "Personal Info" },
    { id: "pictures" as const, label: "Pictures" },
    { id: "socials" as const, label: "Social Links" },
  ];

  const occupationOptions = [
    { value: "", label: "Select your role" },
    { value: "designer", label: "Designer" },
    { value: "developer", label: "Developer" },
    { value: "product-manager", label: "Product Manager" },
    { value: "marketing", label: "Marketing" },
    { value: "founder", label: "Founder / CEO" },
    { value: "freelancer", label: "Freelancer" },
    { value: "student", label: "Student" },
    { value: "other", label: "Other" },
  ];

  const genderOptions = [
    { value: "", label: "Select" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer-not-to-say", label: "Prefer not to say" },
  ];

  if (profileLoading) {
    return (
      <ProtectedRoute>
        <Loading fullScreen />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/profile")}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900">Edit Profile</h1>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
                  ${hasChanges 
                    ? "bg-[#4780C6] text-white hover:bg-[#3a6db0]" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }
                  ${isSaving ? "opacity-75" : ""}
                `}
              >
                {saveStatus === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
                {saveStatus === "saved" && <Check className="w-4 h-4" />}
                {saveStatus === "error" && <AlertCircle className="w-4 h-4" />}
                {saveStatus === "idle" && <Save className="w-4 h-4" />}
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save"}
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <nav className="flex gap-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer
                    ${activeTab === tab.id 
                      ? "border-[#4780C6] text-[#4780C6]" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {/* Personal Info Tab */}
          {activeTab === "personal" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    onBlur={handleBlur}
                    placeholder="John"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Doe"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => updateField("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    onBlur={handleBlur}
                    placeholder="johndoe"
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900"
                  />
                </div>
                <Select
                  label="Gender"
                  value={formData.gender}
                  onChange={(e) => {
                    updateField("gender", e.target.value);
                    handleBlur();
                  }}
                  options={genderOptions}
                />
              </div>

              {/* Occupation */}
              <Select
                label="What do you do?"
                value={formData.occupation}
                onChange={(e) => {
                  updateField("occupation", e.target.value);
                  handleBlur();
                }}
                options={occupationOptions}
              />

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={160}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{formData.bio.length}/160</p>
              </div>
            </div>
          )}

          {/* Pictures Tab */}
          {activeTab === "pictures" && (
            <div className="space-y-6">
              {/* Banner */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="relative h-40 bg-gradient-to-r from-[#4780C6] to-[#6B9FD4]">
                  {formData.bannerPic && (
                    <img
                      src={formData.bannerPic}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload("banner", e.target.files[0])}
                      className="hidden"
                    />
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Change Banner
                    </button>
                  </div>
                  {formData.bannerPic && (
                    <button
                      onClick={() => updateField("bannerPic", "")}
                      className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Profile Picture */}
                <div className="px-6 pb-6">
                  <div className="relative -mt-12 w-24 h-24">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-lg">
                      {formData.profilePic ? (
                        <img
                          src={formData.profilePic}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4780C6] to-[#6B9FD4]">
                          <User className="w-10 h-10 text-white" />
                        </div>
                      )}
                    </div>
                    <input
                      ref={profileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload("profile", e.target.files[0])}
                      className="hidden"
                    />
                    <button
                      onClick={() => profileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-[#4780C6] text-white rounded-full hover:bg-[#3a6db0] transition-colors cursor-pointer shadow-lg"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      Upload a profile picture and banner image to personalize your profile.
                    </p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• Profile: Recommended 400×400px, max 2MB</li>
                      <li>• Banner: Recommended 1200×400px, max 3MB</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Socials Tab */}
          {activeTab === "socials" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Connect your social media accounts to share your profile with others.
              </p>

              {[
                { key: "twitter", icon: Twitter, placeholder: "@username", color: "#1DA1F2", label: "Twitter / X" },
                { key: "linkedin", icon: Linkedin, placeholder: "linkedin.com/in/username", color: "#0A66C2", label: "LinkedIn" },
                { key: "instagram", icon: Instagram, placeholder: "@username", color: "#E4405F", label: "Instagram" },
                { key: "facebook", icon: Facebook, placeholder: "facebook.com/username", color: "#1877F2", label: "Facebook" },
              ].map(({ key, icon: Icon, placeholder, color, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color }} />
                    {label}
                  </label>
                  <input
                    type="text"
                    value={formData.socials[key as keyof typeof formData.socials]}
                    onChange={(e) => updateField(`socials.${key}`, e.target.value)}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Unsaved Changes Warning */}
          {hasChanges && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span className="text-sm">You have unsaved changes</span>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-[#4780C6] text-white rounded-lg text-sm font-medium hover:bg-[#3a6db0] transition-colors cursor-pointer"
              >
                Save Now
              </button>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

