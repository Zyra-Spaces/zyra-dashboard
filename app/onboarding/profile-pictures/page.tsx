"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, User, Image } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { AuthButton } from "@/components/auth/auth-layout";
import { saveUserProfile } from "@/lib/supabase/profile";
import { uploadImage } from "@/lib/supabase/storage";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "react-toastify";

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
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Profile picture must be less than 5MB");
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
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Banner picture must be less than 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePic = () => {
    setProfilePic(null);
    if (profileInputRef.current) {
      profileInputRef.current.value = "";
    }
  };

  const removeBannerPic = () => {
    setBannerPic(null);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let profilePicUrl: string | undefined;
      let bannerPicUrl: string | undefined;

      if (!user) {
        toast.error("Please log in to upload images");
        setIsLoading(false);
        return;
      }

      // Upload images to Supabase Storage instead of storing base64
      // Files will be stored as: {userId}/profile.jpg and {userId}/banner.jpg
      if (profilePic) {
        try {
          profilePicUrl = await uploadImage(
            profilePic,
            "profile" // Will be stored as {userId}/profile.jpg
          );
          // Save URL to localStorage for preview
          localStorage.setItem("onboarding_profile_pic", profilePicUrl);
        } catch (uploadError: any) {
          console.error("Error uploading profile pic:", uploadError);
          toast.error(
            uploadError.message || "Failed to upload profile picture. Please try again."
          );
          setIsLoading(false);
          return;
        }
      }

      if (bannerPic) {
        try {
          bannerPicUrl = await uploadImage(
            bannerPic,
            "banner" // Will be stored as {userId}/banner.jpg
          );
          // Save URL to localStorage for preview
          localStorage.setItem("onboarding_banner_pic", bannerPicUrl);
        } catch (uploadError: any) {
          console.error("Error uploading banner pic:", uploadError);
          toast.error(
            uploadError.message || "Failed to upload banner picture. Please try again."
          );
          setIsLoading(false);
          return;
        }
      }

      // Save URLs (not base64) to Supabase metadata
      await saveUserProfile({
        profilePic: profilePicUrl,
        bannerPic: bannerPicUrl,
      });

      toast.success("Pictures saved!");
      setTimeout(() => {
        router.push("/onboarding/team");
      }, 500);
    } catch (error: any) {
      console.error("Error saving pictures:", error);
      toast.error(error.message || "Failed to save pictures");
      setIsLoading(false);
    }
  };

  return (
    <OnboardingGuard>
      <OnboardingLayout currentStep={2}>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          {/* Icon */}
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Image className="w-8 h-8 text-gray-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-medium text-gray-900 text-center mb-2">
            Add Profile Pictures
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8">
            Upload your profile picture and banner image
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profilePic ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                      <img
                        src={profilePic}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeProfilePic}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
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
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm text-gray-700"
                  >
                    <Upload className="w-4 h-4" />
                    {profilePic ? "Change picture" : "Upload picture"}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Max 5MB, recommended: 400x400px</p>
                </div>
              </div>
            </div>

            {/* Banner Picture */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Banner Picture
              </label>
              <div className="relative">
                {bannerPic ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img
                      src={bannerPic}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeBannerPic}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-48 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No banner image</p>
                  </div>
                )}
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
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm text-gray-700 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  {bannerPic ? "Change banner" : "Upload banner"}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">Max 10MB, recommended: 1200x400px</p>
            </div>

            <div className="pt-4">
              <AuthButton type="submit" isLoading={isLoading}>
                Continue
              </AuthButton>
            </div>
          </form>

          {/* Skip Option */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push("/onboarding/team")}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </button>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-all ${
                  step === 2
                    ? "bg-[#4780C6] w-6"
                    : step < 2
                    ? "bg-[#4780C6]"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}

