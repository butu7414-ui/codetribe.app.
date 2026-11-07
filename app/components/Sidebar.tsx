"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Code2,
  Terminal,
  Users2,
  Trophy,
  Settings,
  LogOut,
  LogIn,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface Profile {
  full_name: string;
  username: string;
  avatar_url: string;
  role: string;
  xp_points: number;
}

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserAndProfile() {
      setLoading(true);
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("full_name, username, avatar_url, role, xp_points")
            .eq("id", user.id)
            .single();
          if (data) setProfile(data);
        }
      } catch (err) {
        console.error("Auth fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    getUserAndProfile();

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null);
          if (session?.user) {
            getUserAndProfile();
          } else {
            setProfile(null);
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    }
  };

  const navItems = [
    { label: "Engineering Feed", icon: Code2, active: true },
    { label: "AI Debugger", icon: Terminal, active: false },
    { label: "Mentorship", icon: Users2, active: false },
    { label: "Leaderboard", icon: Trophy, active: false },
    { label: "Tribal Settings", icon: Settings, active: false },
  ];

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      {/* Navigation Links */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                item.active
                  ? "bg-[#6D28D9] text-white shadow-md shadow-[#6D28D9]/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <hr className="my-5 border-slate-100" />

      {/* User Section */}
      <div className="pt-1">
        {loading ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-2 w-16 rounded bg-slate-200" />
            </div>
          </div>
        ) : user && profile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-10 w-10 rounded-full border border-purple-200 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-[#6D28D9]">
                  {profile.full_name?.charAt(0) || "U"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 flex items-center gap-1">
                  {profile.full_name}
                  <ShieldCheck className="h-4 w-4 text-[#6D28D9] inline shrink-0" />
                </p>
                <p className="truncate text-xs text-slate-500">@{profile.username}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-purple-50/70 border border-purple-100 px-3.5 py-2.5 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-[#6D28D9]">
                <Sparkles className="h-3.5 w-3.5" /> Total XP
              </span>
              <span className="font-mono font-bold text-[#6D28D9] tabular-nums">
                {profile.xp_points || 0}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-3.5 text-center border border-slate-100">
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Sign in to publish architectural insights and access senior debugging.
            </p>
            <button
              onClick={() => {
                const email = prompt("Enter your developer email to authenticate:");
                if (email && supabase) {
                  supabase.auth.signInWithOtp({ email });
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6D28D9] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5b21b6]"
            >
              <LogIn className="h-4 w-4" /> Authenticate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
