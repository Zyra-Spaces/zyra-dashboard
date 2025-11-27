# Supabase Storage Setup Guide

## Fixing "new row violates row-level security policy" Error

This error occurs because your Supabase Storage bucket has RLS (Row Level Security) enabled but no policies allowing uploads.

## Option 1: Make Bucket Public (Easiest - Recommended for Avatars)

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage**
3. Click on the **`avatars`** bucket (or create it if it doesn't exist)
4. Click the **"Make Public"** button
5. This allows authenticated users to upload, update, and delete files

**Note:** This is fine for profile pictures and banners since they're meant to be publicly viewable.

## Option 2: Set Up RLS Policies (More Secure)

If you prefer to keep RLS enabled, follow these steps:

1. Go to **Supabase Dashboard > Storage > Policies**
2. Select the **`avatars`** bucket
3. Click **"New Policy"** and create these 4 policies:

### Policy 1: Allow INSERT (Upload)
- **Policy name:** "Users can upload to own folder"
- **Allowed operation:** `INSERT`
- **Policy definition:**
```sql
(bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])
```

### Policy 2: Allow UPDATE
- **Policy name:** "Users can update own files"
- **Allowed operation:** `UPDATE`
- **Policy definition:**
```sql
(bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])
```

### Policy 3: Allow DELETE
- **Policy name:** "Users can delete own files"
- **Allowed operation:** `DELETE`
- **Policy definition:**
```sql
(bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])
```

### Policy 4: Allow SELECT (Public Read)
- **Policy name:** "Public read access"
- **Allowed operation:** `SELECT`
- **Policy definition:**
```sql
bucket_id = 'avatars'::text
```

## File Structure

Files are stored in user-specific folders:
- Profile pictures: `{userId}/profile.jpg`
- Banner pictures: `{userId}/banner.jpg`

This structure ensures users can only access their own files when using RLS policies.

