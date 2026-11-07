import { useState, useEffect } from 'react';
import { dbService, SUPABASE_SCHEMA_SQL } from '../lib/supabase';
import { Profile, Post } from '../types/database';
import { Trophy, TrendingUp, Sparkles, Copy, Check, Database, ExternalLink } from 'lucide-react';

interface RightSidebarProps {
  onOpenAuth: (tab?: 'signin' | 'signup' | 'supabase') => void;
  refreshTrigger?: number;
}

export default function RightSidebar({ onOpenAuth, refreshTrigger }: RightSidebarProps) {
  const [topUsers, setTopUsers] = useState<Profile[]>([]);
  const [activeLanguages, setActiveLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSql, setCopiedSql] = useState(false);
  const isSupabaseLive = dbService.isLiveSupabase();

  useEffect(() => {
    fetchLeaderboardAndTags();
  }, [refreshTrigger]);

  const fetchLeaderboardAndTags = async () => {
    setLoading(true);
    try {
      const users = await dbService.getLeaderboard(5);
      setTopUsers(users);

      const posts = await dbService.getPosts();
      const langs = Array.from(
        new Set(
          posts
            .map((p) => p.language)
            .filter((l): l is string => Boolean(l && l.trim()))
        )
      );
      setActiveLanguages(langs.slice(0, 8));
    } catch (err) {
      console.error('Error fetching right sidebar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const copySqlSchema = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Real XP Leaderboard */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#6D28D9]" />
            <h3 className="font-bold text-sm text-slate-900">
              Tribal Leaderboard
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[#6D28D9] font-mono">
            Top XP
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-20 rounded bg-slate-200" />
                  <div className="h-2 w-12 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : topUsers.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-slate-500">No member data ranked yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Publish an architectural RFC to claim rank #1!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {topUsers.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl p-2 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold font-mono ${
                      index === 0
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : index === 1
                        ? 'bg-slate-200 text-slate-800'
                        : index === 2
                        ? 'bg-orange-100 text-orange-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {index + 1}
                  </span>

                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-[#6D28D9]">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800">
                      {user.full_name}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      @{user.username} · <span className="capitalize">{user.role?.replace('_', ' ')}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#6D28D9] shrink-0 pl-2">
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span className="tabular-nums">{user.xp_points || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real Stack / Technology Presence */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#6D28D9]" />
            <h3 className="font-bold text-sm text-slate-900">Active Stacks</h3>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
          Technologies actively discussed in production logs.
        </p>

        {activeLanguages.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {activeLanguages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700 border border-slate-200"
              >
                #{lang}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Publish a code snippet in TypeScript, Rust, Python, or Go to seed stack telemetry.
          </p>
        )}
      </div>

      {/* Supabase Schema & Integration Card */}
      <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-[#6D28D9]" />
          <h3 className="font-bold text-xs text-slate-900">Supabase Architecture</h3>
        </div>
        <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
          {isSupabaseLive
            ? 'Connected to live Supabase backend. Tables and Auth are syncing in real time.'
            : 'Using client-side persistent storage. Connect your live Supabase project to sync across devices.'}
        </p>

        <div className="space-y-2">
          <button
            onClick={copySqlSchema}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white py-2 text-xs font-semibold text-[#6D28D9] shadow-sm hover:bg-purple-50 transition"
          >
            {copiedSql ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">SQL Schema Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Supabase SQL Schema</span>
              </>
            )}
          </button>

          <button
            onClick={() => onOpenAuth('supabase')}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#6D28D9] py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#5b21b6] transition"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Configure Supabase Keys</span>
          </button>
        </div>
      </div>
    </div>
  );
}
