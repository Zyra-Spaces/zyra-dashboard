import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadImage } from '@/lib/supabase/storage';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ideaId = formData.get('ideaId') as string;

    if (!file || !ideaId) {
      return NextResponse.json(
        { error: 'File and idea ID are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
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

    // Upload image to storage
    const coverPath = `ideas/${ideaId}/cover.jpg`;
    const imageUrl = await uploadImage(file, coverPath);

    // Update idea with cover image
    const { data: updatedIdea, error: updateError } = await supabase
      .from('ideas')
      .update({
        cover_image_url: imageUrl,
        cover_image_type: 'uploaded',
      })
      .eq('id', ideaId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      coverImageUrl: imageUrl,
      idea: updatedIdea,
    });
  } catch (error: any) {
    console.error('Error uploading cover:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload cover' },
      { status: 500 }
    );
  }
}














