"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Trophy, TrendingUp, Sparkles, Award } from "lucide-react";

interface TopUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  role: string;
  xp_points: number;
}

export default function RightSidebar() {
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [activeLanguages, setActiveLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboardAndTrends() {
      setLoading(true);
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: users, error: userError } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, role, xp_points")
        .order("xp_points", { ascending: false })
        .limit(5);

      if (!userError && users) {
        setTopUsers(users);
      }

      const { data: posts } = await supabase
        .from("posts")
        .select("language")
        .not("language", "is", null);

      if (posts) {
        const langs = Array.from(
          new Set(posts.map((p) => p.language).filter(Boolean))
        ) as string[];
        setActiveLanguages(langs.slice(0, 5));
      }

      setLoading(false);
    }

    fetchLeaderboardAndTrends();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Real XP Leaderboard */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-sm min-w-0">
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#6D28D9]" />
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900">
              Tribal Leaderboard
            </h3>
          </div>
          <span className="text-[10px] font-bold text-[#6D28D9] bg-purple-50 px-2 py-0.5 rounded border border-purple-200/50">
            Top XP
          </span>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5 animate-pulse">
                <div className="h-7 w-7 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-20 rounded bg-slate-200" />
                  <div className="h-2 w-12 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : topUsers.length === 0 ? (
          <p className="text-xs text-slate-400">No member data ranked yet.</p>
        ) : (
          <div className="space-y-2">
            {topUsers.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-2 rounded-xl p-2 transition hover:bg-slate-50 min-w-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold font-mono ${
                      index === 0
                        ? "bg-amber-100 text-amber-700"
                        : index === 1
                        ? "bg-slate-200 text-slate-700"
                        : index === 2
                        ? "bg-orange-100 text-orange-800"
                        : "text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </span>

                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="h-7 w-7 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-[#6D28D9]">
                      {user.full_name?.charAt(0) || "U"}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {user.full_name}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#6D28D9] shrink-0 pl-1">
                  <Sparkles className="h-3 w-3" />
                  <span>{user.xp_points}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real Stack / Technology Presence */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-sm min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#6D28D9]" />
          <h3 className="font-semibold text-xs sm:text-sm text-slate-900">Active Stacks</h3>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2.5">
          Technologies actively discussed in production logs.
        </p>

        {activeLanguages.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {activeLanguages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-700 border border-slate-200"
              >
                #{lang}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Award className="h-3.5 w-3.5 text-slate-400" />
            <span>Awaiting stack tags</span>
          </div>
        )}
      </div>
    </div>
  );
}
