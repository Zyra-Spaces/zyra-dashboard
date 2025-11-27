'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/hooks/use-profile';
import { isOnboardingComplete, getOnboardingProgress } from '@/lib/onboarding';
import { LogOut, User, Shield, Key, Lock, Mail, Calendar, Users, Sparkles, Lightbulb, AlertCircle, ArrowRight, UserCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut, isLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingProgress, setOnboardingProgress] = useState(getOnboardingProgress());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkStatus = () => {
        const completed = isOnboardingComplete();
        setOnboardingComplete(completed);
        setCheckingOnboarding(false);
      };
      
      const updateStatus = () => {
        const completed = isOnboardingComplete();
        const progress = getOnboardingProgress();
        setOnboardingComplete(completed);
        setOnboardingProgress(progress);
        setCheckingOnboarding(false);
      };
      
      updateStatus();
      
      // Listen for storage changes (when onboarding is completed in another tab/window)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key?.startsWith('onboarding_')) {
          updateStatus();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // Also check periodically in case onboarding is completed in the same window
      const interval = setInterval(updateStatus, 2000);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log out');
    }
  };

  const handleCompleteOnboarding = () => {
    router.push('/onboarding/details');
  };

  const displayName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.firstName || profile?.lastName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="border-b border-gray-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <svg width="32" height="31" viewBox="0 0 32 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.4 0H25.8462V8.32929H25.8797L11.7873 22.6707H32V31H0V22.6707H0.212553L14.3049 8.32929H6.4V0Z" fill="#4780C6"/>
                </svg>
                <h1 className="text-xl font-semibold text-gray-900">Zyra Spaces</h1>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#4780C6] transition-colors cursor-pointer"
                >
                  {profile?.profilePic ? (
                    <img 
                      src={profile.profilePic} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-8 h-8" />
                  )}
                  <span className="hidden sm:inline">{user?.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="w-4 h-4" />
                  {isLoading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6">
            {/* Onboarding Status Banner - Only show if incomplete */}
            {!checkingOnboarding && !onboardingComplete && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-amber-900">
                        Complete Your Onboarding
                      </h3>
                      <span className="px-3 py-1 bg-amber-200 text-amber-800 text-xs font-medium rounded-full">
                        Incomplete
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 mb-4">
                      Your profile setup is incomplete. Complete your onboarding to unlock all features and personalize your experience.
                    </p>
                    
                    {/* Progress Indicator */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-amber-800">
                          Progress: {onboardingProgress.completedSteps} of {onboardingProgress.totalSteps} steps
                        </span>
                        <span className="text-xs font-medium text-amber-800">
                          {Math.round((onboardingProgress.completedSteps / onboardingProgress.totalSteps) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-amber-200 rounded-full h-2">
                        <div
                          className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(onboardingProgress.completedSteps / onboardingProgress.totalSteps) * 100}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {[
                          { key: 'details', label: 'Details', completed: onboardingProgress.details },
                          { key: 'profilePictures', label: 'Profile', completed: onboardingProgress.profilePictures },
                          { key: 'team', label: 'Team', completed: onboardingProgress.team },
                          { key: 'socials', label: 'Socials', completed: onboardingProgress.socials },
                          { key: 'firstIdea', label: 'First Idea', completed: onboardingProgress.firstIdea },
                        ].map((step) => (
                          <div
                            key={step.key}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              step.completed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {step.completed ? '✓' : '○'} {step.label}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleCompleteOnboarding}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 active:bg-amber-800 transition-all cursor-pointer font-medium text-sm shadow-sm"
                    >
                      Complete Onboarding
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Profile Header */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-6">
                {profile?.profilePic ? (
                  <img
                    src={profile.profilePic}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1 text-gray-900">
                    Welcome, {displayName}! 👋
                  </h2>
                  <p className="text-gray-500 mb-4">
                    You&apos;re now logged into your Zyra Spaces dashboard.
                  </p>
                  {profileLoading ? (
                    <p className="text-sm text-gray-400">Loading profile...</p>
                  ) : (
                    <div className="flex flex-wrap gap-4 text-sm">
                      {profile?.username && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span>@{profile.username}</span>
                        </div>
                      )}
                      {user?.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                      )}
                      {profile?.dateOfBirth && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(profile.dateOfBirth).toLocaleDateString()}</span>
                        </div>
                      )}
                      {profile?.gender && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="capitalize">{profile.gender}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Information Cards */}
            {profile && !profileLoading && (
              <div className="grid md:grid-cols-2 gap-4">
                {profile.teamEmails && profile.teamEmails.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="w-5 h-5 text-[#4780C6]" />
                      <h3 className="font-semibold text-gray-900">Team Members</h3>
                    </div>
                    <div className="space-y-2">
                      {profile.teamEmails.map((email, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.socials && Object.keys(profile.socials).length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="w-5 h-5 text-[#4780C6]" />
                      <h3 className="font-semibold text-gray-900">Social Accounts</h3>
                    </div>
                    <div className="space-y-2">
                      {profile.socials.twitter && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Twitter:</span> {profile.socials.twitter}
                        </div>
                      )}
                      {profile.socials.linkedin && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">LinkedIn:</span> {profile.socials.linkedin}
                        </div>
                      )}
                      {profile.socials.instagram && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Instagram:</span> {profile.socials.instagram}
                        </div>
                      )}
                      {profile.socials.facebook && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Facebook:</span> {profile.socials.facebook}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {profile.firstIdea && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb className="w-5 h-5 text-[#4780C6]" />
                      <h3 className="font-semibold text-gray-900">Your First Idea</h3>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{profile.firstIdea.title}</h4>
                      {profile.firstIdea.description && (
                        <p className="text-sm text-gray-600">{profile.firstIdea.description}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-default">
                <h3 className="font-semibold mb-2 text-gray-900">User ID</h3>
                <p className="text-sm text-gray-500 break-all font-mono">{user?.id}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-default">
                <h3 className="font-semibold mb-2 text-gray-900">Email</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-default">
                <h3 className="font-semibold mb-2 text-gray-900">Status</h3>
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Authenticated
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                <Lock className="w-5 h-5 text-[#4780C6]" />
                Security Features
              </h3>
              <ul className="space-y-3 text-sm text-gray-500">
                <li className="flex items-start gap-3">
                  <Key className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Supabase Auth:</strong> Secure authentication with JWT tokens
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Key className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Next.js Middleware:</strong> Server-side route protection
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Key className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Email Verification:</strong> OTP-based email confirmation
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Key className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Password Reset:</strong> Secure password recovery flow
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-[#4780C6]/10 to-blue-500/10 border border-[#4780C6]/20 rounded-xl p-6">
              <h3 className="font-semibold mb-2 text-[#4780C6]">🎉 Welcome to Zyra Spaces</h3>
              <p className="text-sm text-gray-600">
                Your all-in-one project management tool. Start creating projects and collaborating with your team!
              </p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
