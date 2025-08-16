-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE generation_type AS ENUM ('podcast', 'presentation');
CREATE TYPE generation_status AS ENUM ('processing', 'completed', 'failed');

-- Create generations table
CREATE TABLE IF NOT EXISTS generations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type generation_type NOT NULL,
  title TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  original_file_url TEXT,
  download_url TEXT,
  status generation_status NOT NULL DEFAULT 'processing',
  settings JSONB DEFAULT '{}',
  duration TEXT,
  slides INTEGER,
  file_size BIGINT,
  error TEXT,
  script_output TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_type ON generations(type);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);

-- Create user_profiles table for additional user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  total_generations INTEGER DEFAULT 0,
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_stats table for tracking user usage
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  generations_count INTEGER DEFAULT 0,
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generations table
CREATE POLICY "Users can view own generations" ON generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations" ON generations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations" ON generations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_profiles table
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for usage_stats table
CREATE POLICY "Users can view own usage stats" ON usage_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_generations_updated_at
  BEFORE UPDATE ON generations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_profiles total_generations
  UPDATE user_profiles 
  SET total_generations = (
    SELECT COUNT(*) FROM generations WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  
  -- Update or insert usage_stats for today
  INSERT INTO usage_stats (user_id, date, generations_count)
  VALUES (NEW.user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET generations_count = usage_stats.generations_count + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update stats when generation is created
CREATE TRIGGER update_stats_on_generation
  AFTER INSERT ON generations
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Create storage buckets (run these in the Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('processed-files', 'processed-files', true);

-- Storage policies for uploads bucket
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own uploaded files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own uploaded files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for processed-files bucket
CREATE POLICY "Users can view own processed files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'processed-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Service role can manage processed files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'processed-files' AND
    auth.role() = 'service_role'
  );

-- Create views for analytics
CREATE OR REPLACE VIEW user_generation_summary AS
SELECT 
  u.id as user_id,
  up.full_name,
  up.subscription_tier,
  COUNT(g.id) as total_generations,
  COUNT(CASE WHEN g.type = 'podcast' THEN 1 END) as podcast_count,
  COUNT(CASE WHEN g.type = 'presentation' THEN 1 END) as presentation_count,
  COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN g.status = 'failed' THEN 1 END) as failed_count,
  SUM(COALESCE(g.file_size, 0)) as total_storage_used,
  MAX(g.created_at) as last_generation_date
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN generations g ON u.id = g.user_id
GROUP BY u.id, up.full_name, up.subscription_tier;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
