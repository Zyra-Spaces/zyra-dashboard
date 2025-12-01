'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/hooks/use-profile';
import { getUserProjects, getTrendingProjects, type Project } from '@/lib/supabase/projects';
import { 
  Home, 
  Briefcase, 
  Settings, 
  Bell, 
  Zap, 
  Search, 
  MoreVertical,
  FileText,
  ExternalLink,
  Star,
  MessageCircle,
  Eye,
  Share2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [projects, setProjects] = useState<Project[]>([]);
  const [trendingProjects, setTrendingProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoadingProjects(true);
        const [userProjects, trending] = await Promise.all([
          getUserProjects(),
          getTrendingProjects(10),
        ]);
        setProjects(userProjects);
        setTrendingProjects(trending);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    if (user) {
      loadProjects();
    }
  }, [user]);

  const displayName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.firstName || profile?.lastName || user?.email?.split('@')[0] || 'User';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* Top Header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-[1920px] mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Left: Logo + Navigation */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#4780C6] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Z</span>
                  </div>
                  <span className="text-xl font-semibold text-gray-900">Zyra</span>
                </div>
                
                <nav className="flex items-center gap-6">
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-2 text-sm font-medium text-[#4780C6] hover:text-[#4780C6]/80 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                  <Link 
                    href="/workspaces" 
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Briefcase className="w-4 h-4" />
                    Workspaces
                  </Link>
                  <Link 
                    href="/ideator" 
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    ideator
                    <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">10</span>
                  </Link>
                </nav>
              </div>

              {/* Right: Actions + Profile */}
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  Upgrade now
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <Link href="/profile" className="flex items-center">
                  {profile?.profilePic ? (
                    <img 
                      src={profile.profilePic} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:border-[#4780C6] transition-colors"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold cursor-pointer hover:ring-2 hover:ring-[#4780C6] transition-all">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Three Column Layout */}
        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <aside className="col-span-3 space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Find the next idea"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-sm"
                />
              </div>

              {/* Featured Profile Card */}
              <div className="bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/images/banners/1.png')] opacity-10 bg-cover bg-center"></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <Link href="/profile" className="flex items-center gap-3 group">
                      {profile?.profilePic ? (
                        <div className="relative">
                          <img 
                            src={profile.profilePic} 
                            alt="Profile" 
                            className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg group-hover:ring-2 group-hover:ring-[#4780C6] transition-all"
                          />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-xl border-4 border-white shadow-lg group-hover:ring-2 group-hover:ring-[#4780C6] transition-all">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#4780C6] transition-colors">{displayName}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs font-medium text-purple-600">Premium</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                  <p className="text-sm text-gray-700 mb-4 italic">Perfect Dreamers Don&apos;t Sleep</p>
                  <div className="flex items-center justify-end">
                    <span className="text-sm font-medium text-gray-600">2.4k Observers</span>
                  </div>
                </div>
              </div>

              {/* Your Stats */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Your Stats</h3>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Projects</span>
                    <span className="font-semibold text-gray-900">{projects.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Teams</span>
                    <span className="font-semibold text-gray-900">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ideas</span>
                    <span className="font-semibold text-gray-900">23</span>
                  </div>
                </div>
              </div>

              {/* Trending Topics */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Trending Topics</h3>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">#ai</span>
                    <span className="text-sm text-gray-500">2.4k</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">#efficiency</span>
                    <span className="text-sm text-gray-500">2.1k</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">#automation</span>
                    <span className="text-sm text-gray-500">1k</span>
                  </div>
                </div>
                <button className="w-full text-sm text-[#4780C6] hover:text-[#4780C6]/80 font-medium">
                  View all
                </button>
              </div>
            </aside>

            {/* Center Content */}
            <main className="col-span-6 space-y-6">
              {/* Jump Back In / Start Afresh */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="h-32 bg-gradient-to-br from-gray-400 to-gray-600 relative">
                    <img 
                      src="/images/banners/1.png" 
                      alt="Project" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Stone Proof</h4>
                    <p className="text-xs text-gray-500 mb-3">by Stone Proof Labs</p>
                    <p className="text-xs text-gray-400 mb-3">2 days ago</p>
                    <button className="flex items-center gap-2 text-sm text-[#4780C6] hover:text-[#4780C6]/80 font-medium">
                      <FileText className="w-4 h-4" />
                      Project Board
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="h-32 bg-gradient-to-br from-gray-400 to-gray-600 relative">
                    <img 
                      src="/images/banners/1.png" 
                      alt="Project" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Stone Proof</h4>
                    <p className="text-xs text-gray-500 mb-3">by Stone Proof Labs</p>
                    <p className="text-xs text-gray-400 mb-3">2 days ago</p>
                    <button className="flex items-center gap-2 text-sm text-[#4780C6] hover:text-[#4780C6]/80 font-medium">
                      <Zap className="w-4 h-4" />
                      New idea
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Project Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Crop Disease Detection</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>Bento Team</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>22 Members</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Ongoing
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  Using machine learning to help farmers identify crop diseases early and prevent yield loss through mobile app diagnostics.
                </p>

                {/* Image Previews */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Banking Dashboard</div>
                        <div className="text-xs text-gray-500">$40,206.20</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Banking Dashboard</div>
                        <div className="text-xs text-gray-500">$40,206.20</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">15th, Oct, 2025</span> – <span className="font-medium">15th, Nov, 2025</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      <FileText className="w-4 h-4" />
                      Project Board
                    </button>
                    <Link href="#" className="flex items-center gap-2 text-sm text-[#4780C6] hover:text-[#4780C6]/80 font-medium">
                      SRS Doc
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Star className="w-4 h-4" />
                        <span className="text-sm font-medium">2.3k</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">2.3k</span>
                      </div>
                    </div>
                    <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">#ai</span>
                  <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">#efficiency</span>
                  <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">#automation</span>
                </div>
              </div>

              {/* Additional Project Cards (scrollable) */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Crop Disease Detection</h2>
                <p className="text-gray-600 mb-4">
                  Using machine learning to help farmers identify crop diseases early and prevent yield loss through mobile app diagnostics.
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">#ai</span>
                  <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">#efficiency</span>
                </div>
              </div>
            </main>

            {/* Right Sidebar */}
            <aside className="col-span-3 space-y-6">
              {/* Recent Activity */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Recent activity</h3>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">Phoenix Baker</span>
                        <span className="text-xs text-gray-400">Just now</span>
                      </div>
                      <p className="text-sm text-gray-600">Added a file to Marketing site redesign.</p>
                      <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-100">
                        <FileText className="w-4 h-4 text-red-600" />
                        <div>
                          <p className="text-xs font-medium text-gray-900">Tech requirements.pdf</p>
                          <p className="text-xs text-gray-500">720 KB</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">Demi Wiki</span>
                        <span className="text-xs text-gray-400">2 mins ago</span>
                      </div>
                      <p className="text-sm text-gray-600">Invited Alisa Hester to the team.</p>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 text-sm text-[#4780C6] hover:text-[#4780C6]/80 font-medium">
                  View full activity
                </button>
              </div>

              {/* Top Projects */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Top Projects</h3>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {isLoadingProjects ? (
                    <div className="text-center py-4 text-sm text-gray-500">Loading projects...</div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-500">No projects yet</div>
                  ) : (
                    projects.slice(0, 5).map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer block"
                      >
                        <div className="h-24 bg-gradient-to-br from-gray-400 to-gray-600">
                          {project.cover_image_url ? (
                            <img 
                              src={project.cover_image_url} 
                              alt={project.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Briefcase className="w-8 h-8 text-white opacity-50" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">{project.title}</h4>
                          <p className="text-xs text-gray-500 mb-1 line-clamp-1">{project.description || 'No description'}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <button className="w-full mt-4 text-sm text-[#4780C6] hover:text-[#4780C6]/80 font-medium">
                  View more
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
