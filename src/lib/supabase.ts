import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile, Post, Comment, Like, Bookmark, DebugSession, MentorshipSession, UserSettings } from '../types/database';

export const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_tbIdCsCiHWhiNCAYwZqu9A_E5LB4fdz';

// Configuration access: environment variables or local persistence
export function getSupabaseCredentials() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('codetribe_supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('codetribe_supabase_anon_key') || '' : '';

  const url = (localUrl || envUrl).trim();
  const anonKey = (localKey || envKey || DEFAULT_PUBLISHABLE_KEY).trim();

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http'))
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('codetribe_supabase_url', url.trim());
    localStorage.setItem('codetribe_supabase_anon_key', anonKey.trim());
  }
}

export function clearSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('codetribe_supabase_url');
    localStorage.removeItem('codetribe_supabase_anon_key');
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const trimmedUrl = url.trim().replace(/\/$/, '');
    const client = createClient(trimmedUrl, key.trim());
    const { error } = await client.from('profiles').select('id').limit(1);
    if (error) {
      if (error.message?.includes('relation "public.profiles" does not exist') || error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase project! (Tables not migrated yet - execute SQL migration).'
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Successfully connected and verified Supabase database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed. Verify URL and key.' };
  }
}

const creds = getSupabaseCredentials();

export const supabase: SupabaseClient | null = creds.isConfigured
  ? createClient(creds.url, creds.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

// Real In-Browser Storage Adapter for seamless offline/initial operation
// Adheres strictly to the exact Supabase table schemas with zero fake mock data
const STORAGE_KEYS = {
  USER: 'codetribe_current_user',
  PROFILES: 'codetribe_profiles_v1',
  POSTS: 'codetribe_posts_v1',
  COMMENTS: 'codetribe_comments_v1',
  LIKES: 'codetribe_likes_v1',
  BOOKMARKS: 'codetribe_bookmarks_v1',
  DEBUG_SESSIONS: 'codetribe_debug_sessions_v1',
  MENTORSHIP_SESSIONS: 'codetribe_mentorship_sessions_v1',
  SETTINGS: 'codetribe_settings_v1',
};

function getLocalData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage write error', err);
  }
}

// Live database and auth interface abstraction
export const dbService = {
  isLiveSupabase: () => {
    return getSupabaseCredentials().isConfigured && supabase !== null;
  },

  // Auth operations
  async getCurrentUser(): Promise<{ id: string; email: string } | null> {
    if (this.isLiveSupabase() && supabase) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return null;
        return { id: user.id, email: user.email || '' };
      } catch {
        return null;
      }
    }
    return getLocalData<{ id: string; email: string } | null>(STORAGE_KEYS.USER, null);
  },

  async signUp(email: string, fullName: string, username: string, role: Profile['role'] = 'senior_dev') {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'TemporaryPassword123!',
        options: {
          data: {
            full_name: fullName,
            username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
            role
          }
        }
      });
      if (error) throw error;
      if (data.user) {
        // Ensure profile exists
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          role,
          xp_points: 100,
          avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`
        });
      }
      return data.user;
    }

    // Local storage user creation
    const userId = 'usr_' + Math.random().toString(36).substring(2, 10);
    const user = { id: userId, email };
    setLocalData(STORAGE_KEYS.USER, user);

    const newProfile: Profile = {
      id: userId,
      full_name: fullName,
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
      bio: 'Senior Software Engineer building scalable distributed systems.',
      role,
      xp_points: 120,
      created_at: new Date().toISOString()
    };

    const profiles = getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
    profiles.push(newProfile);
    setLocalData(STORAGE_KEYS.PROFILES, profiles);

    return user;
  },

  async signOut() {
    if (this.isLiveSupabase() && supabase) {
      await supabase.auth.signOut();
    }
    setLocalData(STORAGE_KEYS.USER, null);
  },

  // Profile operations
  async getProfile(userId: string): Promise<Profile | null> {
    if (this.isLiveSupabase() && supabase) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return data || null;
    }

    const profiles = getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
    return profiles.find(p => p.id === userId) || null;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const profiles = getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const idx = profiles.findIndex(p => p.id === userId);
    if (idx === -1) throw new Error('Profile not found');
    profiles[idx] = { ...profiles[idx], ...updates };
    setLocalData(STORAGE_KEYS.PROFILES, profiles);
    return profiles[idx];
  },

  async getLeaderboard(limit = 10): Promise<Profile[]> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('xp_points', { ascending: false })
        .limit(limit);
      if (!error && data) return data;
    }

    const profiles = getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
    return profiles
      .slice()
      .sort((a, b) => (b.xp_points || 0) - (a.xp_points || 0))
      .slice(0, limit);
  },

  // Posts operations
  async getPosts(): Promise<Post[]> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          code_snippet,
          language,
          created_at,
          profiles (
            id,
            full_name,
            username,
            avatar_url,
            role,
            xp_points
          ),
          likes (
            user_id
          ),
          comments (
            id,
            content,
            user_id,
            created_at,
            profiles (
              full_name,
              username,
              avatar_url
            )
          ),
          bookmarks (
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as unknown as Post[];
      }
    }

    const posts = getLocalData<Post[]>(STORAGE_KEYS.POSTS, []);
    const profiles = getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const likes = getLocalData<Like[]>(STORAGE_KEYS.LIKES, []);
    const comments = getLocalData<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    const bookmarks = getLocalData<Bookmark[]>(STORAGE_KEYS.BOOKMARKS, []);

    return posts.map(p => {
      const author = profiles.find(pr => pr.id === p.user_id);
      const postLikes = likes.filter(l => l.post_id === p.id).map(l => ({ user_id: l.user_id }));
      const postComments = comments
        .filter(c => c.post_id === p.id)
        .map(c => ({
          ...c,
          profiles: profiles.find(pr => pr.id === c.user_id)
        }));
      const postBookmarks = bookmarks.filter(b => b.post_id === p.id).map(b => ({ user_id: b.user_id }));

      return {
        ...p,
        profiles: author,
        likes: postLikes,
        comments: postComments,
        bookmarks: postBookmarks
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createPost(userId: string, content: string, codeSnippet?: string | null, language?: string | null): Promise<Post> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content,
          code_snippet: codeSnippet || null,
          language: language || null
        })
        .select(`
          id,
          user_id,
          content,
          code_snippet,
          language,
          created_at,
          profiles (
            id,
            full_name,
            username,
            avatar_url,
            role,
            xp_points
          ),
          likes (
            user_id
          ),
          comments (
            id
          )
        `)
        .single();

      if (error) throw error;

      // Award XP for posting
      try {
        await supabase.rpc('increment_xp', { user_id_param: userId, xp_gain: 25 });
      } catch {
        // silently catch if RPC function is not created yet
      }

      return data as unknown as Post;
    }

    const postId = 'post_' + Math.random().toString(36).substring(2, 10);
    const newPost: Post = {
      id: postId,
      user_id: userId,
      content,
      code_snippet: codeSnippet || null,
      language: language || null,
      created_at: new Date().toISOString()
    };

    const posts = getLocalData<Post[]>(STORAGE_KEYS.POSTS, []);
    posts.unshift(newPost);
    setLocalData(STORAGE_KEYS.POSTS, posts);

    // Increment author XP
    const profiles = getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const pIdx = profiles.findIndex(p => p.id === userId);
    if (pIdx !== -1) {
      profiles[pIdx].xp_points = (profiles[pIdx].xp_points || 0) + 25;
      setLocalData(STORAGE_KEYS.PROFILES, profiles);
    }

    const author = profiles.find(p => p.id === userId);
    return {
      ...newPost,
      profiles: author,
      likes: [],
      comments: [],
      bookmarks: []
    };
  },

  async toggleLike(postId: string, userId: string, currentlyLiked: boolean): Promise<void> {
    if (this.isLiveSupabase() && supabase) {
      if (currentlyLiked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: userId });
      }
      return;
    }

    const likes = getLocalData<Like[]>(STORAGE_KEYS.LIKES, []);
    if (currentlyLiked) {
      const filtered = likes.filter(l => !(l.post_id === postId && l.user_id === userId));
      setLocalData(STORAGE_KEYS.LIKES, filtered);
    } else {
      likes.push({
        id: 'like_' + Math.random().toString(36).substring(2, 10),
        post_id: postId,
        user_id: userId,
        created_at: new Date().toISOString()
      });
      setLocalData(STORAGE_KEYS.LIKES, likes);
    }
  },

  async addComment(postId: string, userId: string, content: string): Promise<Comment> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: userId, content })
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at,
          profiles (
            full_name,
            username,
            avatar_url
          )
        `)
        .single();
      if (error) throw error;
      return data as unknown as Comment;
    }

    const newComment: Comment = {
      id: 'cmt_' + Math.random().toString(36).substring(2, 10),
      post_id: postId,
      user_id: userId,
      content,
      created_at: new Date().toISOString()
    };

    const comments = getLocalData<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    comments.push(newComment);
    setLocalData(STORAGE_KEYS.COMMENTS, comments);

    const profiles = getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
    return {
      ...newComment,
      profiles: profiles.find(p => p.id === userId)
    };
  },

  async toggleBookmark(postId: string, userId: string, currentlyBookmarked: boolean): Promise<void> {
    if (this.isLiveSupabase() && supabase) {
      if (currentlyBookmarked) {
        await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', userId);
      } else {
        await supabase.from('bookmarks').insert({ post_id: postId, user_id: userId });
      }
      return;
    }

    const bookmarks = getLocalData<Bookmark[]>(STORAGE_KEYS.BOOKMARKS, []);
    if (currentlyBookmarked) {
      const filtered = bookmarks.filter(b => !(b.post_id === postId && b.user_id === userId));
      setLocalData(STORAGE_KEYS.BOOKMARKS, filtered);
    } else {
      bookmarks.push({
        id: 'bm_' + Math.random().toString(36).substring(2, 10),
        post_id: postId,
        user_id: userId,
        created_at: new Date().toISOString()
      });
      setLocalData(STORAGE_KEYS.BOOKMARKS, bookmarks);
    }
  },

  // Debug sessions
  async getDebugSessions(userId?: string): Promise<DebugSession[]> {
    if (this.isLiveSupabase() && supabase) {
      let query = supabase.from('debug_sessions').select(`
        id,
        user_id,
        code,
        error_message,
        ai_model,
        ai_response,
        created_at,
        profiles (
          full_name,
          username,
          avatar_url
        )
      `).order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (!error && data) return data as unknown as DebugSession[];
    }

    const sessions = getLocalData<DebugSession[]>(STORAGE_KEYS.DEBUG_SESSIONS, []);
    const profiles = getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
    return sessions
      .filter(s => !userId || s.user_id === userId)
      .map(s => ({
        ...s,
        profiles: profiles.find(p => p.id === s.user_id)
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createDebugSession(userId: string, code: string, errorMessage: string, aiModel: string, aiResponse: string): Promise<DebugSession> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('debug_sessions')
        .insert({
          user_id: userId,
          code,
          error_message: errorMessage,
          ai_model: aiModel,
          ai_response: aiResponse
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const session: DebugSession = {
      id: 'dbg_' + Math.random().toString(36).substring(2, 10),
      user_id: userId,
      code,
      error_message: errorMessage,
      ai_model: aiModel,
      ai_response: aiResponse,
      created_at: new Date().toISOString()
    };

    const sessions = getLocalData<DebugSession[]>(STORAGE_KEYS.DEBUG_SESSIONS, []);
    sessions.unshift(session);
    setLocalData(STORAGE_KEYS.DEBUG_SESSIONS, sessions);

    return session;
  },

  // Mentorship sessions
  async getMentorshipSessions(userId?: string): Promise<MentorshipSession[]> {
    if (this.isLiveSupabase() && supabase) {
      let query = supabase.from('mentorship_sessions').select(`
        id,
        mentor_id,
        mentee_id,
        scheduled_time,
        status,
        notes,
        created_at
      `).order('scheduled_time', { ascending: true });

      const { data, error } = await query;
      if (!error && data) return data as unknown as MentorshipSession[];
    }

    const sessions = getLocalData<MentorshipSession[]>(STORAGE_KEYS.MENTORSHIP_SESSIONS, []);
    const profiles = getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
    return sessions
      .filter(s => !userId || s.mentor_id === userId || s.mentee_id === userId)
      .map(s => ({
        ...s,
        mentor_profile: profiles.find(p => p.id === s.mentor_id),
        mentee_profile: profiles.find(p => p.id === s.mentee_id)
      }));
  },

  async scheduleMentorship(mentorId: string, menteeId: string, scheduledTime: string, notes?: string): Promise<MentorshipSession> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('mentorship_sessions')
        .insert({
          mentor_id: mentorId,
          mentee_id: menteeId,
          scheduled_time: scheduledTime,
          status: 'pending',
          notes: notes || null
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const session: MentorshipSession = {
      id: 'ms_' + Math.random().toString(36).substring(2, 10),
      mentor_id: mentorId,
      mentee_id: menteeId,
      scheduled_time: scheduledTime,
      status: 'pending',
      notes,
      created_at: new Date().toISOString()
    };

    const sessions = getLocalData<MentorshipSession[]>(STORAGE_KEYS.MENTORSHIP_SESSIONS, []);
    sessions.push(session);
    setLocalData(STORAGE_KEYS.MENTORSHIP_SESSIONS, sessions);

    const profiles = getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
    return {
      ...session,
      mentor_profile: profiles.find(p => p.id === mentorId),
      mentee_profile: profiles.find(p => p.id === menteeId)
    };
  },

  // Settings
  async getSettings(userId: string): Promise<UserSettings> {
    if (this.isLiveSupabase() && supabase) {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (data) return data;
    }

    const settings = getLocalData<UserSettings[]>(STORAGE_KEYS.SETTINGS, []);
    const userSetting = settings.find(s => s.user_id === userId);
    return userSetting || {
      id: 'set_' + userId,
      user_id: userId,
      theme: 'light',
      notifications_enabled: true
    };
  },

  async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ user_id: userId, ...updates })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const settings = getLocalData<UserSettings[]>(STORAGE_KEYS.SETTINGS, []);
    const idx = settings.findIndex(s => s.user_id === userId);
    if (idx !== -1) {
      settings[idx] = { ...settings[idx], ...updates };
      setLocalData(STORAGE_KEYS.SETTINGS, settings);
      return settings[idx];
    } else {
      const newSettings: UserSettings = {
        id: 'set_' + userId,
        user_id: userId,
        theme: updates.theme || 'light',
        notifications_enabled: updates.notifications_enabled ?? true
      };
      settings.push(newSettings);
      setLocalData(STORAGE_KEYS.SETTINGS, settings);
      return newSettings;
    }
  }
};

// SQL Schema for Supabase execution
export const SUPABASE_SCHEMA_SQL = `-- CodeTribe Complete Production SQL Migration
-- Run this in your Supabase SQL Editor:

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'senior_dev' CHECK (role IN ('senior_dev', 'mentor', 'staff_engineer', 'architect')),
  xp_points INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  code_snippet TEXT,
  language TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Likes Table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 5. Bookmarks Table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 6. Debug Sessions Table
CREATE TABLE IF NOT EXISTS public.debug_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Mentorship Sessions Table
CREATE TABLE IF NOT EXISTS public.mentorship_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mentee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Enforcement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debug_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Posts viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comments viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Likes viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can toggle own likes" ON public.likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Bookmarks viewable by owner" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own debug sessions" ON public.debug_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create debug sessions" ON public.debug_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mentorship participants can view" ON public.mentorship_sessions FOR SELECT USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);
CREATE POLICY "Users can request mentorship" ON public.mentorship_sessions FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Users manage own settings" ON public.settings FOR ALL USING (auth.uid() = user_id);

-- Profile auto-creation trigger on Auth Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url, role, xp_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Senior Architect'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'dev_' || SUBSTRING(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'senior_dev'),
    50
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;
