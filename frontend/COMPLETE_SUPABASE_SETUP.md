# Complete Supabase Setup Guide for PaperParser

## 🚀 Step-by-Step Setup Instructions

### Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Sign up/Sign in with GitHub

2. **Create New Project**
   - Click "New project"
   - Choose your organization
   - Project name: `paperparser`
   - Database password: Create a strong password (save it!)
   - Region: Choose closest to your users
   - Click "Create new project"

### Step 2: Get Project Credentials

1. **Get Project URL and Keys**
   - Go to Project Settings (gear icon)
   - Navigate to "API" tab
   - Copy the following:
     - Project URL
     - `anon` `public` key
     - `service_role` `secret` key

### Step 3: Set Up Database Schema

1. **Open SQL Editor**
   - Go to SQL Editor in Supabase dashboard
   - Create a new query

2. **Run the Database Setup Script**
   - Copy the entire content from `supabase-setup.sql`
   - Paste it in the SQL Editor
   - Click "Run" to execute

### Step 4: Create Storage Buckets

1. **Go to Storage**
   - Navigate to Storage in the sidebar
   - Create two buckets:

2. **Create "uploads" bucket**
   - Click "New bucket"
   - Name: `uploads`
   - Public bucket: ✅ Yes
   - Click "Create bucket"

3. **Create "processed-files" bucket**
   - Click "New bucket"
   - Name: `processed-files`
   - Public bucket: ✅ Yes
   - Click "Create bucket"

### Step 5: Configure Google OAuth

1. **Enable Google Provider**
   - Go to Authentication → Providers
   - Find Google and click "Enable"

2. **Set up Google OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
   - Application type: Web application
   - Authorized redirect URIs:
     \`\`\`
     https://your-project-id.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     \`\`\`
   - Copy Client ID and Client Secret

3. **Add Credentials to Supabase**
   - Back in Supabase, paste:
     - Client ID
     - Client Secret
   - Click "Save"

### Step 6: Set Up Backend Environment

1. **Create Backend .env File**
   \`\`\`bash
   cd backend
   touch .env
   \`\`\`

2. **Add Environment Variables**
   \`\`\`env
   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   \`\`\`

3. **Install Backend Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

### Step 7: Set Up Frontend Environment

1. **Create Frontend .env.local File**
   \`\`\`bash
   cd frontend  # or your Next.js project root
   touch .env.local
   \`\`\`

2. **Add Environment Variables**
   \`\`\`env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   
   # Backend API URL
   NEXT_PUBLIC_API_URL=http://localhost:5000
   \`\`\`

### Step 8: Install Frontend Dependencies

\`\`\`bash
npm install @supabase/supabase-js
\`\`\`

### Step 9: Test the Setup

1. **Start Backend Server**
   \`\`\`bash
   cd backend
   npm run dev
   \`\`\`

2. **Start Frontend Server**
   \`\`\`bash
   cd frontend
   npm run dev
   \`\`\`

3. **Test Authentication**
   - Go to `http://localhost:3000`
   - Try signing in with Google
   - Check if user appears in Supabase Auth dashboard

4. **Test File Upload**
   - Upload a PDF file
   - Check if it appears in Storage → uploads bucket
   - Check if generation record appears in Database → generations table

### Step 10: Verify Database Structure

In Supabase SQL Editor, run these queries to verify setup:

\`\`\`sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check generations table structure
\d generations;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Test user profile creation
SELECT * FROM user_profiles LIMIT 5;
\`\`\`

## 🗂️ Database Schema Overview

### Tables Created:

1. **`generations`** - Stores all generation requests and results
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `type` (enum: podcast, presentation, etc.)
   - `title`, `original_file_name`, `original_file_url`
   - `download_url`, `status`, `settings`
   - `duration`, `slides`, `file_size`
   - `created_at`, `updated_at`

2. **`user_profiles`** - Extended user information
   - `id` (UUID, Primary Key, Foreign Key to auth.users)
   - `full_name`, `avatar_url`
   - `subscription_tier`, `total_generations`
   - `storage_used`, `created_at`, `updated_at`

3. **`usage_stats`** - Daily usage tracking
   - `user_id`, `date`, `generations_count`
   - `storage_used`, `created_at`

### Storage Buckets:

1. **`uploads`** - Original PDF files
2. **`processed-files`** - Generated podcasts, presentations, etc.

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **User isolation** - Users can only access their own data
- **Storage policies** - Users can only access their own files
- **Service role access** for backend operations

## 🚀 Backend API Endpoints

- `POST /api/upload` - Upload and process files
- `GET /api/generation/:id` - Get generation status
- `GET /api/user/:userId/generations` - Get user's generations
- `DELETE /api/generation/:id` - Delete generation
- `GET /api/health` - Health check

## 📊 Features Included

- ✅ User authentication with Google OAuth
- ✅ File upload to Supabase Storage
- ✅ Database storage for all generations
- ✅ Real-time status tracking
- ✅ User profiles and statistics
- ✅ File cleanup and management
- ✅ Error handling and logging
- ✅ Usage analytics
- ✅ Secure file access

## 🔧 Troubleshooting

### Common Issues:

1. **"Invalid URL" Error**
   - Check environment variables are set correctly
   - Restart both frontend and backend servers

2. **Authentication Not Working**
   - Verify Google OAuth credentials
   - Check redirect URLs match exactly

3. **File Upload Fails**
   - Check storage buckets exist and are public
   - Verify storage policies are set correctly

4. **Database Connection Issues**
   - Verify service role key is correct
   - Check if RLS policies allow access

### Debug Commands:

\`\`\`bash
# Check backend health
curl http://localhost:5000/api/health

# Check environment variables
echo $SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_URL
\`\`\`

## 🎯 Next Steps

1. **Deploy to Production**
   - Set up production Supabase project
   - Deploy backend to Railway/Heroku/Vercel
   - Deploy frontend to Vercel

2. **Add Monitoring**
   - Set up error tracking (Sentry)
   - Add performance monitoring
   - Set up backup strategies

3. **Scale Features**
   - Add subscription tiers
   - Implement usage limits
   - Add more file formats

Your PaperParser application is now fully integrated with Supabase! 🎉
