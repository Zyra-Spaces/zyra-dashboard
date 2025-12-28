import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { ideaId, makePublic } = await request.json();

    if (!ideaId) {
      return NextResponse.json(
        { error: 'Idea ID is required' },
        { status: 400 }
      );
    }

    // Check if user owns the idea
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('id, user_id, share_token')
      .eq('id', ideaId)
      .single();

    if (ideaError || !idea || idea.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Idea not found or access denied' },
        { status: 403 }
      );
    }

    // Update idea to be public and generate share token if needed
    const updates: any = { is_public: makePublic };
    
    if (makePublic && !idea.share_token) {
      // Generate a unique share token
      const shareToken = Buffer.from(`${ideaId}-${Date.now()}`).toString('base64url');
      updates.share_token = shareToken;
    }

    const { data: updatedIdea, error: updateError } = await supabase
      .from('ideas')
      .update(updates)
      .eq('id', ideaId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/ideas/${updatedIdea.share_token}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(updatedIdea.formatted_idea?.title || 'Check out this idea!')}&url=${encodeURIComponent(shareUrl)}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      twitterUrl,
      shareToken: updatedIdea.share_token,
    });
  } catch (error: any) {
    console.error('Error sharing idea:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to share idea' },
      { status: 500 }
    );
  }
}

















