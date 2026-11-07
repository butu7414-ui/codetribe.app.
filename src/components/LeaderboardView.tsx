import { useState, useEffect } from 'react';
import { dbService } from '../lib/supabase';
import { Profile } from '../types/database';
import { Trophy, Sparkles, ShieldCheck } from 'lucide-react';

export default function LeaderboardView() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await dbService.getLeaderboard(50);
      setProfiles(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    if (roleFilter === 'all') return true;
    return p.role === roleFilter;
  });

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-6 shadow-sm min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#6D28D9] text-white shadow-md shadow-[#6D28D9]/20 shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              Global Leaderboard
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              Senior engineering XP ranked by contributions.
            </p>
          </div>
        </div>

        {/* XP Rules info */}
        <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
          <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
            <span className="font-mono font-bold text-[#6D28D9] block text-xs sm:text-sm">+25 XP</span>
            <span className="text-slate-500 text-[10px]">Architectural RFC</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
            <span className="font-mono font-bold text-[#6D28D9] block text-xs sm:text-sm">+30 XP</span>
            <span className="text-slate-500 text-[10px]">AI Debug Session</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
            <span className="font-mono font-bold text-[#6D28D9] block text-xs sm:text-sm">+10 XP</span>
            <span className="text-slate-500 text-[10px]">Senior Peer Review</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
            <span className="font-mono font-bold text-[#6D28D9] block text-xs sm:text-sm">+100 XP</span>
            <span className="text-slate-500 text-[10px]">Profile Verified</span>
          </div>
        </div>
      </div>

      {/* Filter tabs - Horizontal carousel on mobile */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {(['all', 'senior_dev', 'mentor', 'architect'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold capitalize transition whitespace-nowrap min-h-[36px] flex items-center ${
              roleFilter === r
                ? 'bg-[#6D28D9] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {r === 'all' ? 'All Roles' : r.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Rankings Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm min-w-0">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading rankings...</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No ranked members found in this category.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProfiles.map((user, idx) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-2 p-3 sm:p-4 transition hover:bg-slate-50 min-w-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg text-[10px] sm:text-xs font-bold font-mono ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : idx === 1
                        ? 'bg-slate-200 text-slate-800'
                        : idx === 2
                        ? 'bg-orange-100 text-orange-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-purple-200 shrink-0"
                    />
                  ) : (
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-xs text-[#6D28D9]">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {user.full_name}
                      </span>
                      <ShieldCheck className="h-3 w-3 text-[#6D28D9] shrink-0" />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                      @{user.username} · <span className="capitalize">{user.role?.replace('_', ' ')}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#6D28D9] shrink-0 pl-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{user.xp_points || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
