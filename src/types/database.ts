export type UserRole = 'senior_dev' | 'mentor' | 'staff_engineer' | 'architect';

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  bio?: string;
  role: UserRole;
  xp_points: number;
  created_at?: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  code_snippet?: string | null;
  language?: string | null;
  created_at: string;
  profiles?: Profile;
  likes?: { user_id: string }[];
  comments?: Comment[];
  bookmarks?: { user_id: string }[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at?: string;
}

export interface Bookmark {
  id: string;
  post_id: string;
  user_id: string;
  created_at?: string;
}

export interface DebugSession {
  id: string;
  user_id: string;
  code: string;
  error_message: string;
  ai_model: string;
  ai_response: string;
  created_at: string;
  profiles?: Profile;
}

export interface MentorshipSession {
  id: string;
  mentor_id: string;
  mentee_id: string;
  scheduled_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
  mentor_profile?: Profile;
  mentee_profile?: Profile;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
}
