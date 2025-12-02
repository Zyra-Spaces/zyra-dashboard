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
    try {
      const { error: emailError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: false, // Don't create user, just send email
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/ideator?invite=${collaboration.id}`,
          data: {
            invitation_type: 'idea_collaboration',
            idea_id: ideaId,
            collaboration_id: collaboration.id,
            inviter_name: user.user_metadata?.firstName || user.email?.split('@')[0] || 'Someone',
          },
        },
      });

      if (emailError) {
        console.error('Email sending error:', emailError);
        // Still return success for collaboration creation, but log the email error
        // The collaboration is created, email might fail but user can still be manually added
        return NextResponse.json({
          success: true,
          collaboration,
          message: 'Collaboration created. Note: Email sending may have failed. Please check your Supabase email configuration.',
          emailError: emailError.message,
        });
      }
    } catch (emailErr: any) {
      console.error('Email sending exception:', emailErr);
      // Collaboration is still created, just email failed
      return NextResponse.json({
        success: true,
        collaboration,
        message: 'Collaboration created. Email sending failed - please check Supabase email configuration.',
        emailError: emailErr.message,
      });
    }

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









