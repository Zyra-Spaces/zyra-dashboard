'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { InlineNotification, notify } from '@/components/ui/inline-notification';
import { getUserIdeas, getIdeaById, type Idea } from '@/lib/supabase/ideas';
import { EnhancedIdeaDetail } from '@/components/ideator/enhanced-idea-detail';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function IdeaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const ideaId = params.id as string;

  useEffect(() => {
    if (ideaId) {
      loadIdea();
    }
  }, [ideaId]);

  const loadIdea = async () => {
    try {
      setIsLoading(true);
      // Try to get by ID first, if not found, load all and find it
      let foundIdea: Idea | null = null;
      try {
        foundIdea = await getIdeaById(ideaId);
      } catch (error) {
        // If getIdeaById doesn't exist or fails, load all ideas
        const ideas = await getUserIdeas();
        foundIdea = ideas.find(i => i.id === ideaId) || null;
      }

      if (!foundIdea) {
        notify.error('Idea not found');
        router.push('/ideator');
        return;
      }

      setIdea(foundIdea);
    } catch (error: any) {
      console.error('Error loading idea:', error);
      notify.error('Failed to load idea');
      router.push('/ideator');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;
    
    try {
      const { deleteIdea } = await import('@/lib/supabase/ideas');
      await deleteIdea(id);
      notify.success('Idea deleted');
      router.push('/ideator');
    } catch (error: any) {
      console.error('Error deleting idea:', error);
      notify.error('Failed to delete idea');
    }
  };

  const handleRefine = async (refinePrompt: string) => {
    if (!idea) return;
    if (!refinePrompt.trim()) {
      notify.error('Please enter a refinement prompt');
      return;
    }

    try {
      // Generate refined idea
      const response = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: refinePrompt.trim(),
          context: `User wants to refine this idea: ${idea.idea.substring(0, 500)}...\n\nRefinement request: ${refinePrompt}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refine idea');
      }

      // Parse and save the refined idea
      const { saveIdea } = await import('@/lib/supabase/ideas');
      const parseIdea = (text: string) => {
        const parsed: any = {};
        const titleMatch = text.match(/\*\*Title:\*\*\s*(.+?)(?:\n|$)/i) || text.match(/^(.+?)(?:\n|$)/);
        if (titleMatch) parsed.title = titleMatch[1].trim();
        const descMatch = text.match(/\*\*Description:\*\*\s*([\s\S]+?)(?:\n\n|\*\*)/i);
        if (descMatch) parsed.description = descMatch[1].trim();
        const featuresMatch = text.match(/\*\*Key Features[^:]*:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/i);
        if (featuresMatch) {
          parsed.features = featuresMatch[1]
            .split(/\n[-•*]\s*/)
            .filter(f => f.trim().length > 0)
            .map(f => f.trim().replace(/^[-•*]\s*/, ''));
        }
        const useCasesMatch = text.match(/\*\*Potential Use Cases[^:]*:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/i);
        if (useCasesMatch) {
          parsed.useCases = useCasesMatch[1]
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

      const formattedIdea = parseIdea(data.idea);
      const NOTE_COLORS = [
        { name: 'yellow' }, { name: 'pink' }, { name: 'blue' },
        { name: 'green' }, { name: 'purple' }, { name: 'orange' },
      ];
      const color = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];

      const newIdea = await saveIdea({
        prompt: refinePrompt.trim(),
        idea: data.idea,
        formatted_idea: formattedIdea,
        context: refinePrompt,
        color: color.name,
      });

      notify.success('Idea refined and saved!');
      router.push(`/ideator/idea/${newIdea.id}`);
    } catch (error: any) {
      console.error('Error refining idea:', error);
      notify.error(error.message || 'Failed to refine idea');
    }
  };

  const handleConvertToProject = () => {
    if (!idea) return;
    router.push(`/ideator?convert=${idea.id}`);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#4780C6]" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!idea) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Idea not found</p>
            <Link href="/ideator" className="text-[#4780C6] hover:underline">
              Back to Ideator
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <InlineNotification className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-md" />
        
        {/* Header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <Link
                href="/ideator"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Ideator</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Full Page Idea Detail */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <EnhancedIdeaDetail
              idea={idea}
              onClose={() => router.push('/ideator')}
              onDelete={handleDelete}
              onRefine={handleRefine}
              onConvertToProject={handleConvertToProject}
              isRefining={false}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

