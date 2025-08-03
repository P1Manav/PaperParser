# Supabase Setup Guide for PaperParser

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Click "Start your project"
3. Sign up/Sign in with GitHub
4. Click "New project"
5. Choose your organization
6. Enter project name: `paperparser`
7. Enter a strong database password
8. Choose a region close to your users
9. Click "Create new project"

## Step 2: Get Project Configuration

1. Go to Project Settings (gear icon)
2. Go to "API" tab
3. Copy the "Project URL" and "anon public" key
4. Update your `.env.local` file:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000
\`\`\`

## Step 3: Enable Google Authentication

1. Go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `https://your-project-id.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)
4. Copy Client ID and Client Secret to Supabase

## Step 4: Create Database Tables

Run this SQL in the Supabase SQL Editor:

\`\`\`sql
-- Create generations table
CREATE TABLE generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('podcast', 'presentation')),
  title TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  original_file_url TEXT,
  download_url TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  settings JSONB,
  duration TEXT,
  slides INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own generations
CREATE POLICY "Users can view own generations" ON generations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own generations
CREATE POLICY "Users can insert own generations" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own generations
CREATE POLICY "Users can update own generations" ON generations
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own generations
CREATE POLICY "Users can delete own generations" ON generations
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_generations_updated_at
  BEFORE UPDATE ON generations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
\`\`\`

## Step 5: Create Storage Buckets

1. Go to Storage in Supabase dashboard
2. Create a new bucket called `uploads`
3. Make it public (for easier access)
4. Set up RLS policies:

\`\`\`sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to view their own files
CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
\`\`\`

## Step 6: Install Supabase Client

\`\`\`bash
npm install @supabase/supabase-js
\`\`\`

## Step 7: Test the Setup

1. Start your Next.js development server
2. Try signing in with Google
3. Upload a PDF file
4. Check Supabase dashboard to see if data is being stored

## Supabase vs Firebase Comparison

| Feature | Supabase | Firebase |
|---------|----------|----------|
| Database | PostgreSQL (SQL) | Firestore (NoSQL) |
| Storage | 1GB free | 1GB free (but paid after) |
| Authentication | Built-in | Built-in |
| Real-time | Built-in | Built-in |
| Pricing | More generous free tier | Limited free tier |
| Learning curve | SQL knowledge helpful | Easier for beginners |

## Benefits of Supabase for PaperParser:

1. **Cost-effective**: More generous free tier
2. **SQL Database**: Better for complex queries
3. **Real-time**: Built-in real-time subscriptions
4. **Open Source**: Self-hostable if needed
5. **Storage**: 1GB free storage vs Firebase's paid storage
6. **Row Level Security**: Built-in security policies
