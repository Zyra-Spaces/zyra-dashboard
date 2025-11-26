'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { LogOut, User, Shield, Key, Lock } from 'lucide-react';
import { toast } from 'react-toastify';

export default function DashboardPage() {
  const { user, signOut, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log out');
    }
  };

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
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
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
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-2 text-gray-900">
                Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}! 👋
              </h2>
              <p className="text-gray-500">
                You&apos;re now logged into your Zyra Spaces dashboard.
              </p>
            </div>

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
