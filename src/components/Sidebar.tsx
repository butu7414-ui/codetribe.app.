import { useState, useEffect } from 'react';
import { dbService, getSupabaseCredentials } from '../lib/supabase';
import { Profile } from '../types/database';
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
  Database,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: (tab?: 'signin' | 'signup' | 'supabase') => void;
  onOpenSettings: () => void;
  currentUserProfile: Profile | null;
  onSignOut: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenSettings,
  currentUserProfile,
  onSignOut,
}: SidebarProps) {
  const isSupabaseConfigured = dbService.isLiveSupabase();

  const navItems = [
    { id: 'feed', label: 'Engineering Feed', icon: Code2 },
    { id: 'debugger', label: 'AI Debugger', icon: Terminal },
    { id: 'mentorship', label: 'Mentorship', icon: Users2 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'settings', label: 'Tribal Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'settings') {
      onOpenSettings();
    } else {
      setActiveTab(id);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      {/* Navigation Links */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#6D28D9] text-white shadow-md shadow-[#6D28D9]/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <hr className="my-5 border-slate-100" />

      {/* User Session Profile Section */}
      <div className="pt-1">
        {currentUserProfile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {currentUserProfile.avatar_url ? (
                <img
                  src={currentUserProfile.avatar_url}
                  alt={currentUserProfile.full_name}
                  className="h-10 w-10 rounded-full border border-purple-200 object-cover shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-[#6D28D9]">
                  {currentUserProfile.full_name?.charAt(0) || 'D'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 flex items-center gap-1">
                  {currentUserProfile.full_name}
                  <ShieldCheck className="h-4 w-4 text-[#6D28D9] shrink-0" />
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="truncate">@{currentUserProfile.username}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize text-[11px] text-[#6D28D9] font-medium">
                    {currentUserProfile.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* XP Points card */}
            <div className="flex items-center justify-between rounded-xl bg-purple-50/70 border border-purple-100 px-3.5 py-2.5 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-[#6D28D9]">
                <Sparkles className="h-3.5 w-3.5" /> Total XP
              </span>
              <span className="font-mono font-bold text-[#6D28D9] tabular-nums">
                {currentUserProfile.xp_points || 0}
              </span>
            </div>

            <button
              onClick={onSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-3.5 text-center border border-slate-100">
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Sign in with your developer handle to publish architecture notes and run AI debugging sessions.
            </p>
            <button
              onClick={() => onOpenAuth('signup')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6D28D9] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5b21b6]"
            >
              <LogIn className="h-4 w-4" /> Authenticate
            </button>
          </div>
        )}
      </div>

      {/* Supabase backend status indicator */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <button
          onClick={() => onOpenAuth('supabase')}
          className="flex w-full items-center justify-between rounded-lg p-2 text-[11px] text-slate-500 hover:bg-slate-50 transition"
        >
          <span className="flex items-center gap-1.5 font-mono text-slate-600">
            <Database className="h-3.5 w-3.5 text-[#6D28D9]" />
            {isSupabaseConfigured ? 'Supabase Live' : 'Supabase Ready'}
          </span>
          <span className="text-[10px] text-purple-700 font-semibold hover:underline">
            Config
          </span>
        </button>
      </div>
    </div>
  );
}
