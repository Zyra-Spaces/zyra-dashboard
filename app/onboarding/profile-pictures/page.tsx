"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, User, Image } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { AuthButton } from "@/components/auth/auth-layout";
import { InlineNotification, notify } from "@/components/ui/inline-notification";
import { saveUserProfile } from "@/lib/supabase/profile";
import { uploadImage } from "@/lib/supabase/storage";
import { useAuth } from "@/contexts/auth-context";

export default function OnboardingProfilePicturesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [bannerPic, setBannerPic] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        notify.error("Profile picture must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerPicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        notify.error("Banner picture must be less than 3MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let profilePicUrl: string | undefined;
      let bannerPicUrl: string | undefined;

      // Upload images to storage if they're base64 (not already URLs)
      if (profilePic && !profilePic.startsWith("http")) {
        try {
          profilePicUrl = await uploadImage(profilePic, "profile");
          localStorage.setItem("onboarding_profile_pic", profilePicUrl);
        } catch (uploadError) {
          console.warn("Could not upload profile pic to storage:", uploadError);
          // Store base64 in localStorage only (not in metadata)
          localStorage.setItem("onboarding_profile_pic", profilePic);
        }
      } else if (profilePic) {
        profilePicUrl = profilePic;
        localStorage.setItem("onboarding_profile_pic", profilePic);
      }

      if (bannerPic && !bannerPic.startsWith("http")) {
        try {
          bannerPicUrl = await uploadImage(bannerPic, "banner");
          localStorage.setItem("onboarding_banner_pic", bannerPicUrl);
        } catch (uploadError) {
          console.warn("Could not upload banner pic to storage:", uploadError);
          // Store base64 in localStorage only (not in metadata)
          localStorage.setItem("onboarding_banner_pic", bannerPic);
        }
      } else if (bannerPic) {
        bannerPicUrl = bannerPic;
        localStorage.setItem("onboarding_banner_pic", bannerPic);
      }

      // Don't save images to Supabase metadata - store in localStorage only
      // This prevents cookie size issues
      // Images are already saved to localStorage above

      notify.success("Pictures saved!");
      setTimeout(() => {
        router.push("/onboarding/team");
      }, 500);
    } catch (error: any) {
      console.error("Error saving pictures:", error);
      notify.error("Failed to save pictures");
      setIsLoading(false);
    }
  };

  return (
    <OnboardingGuard>
      <OnboardingLayout currentStep={2}>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-h-[calc(100vh-120px)] overflow-hidden">
          {/* Notification */}
          <InlineNotification className="mb-4" />

          {/* Header - Compact */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Image className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">Profile Pictures</h1>
              <p className="text-xs text-gray-500">Add your profile picture and banner</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Banner Preview */}
            <div className="relative h-28 rounded-lg overflow-hidden bg-gradient-to-r from-[#4780C6] to-[#6B9FD4]">
              {bannerPic ? (
                <>
                  <img src={bannerPic} alt="Banner" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setBannerPic(null)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerPicChange}
                    className="hidden"
                    id="banner-pic"
                  />
                  <label
                    htmlFor="banner-pic"
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/90 text-gray-700 rounded-lg text-xs cursor-pointer hover:bg-white transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    Upload Banner
                  </label>
                </div>
              )}

              {/* Profile Picture - Overlaid on Banner */}
              <div className="absolute -bottom-10 left-4">
                <div className="relative w-20 h-20 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-lg">
                  {profilePic ? (
                    <>
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setProfilePic(null)}
                        className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Upload Button */}
            <div className="pt-8 pl-28">
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
                id="profile-pic"
              />
              <label
                htmlFor="profile-pic"
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-xs text-gray-700"
              >
                <Upload className="w-3 h-3" />
                {profilePic ? "Change Photo" : "Upload Photo"}
              </label>
            </div>

            {/* Info */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
              <p>• Profile: Recommended 400×400px, max 2MB</p>
              <p>• Banner: Recommended 1200×400px, max 3MB</p>
            </div>

            {/* Submit */}
            <AuthButton type="submit" isLoading={isLoading}>
              Continue
            </AuthButton>
          </form>

          {/* Skip */}
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <button
              type="button"
              onClick={() => router.push("/onboarding/team")}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </div>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}
