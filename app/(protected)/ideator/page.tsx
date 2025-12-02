'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/hooks/use-profile';
import { InlineNotification, notify } from '@/components/ui/inline-notification';
import { saveIdea, getUserIdeas, deleteIdea, getIdeaCount, type Idea } from '@/lib/supabase/ideas';
import { saveProject } from '@/lib/supabase/projects';
import { extractErrorInfo, getErrorDebugInfo } from '@/lib/utils/error-extractor';
import { EnhancedIdeaDetail } from '@/components/ideator/enhanced-idea-detail';
import { AnimatedIdeaCard } from '@/components/ideator/animated-idea-card';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Lightbulb, 
  Copy,
  Check,
  Zap,
  Rocket,
  X,
  Edit3,
  Trash2,
  Home,
  Briefcase,
  Settings,
  Bell,
  Search,
  MoreVertical,
  CheckCircle2,
  Pin
} from 'lucide-react';

const DEFAULT_CONTEXT = `You are helping a user generate innovative project ideas. The user wants creative, feasible, and well-structured project concepts that can be turned into real products or services. Focus on practical solutions with clear value propositions.`;

// Color palette for pinned notes
const NOTE_COLORS = [
  { name: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', accent: 'bg-yellow-100' },
  { name: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900', accent: 'bg-pink-100' },
  { name: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', accent: 'bg-blue-100' },
  { name: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', accent: 'bg-green-100' },
  { name: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', accent: 'bg-purple-100' },
  { name: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', accent: 'bg-orange-100' },
];

function getRandomColor() {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
}

export default function IdeatorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [ideaCount, setIdeaCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingText, setGeneratingText] = useState('');

  const displayName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.firstName || profile?.lastName || user?.email?.split('@')[0] || 'User';

  // Load ideas from Supabase
  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    try {
      setIsLoading(true);
      const userIdeas = await getUserIdeas();
      setIdeas(userIdeas);
      const count = await getIdeaCount();
      setIdeaCount(count);
    } catch (error: any) {
      // Extract error information using utility
      const errorInfo = extractErrorInfo(error);
      const debugInfo = getErrorDebugInfo(error);
      
      console.error('Error loading ideas:', {
        ...errorInfo,
        ...debugInfo,
      });
      
      // Provide helpful error message
      if (errorInfo.code === 'PGRST116' || errorInfo.message.includes('relation') || errorInfo.message.includes('does not exist')) {
        notify.error('Database table not found. Please run the SQL setup script in Supabase.');
      } else if (errorInfo.code === '42501' || errorInfo.message.includes('permission denied') || errorInfo.message.includes('policy')) {
        notify.error('Permission denied. Please check Row Level Security policies in Supabase.');
      } else {
        notify.error(errorInfo.message || 'Failed to load ideas. Please check if the database tables are set up correctly.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get context from previous chat history
  const getContext = useMemo(() => {
    if (ideas.length === 0) {
      return DEFAULT_CONTEXT;
    }
    const recentIdeas = ideas.slice(0, 3);
    const contextParts = recentIdeas.map(idea => 
      `Previous idea: ${idea.prompt} - ${idea.idea.substring(0, 200)}...`
    );
    return `${DEFAULT_CONTEXT}\n\nRecent conversation context:\n${contextParts.join('\n\n')}`;
  }, [ideas]);

  // Parse idea text into structured format
  const parseIdea = (text: string) => {
    const parsed: any = {};
    
    const titleMatch = text.match(/\*\*Title:\*\*\s*(.+?)(?:\n|$)/i) || text.match(/^(.+?)(?:\n|$)/);
    if (titleMatch) parsed.title = titleMatch[1].trim();
    
    const descMatch = text.match(/\*\*Description:\*\*\s*([\s\S]+?)(?:\n\n|\*\*)/i);
    if (descMatch) parsed.description = descMatch[1].trim();
    
    const featuresMatch = text.match(/\*\*Key Features[^:]*:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/i);
    if (featuresMatch) {
      const featuresText = featuresMatch[1];
      parsed.features = featuresText
        .split(/\n[-•*]\s*/)
        .filter(f => f.trim().length > 0)
        .map(f => f.trim().replace(/^[-•*]\s*/, ''));
    }
    
    const useCasesMatch = text.match(/\*\*Potential Use Cases[^:]*:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/i);
    if (useCasesMatch) {
      const useCasesText = useCasesMatch[1];
      parsed.useCases = useCasesText
        .split(/\n[-•*]\s*/)
        .filter(u => u.trim().length > 0)
        .map(u => u.trim().replace(/^[-•*]\s*/, ''));
    }
    
    const tagsMatch = text.match(/\*\*Suggested Tags[^:]*:\*\*\s*(.+?)(?:\n\n|$)/i);
    if (tagsMatch) {
      parsed.tags = tagsMatch[1]
        .split(/[,•]/)
        .map(t => t.trim())
        .filter(t => t.length > 0);
    }
    
    return parsed;
  };

  const handleGenerate = async (refineIdea?: Idea) => {
    const currentPrompt = refineIdea ? refinePrompt : prompt;
    if (!currentPrompt.trim()) {
      notify.error('Please enter a prompt to generate an idea');
      return;
    }

    setIsGenerating(true);
    setGeneratingText(''); // Reset generating text
    try {
      const context = refineIdea 
        ? `${getContext}\n\nUser wants to refine this idea: ${refineIdea.idea.substring(0, 500)}...\n\nRefinement request: ${refinePrompt}`
        : getContext;

      const response = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: currentPrompt.trim(), 
          context: context 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = data.retryAfter;
          throw new Error(
            retryAfter 
              ? `Rate limit exceeded. Please wait ${Math.ceil(retryAfter)} seconds before trying again.`
              : data.error || 'Rate limit exceeded. Please try again later.'
          );
        }
        throw new Error(data.error || 'Failed to generate idea');
      }

      // Set the generated text for the animated card
      setGeneratingText(data.idea);

      const formattedIdea = parseIdea(data.idea);
      const color = getRandomColor();
      
      try {
        const newIdea = await saveIdea({
          prompt: currentPrompt.trim(),
          idea: data.idea,
          formatted_idea: formattedIdea,
          context: refineIdea ? refinePrompt : undefined,
          color: color.name,
        });

        await loadIdeas();
        setPrompt('');
        setRefinePrompt('');
        
        // If refining, select the new refined idea; otherwise close modal
        if (refineIdea) {
          // Find and select the newly created refined idea
          const updatedIdeas = await getUserIdeas();
          const newRefinedIdea = updatedIdeas.find(i => 
            i.prompt === currentPrompt.trim() && 
            i.created_at > new Date(Date.now() - 5000).toISOString()
          );
          if (newRefinedIdea) {
            setSelectedIdea(newRefinedIdea);
            notify.success('Idea refined and saved!');
          } else {
            setSelectedIdea(null);
            notify.success('Idea refined and saved!');
          }
        } else {
          setSelectedIdea(null);
          notify.success('Idea generated and saved!');
        }
      } catch (saveError: any) {
        // Error saving to database - extract properly
        const errorInfo = extractErrorInfo(saveError);
        const debugInfo = getErrorDebugInfo(saveError);
        
        console.error('Error saving idea to database:', {
          ...errorInfo,
          ...debugInfo,
        });
        
        if (errorInfo.code === 'PGRST116' || errorInfo.message.includes('relation') || errorInfo.message.includes('does not exist')) {
          notify.error('Database table not found. Please run the SQL setup script in Supabase.');
        } else if (errorInfo.code === '42501' || errorInfo.message.includes('permission denied') || errorInfo.message.includes('policy')) {
          notify.error('Permission denied. Please check Row Level Security policies in Supabase.');
        } else if (errorInfo.code === '42P17' || errorInfo.message.includes('infinite recursion')) {
          notify.error('Database policy error. Please run the updated SQL script to fix RLS policies.');
        } else {
          notify.error(errorInfo.message || 'Failed to save idea. The idea was generated but could not be saved.');
        }
        throw saveError; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      // Error from API call or saving - extract properly
      const errorInfo = extractErrorInfo(error);
      const debugInfo = getErrorDebugInfo(error);
      
      console.error('Error generating idea:', {
        ...errorInfo,
        ...debugInfo,
      });
      
      // Provide more helpful error messages
      if (errorInfo.code === 'PGRST116' || errorInfo.message.includes('relation') || errorInfo.message.includes('does not exist')) {
        notify.error('Database table not found. Please run the SQL setup script in Supabase.');
      } else if (errorInfo.code === '42501' || errorInfo.message.includes('permission denied') || errorInfo.message.includes('policy')) {
        notify.error('Permission denied. Please check Row Level Security policies in Supabase.');
      } else if (errorInfo.code === '42P17' || errorInfo.message.includes('infinite recursion')) {
        notify.error('Database policy error. Please run the updated SQL script to fix RLS policies.');
      } else {
        notify.error(errorInfo.message || 'Failed to generate idea. Please try again.');
      }
    } finally {
      // Keep the text visible for a moment after generation completes
      setTimeout(() => {
        setIsGenerating(false);
        // Clear generating text after animation completes
        setTimeout(() => setGeneratingText(''), 1000);
      }, 500);
    }
  };

  const handleRefine = (refinePrompt: string) => {
    if (!selectedIdea) return;
    if (!refinePrompt.trim()) {
      notify.error('Please enter a refinement prompt');
      return;
    }
    setRefinePrompt(refinePrompt);
    handleGenerate(selectedIdea);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;
    
    try {
      await deleteIdea(id);
      await loadIdeas();
      if (selectedIdea?.id === id) {
        setSelectedIdea(null);
      }
      notify.success('Idea deleted');
    } catch (error: any) {
      console.error('Error deleting idea:', error);
      notify.error('Failed to delete idea');
    }
  };

  const handleCopy = async (idea: string, id: string) => {
    try {
      await navigator.clipboard.writeText(idea);
      setCopiedId(id);
      notify.success('Idea copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      notify.error('Failed to copy idea');
    }
  };

  const handleConvertToProject = () => {
    if (!selectedIdea) return;
    setShowProjectModal(true);
  };

  const handleCreateProject = async (title: string, description: string, isPublic: boolean) => {
    try {
      await saveProject({
        title: title || selectedIdea?.formatted_idea?.title || 'New Project',
        description: description || selectedIdea?.formatted_idea?.description || selectedIdea?.idea,
        source_idea_id: selectedIdea?.id,
        status: 'active',
        is_public: isPublic,
      });
      
      notify.success('Project created successfully!');
      setShowProjectModal(false);
      setSelectedIdea(null);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Error creating project:', error);
      notify.error(error.message || 'Failed to create project');
    }
  };

  const getColorClass = (colorName?: string | null) => {
    const color = NOTE_COLORS.find(c => c.name === colorName) || getRandomColor();
    return color;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <InlineNotification className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-md" />
        
        {/* Top Header - Same as Dashboard */}
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
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
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
                    className="flex items-center gap-2 text-sm font-medium text-[#4780C6] hover:text-[#4780C6]/80 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    ideator
                    {ideaCount > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{ideaCount}</span>
                    )}
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
        <div className="max-w-[1920px] mx-auto px-6 py-6 h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
          <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
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
                    <span className="font-semibold text-gray-900">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Teams</span>
                    <span className="font-semibold text-gray-900">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ideas</span>
                    <span className="font-semibold text-gray-900">{ideaCount}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Center Content - Skeleton Card + Input */}
            <main className="col-span-6 flex flex-col min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#4780C6]" />
                </div>
              ) : (
                <>
                  {/* Empty State or Welcome Message */}
                  {ideas.length === 0 && !isGenerating && (
                    <div className="text-center py-12 bg-white border border-gray-200 rounded-xl mb-6">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#4780C6]/20 to-purple-500/20 rounded-full mb-6">
                        <Lightbulb className="w-10 h-10 text-[#4780C6]" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Ideator</h2>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Get started by describing what you&apos;re looking for, and our AI will help you create innovative project ideas.
                      </p>
                    </div>
                  )}

                  {/* Animated Idea Skeleton Card - Above Input */}
                  <AnimatedIdeaCard 
                    isGenerating={isGenerating} 
                    generatedText={generatingText}
                  />

                  {/* Input Area - Fixed at bottom */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 flex-shrink-0 mt-auto">
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-xs text-gray-500">Context managed automatically from your conversation history</span>
                  <span className="text-xs text-gray-400">{prompt.length}/3000</span>
                </div>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      if (e.target.value.length <= 3000) setPrompt(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    placeholder="Ask Anything... Describe what kind of project idea you're looking for"
                    className="w-full px-4 py-3 pr-12 border-2 border-[#4780C6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6]/20 resize-none text-sm"
                    rows={3}
                  />
                  <button
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || !prompt.trim()}
                    className="absolute bottom-3 right-3 p-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 px-2">
                  Press <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Ctrl/Cmd + Enter</kbd> to generate
                </p>
              </div>
                </>
              )}
            </main>

            {/* Right Sidebar - All Idea Cards */}
            <aside className="col-span-3 flex flex-col min-h-0 space-y-6">
              {/* Recent Ideas List with Cards */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Your Ideas</h3>
                  <span className="text-xs text-gray-500">{ideaCount} {ideaCount === 1 ? 'idea' : 'ideas'}</span>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {ideas.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No ideas yet. Start generating!</p>
                  ) : (
                    <>
                      {ideas.map((idea) => {
                        const colorClass = getColorClass(idea.color);
                        return (
                          <div
                            key={idea.id}
                            onClick={() => setSelectedIdea(idea)}
                            className={`${colorClass.bg} ${colorClass.border} border-2 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all relative ${
                              selectedIdea?.id === idea.id ? 'ring-2 ring-[#4780C6] ring-offset-2' : ''
                            }`}
                          >
                            <div className="absolute top-2 right-2">
                              <Pin className={`w-3.5 h-3.5 ${colorClass.text} opacity-50`} />
                            </div>
                            <h4 className={`font-bold text-base mb-2 ${colorClass.text} line-clamp-2`}>
                              {idea.formatted_idea?.title || idea.prompt.substring(0, 50) + '...'}
                            </h4>
                            <p className={`text-xs mb-3 ${colorClass.text} opacity-80 line-clamp-2`}>
                              {idea.formatted_idea?.description || idea.idea.substring(0, 100) + '...'}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${colorClass.text} opacity-60`}>
                                {new Date(idea.created_at).toLocaleDateString()}
                              </span>
                              {idea.formatted_idea?.tags && idea.formatted_idea.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {idea.formatted_idea.tags.slice(0, 2).map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className={`px-2 py-0.5 ${colorClass.accent} ${colorClass.text} rounded text-xs font-medium`}
                                    >
                                      {tag.substring(0, 8)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {ideas.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <button
                            onClick={() => {
                              // Scroll to top or could navigate to a dedicated ideas page
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-[#4780C6] to-blue-600 text-white rounded-lg hover:from-[#4780C6]/90 hover:to-blue-600/90 transition-all text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            View All Ideas
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Idea Detail Overlay Modal */}
        {selectedIdea && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setSelectedIdea(null)}
          >
            <div 
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col" 
              onClick={(e) => e.stopPropagation()}
            >
              <EnhancedIdeaDetail
                idea={selectedIdea}
                onClose={() => {
                  setSelectedIdea(null);
                  setRefinePrompt('');
                }}
                onDelete={handleDelete}
                onRefine={handleRefine}
                onConvertToProject={handleConvertToProject}
                isRefining={isGenerating && !!refinePrompt}
              />
            </div>
          </div>
        )}

        {/* Project Creation Modal */}
        {showProjectModal && selectedIdea && (
          <ProjectModal
            idea={selectedIdea}
            onClose={() => setShowProjectModal(false)}
            onCreate={handleCreateProject}
          />
        )}

      </div>
    </ProtectedRoute>
  );
}

// Project Creation Modal Component
function ProjectModal({ 
  idea, 
  onClose, 
  onCreate 
}: { 
  idea: Idea; 
  onClose: () => void; 
  onCreate: (title: string, description: string, isPublic: boolean) => void;
}) {
  const [title, setTitle] = useState(idea.formatted_idea?.title || '');
  const [description, setDescription] = useState(idea.formatted_idea?.description || idea.idea.substring(0, 500));
  const [isPublic, setIsPublic] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Convert to Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project title"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent resize-none"
            />
          </div>

          <div className="space-y-4">
            {/* Privacy Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={isPublic}
                    onChange={() => setIsPublic(true)}
                    className="w-4 h-4 text-[#4780C6] focus:ring-[#4780C6]"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Public</div>
                    <div className="text-xs text-gray-500">Anyone can view this project</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                    className="w-4 h-4 text-[#4780C6] focus:ring-[#4780C6]"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Private</div>
                    <div className="text-xs text-gray-500">Only you and invited collaborators can access</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => onCreate(title, description, isPublic)}
                disabled={!title.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Rocket className="w-4 h-4" />
                Create Project
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
