import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inviteCollaborator } from '@/lib/supabase/collaborations';

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

    const { ideaId, email, role } = await request.json();

    if (!ideaId || !email) {
      return NextResponse.json(
        { error: 'Idea ID and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user owns the idea
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('id, user_id')
      .eq('id', ideaId)
      .single();

    if (ideaError || !idea || idea.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Idea not found or access denied' },
        { status: 403 }
      );
    }

    // Create collaboration (using server client and user ID)
    const collaboration = await inviteCollaborator(ideaId, email, role || 'collaborator', supabase, user.id);

    // Send invitation email (using Supabase's signInWithOtp as magic link)
    // In production, you might want to use a dedicated email service
    const { error: emailError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/ideator?invite=${collaboration.id}`,
        data: {
          invitation_type: 'idea_collaboration',
          idea_id: ideaId,
          collaboration_id: collaboration.id,
          inviter_name: user.user_metadata?.firstName || user.email?.split('@')[0] || 'Someone',
        },
      },
    });

    // Note: signInWithOtp will send an email, but if the user doesn't exist, it will create an account
    // For existing users, they'll get a magic link to accept the invitation

    return NextResponse.json({
      success: true,
      collaboration,
      message: 'Invitation sent successfully',
    });
  } catch (error: any) {
    console.error('Error inviting collaborator:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
}









