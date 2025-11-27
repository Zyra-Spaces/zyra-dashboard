"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/use-profile";
import { Loading } from "@/components/ui/loading";
import {
  User,
  Mail,
  Calendar,
  Users,
  Lightbulb,
  Edit,
  ArrowLeft,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Camera,
  MapPin,
  Link as LinkIcon,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isLoading } = useProfile();

  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName ||
        profile?.lastName ||
        user?.user_metadata?.full_name ||
        "User";

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const capitalizeFirst = (str?: string) => {
    if (!str) return "Not set";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (isLoading) {
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
        <nav className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-3">
                  <svg
                    width="32"
                    height="31"
                    viewBox="0 0 32 31"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.4 0H25.8462V8.32929H25.8797L11.7873 22.6707H32V31H0V22.6707H0.212553L14.3049 8.32929H6.4V0Z"
                      fill="#4780C6"
                    />
                  </svg>
                  <h1 className="text-xl font-semibold text-gray-900">
                    My Profile
                  </h1>
                </div>
              </div>
              <Link
                href="/profile/edit"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4780C6] text-white hover:bg-[#3a6db0] transition-colors cursor-pointer text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            {/* Banner - Clickable to edit */}
            <Link 
              href="/profile/edit?tab=pictures"
              className="relative h-48 bg-gradient-to-r from-[#4780C6] to-[#6B9FD4] block group cursor-pointer"
            >
              {profile?.bannerPic ? (
                <img
                  src={profile.bannerPic}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white/30" />
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-2 text-white text-sm font-medium">
                  <Camera className="w-5 h-5" />
                  Edit Banner
                </div>
              </div>
            </Link>

            {/* Profile Info */}
            <div className="relative px-6 pb-6">
              {/* Profile Picture - Clickable to edit */}
              <Link 
                href="/profile/edit?tab=pictures"
                className="absolute -top-16 left-6 group cursor-pointer"
              >
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-lg relative">
                  {profile?.profilePic ? (
                    <img
                      src={profile.profilePic}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4780C6] to-[#6B9FD4]">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Link>

              {/* Name and Details */}
              <div className="pt-20">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {displayName}
                    </h2>
                    {profile?.username && (
                      <p className="text-gray-500 text-sm mt-1">
                        @{profile.username}
                      </p>
                    )}
                    {profile?.bio && (
                      <p className="text-gray-600 text-sm mt-2 max-w-md">
                        {profile.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-gray-500 text-sm mt-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {user?.email}
                      </div>
                      {profile?.occupation && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
                          {profile.occupation.charAt(0).toUpperCase() + profile.occupation.slice(1).replace(/-/g, " ")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social Links */}
                  {profile?.socials &&
                    Object.values(profile.socials).some((v) => v) && (
                      <div className="flex items-center gap-3 mt-4 md:mt-0">
                        {profile.socials.twitter && (
                          <a
                            href={`https://twitter.com/${profile.socials.twitter.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-100 rounded-full hover:bg-[#1DA1F2] hover:text-white transition-colors cursor-pointer"
                          >
                            <Twitter className="w-5 h-5" />
                          </a>
                        )}
                        {profile.socials.linkedin && (
                          <a
                            href={
                              profile.socials.linkedin.startsWith("http")
                                ? profile.socials.linkedin
                                : `https://${profile.socials.linkedin}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-100 rounded-full hover:bg-[#0A66C2] hover:text-white transition-colors cursor-pointer"
                          >
                            <Linkedin className="w-5 h-5" />
                          </a>
                        )}
                        {profile.socials.instagram && (
                          <a
                            href={`https://instagram.com/${profile.socials.instagram.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-100 rounded-full hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] hover:text-white transition-colors cursor-pointer"
                          >
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                        {profile.socials.facebook && (
                          <a
                            href={
                              profile.socials.facebook.startsWith("http")
                                ? profile.socials.facebook
                                : `https://${profile.socials.facebook}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-100 rounded-full hover:bg-[#1877F2] hover:text-white transition-colors cursor-pointer"
                          >
                            <Facebook className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#4780C6]/10 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-[#4780C6]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Personal Details
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">First Name</span>
                  <span className="text-gray-900 font-medium">{profile?.firstName || "Not set"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Last Name</span>
                  <span className="text-gray-900 font-medium">{profile?.lastName || "Not set"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Username</span>
                  <span className="text-gray-900 font-medium">{profile?.username ? `@${profile.username}` : "Not set"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Date of Birth</span>
                  <span className="text-gray-900 font-medium">{formatDate(profile?.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Gender</span>
                  <span className="text-gray-900 font-medium">{capitalizeFirst(profile?.gender)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Occupation</span>
                  <span className="text-gray-900 font-medium">{capitalizeFirst(profile?.occupation)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 text-sm">Referral Source</span>
                  <span className="text-gray-900 font-medium">{capitalizeFirst(profile?.referralSource)}</span>
                </div>
                {profile?.bio && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-gray-500 text-sm block mb-1">Bio</span>
                    <p className="text-gray-900 text-sm">{profile.bio}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Team Members Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Team Members
                </h3>
              </div>

              {profile?.teamEmails && profile.teamEmails.length > 0 ? (
                <div className="space-y-3">
                  {profile.teamEmails.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-[#4780C6] to-[#6B9FD4] rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm font-medium truncate">
                          {email}
                        </p>
                        <p className="text-gray-500 text-xs">Invited</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No team members yet</p>
                  <Link
                    href="/onboarding/team"
                    className="text-[#4780C6] text-sm hover:underline mt-2 inline-block cursor-pointer"
                  >
                    Invite team members →
                  </Link>
                </div>
              )}
            </div>

            {/* Social Links Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Social Links
                </h3>
              </div>

              {profile?.socials &&
              Object.values(profile.socials).some((v) => v) ? (
                <div className="space-y-3">
                  {profile.socials.twitter && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                      <span className="text-gray-900 text-sm">
                        {profile.socials.twitter}
                      </span>
                    </div>
                  )}
                  {profile.socials.linkedin && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                      <span className="text-gray-900 text-sm truncate">
                        {profile.socials.linkedin}
                      </span>
                    </div>
                  )}
                  {profile.socials.instagram && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Instagram className="w-5 h-5 text-[#E4405F]" />
                      <span className="text-gray-900 text-sm">
                        {profile.socials.instagram}
                      </span>
                    </div>
                  )}
                  {profile.socials.facebook && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Facebook className="w-5 h-5 text-[#1877F2]" />
                      <span className="text-gray-900 text-sm truncate">
                        {profile.socials.facebook}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No social links added</p>
                  <Link
                    href="/profile/edit?tab=socials"
                    className="text-[#4780C6] text-sm hover:underline mt-2 inline-block cursor-pointer"
                  >
                    Add social links →
                  </Link>
                </div>
              )}
            </div>

            {/* First Idea Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  First Project Idea
                </h3>
              </div>

              {profile?.firstIdea ? (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
                  <h4 className="text-gray-900 font-semibold mb-2">
                    {profile.firstIdea.title}
                  </h4>
                  {profile.firstIdea.description && (
                    <p className="text-gray-600 text-sm">
                      {profile.firstIdea.description}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No project idea yet</p>
                  <Link
                    href="/onboarding/create-idea"
                    className="text-[#4780C6] text-sm hover:underline mt-2 inline-block cursor-pointer"
                  >
                    Create your first idea →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Account Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Account Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100 md:border-b-0">
                <span className="text-gray-500 text-sm">Email</span>
                <span className="text-gray-900 font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100 md:border-b-0">
                <span className="text-gray-500 text-sm">Account Created</span>
                <span className="text-gray-900 font-medium">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100 md:border-b-0">
                <span className="text-gray-500 text-sm">Email Verified</span>
                <span
                  className={`font-medium ${user?.email_confirmed_at ? "text-green-600" : "text-amber-600"}`}
                >
                  {user?.email_confirmed_at ? "Verified" : "Pending"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-500 text-sm">User ID</span>
                <span className="text-gray-500 font-mono text-xs">
                  {user?.id?.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

