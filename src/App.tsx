import { useState, useEffect } from 'react';
import { dbService } from './lib/supabase';
import { Profile } from './types/database';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import RightSidebar from './components/RightSidebar';
import AiDebugger from './components/AiDebugger';
import MentorshipView from './components/MentorshipView';
import LeaderboardView from './components/LeaderboardView';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import { Code2, Terminal, Users2, Trophy, Sparkles, UserCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | 'supabase'>('signup');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isSupabaseLive = dbService.isLiveSupabase();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await dbService.getCurrentUser();
      if (user) {
        const profile = await dbService.getProfile(user.id);
        setCurrentUserProfile(profile);
      } else {
        setCurrentUserProfile(null);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const handleSignOut = async () => {
    await dbService.signOut();
    setCurrentUserProfile(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    loadCurrentUser();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-[#6D28D9] selection:text-white">
      {/* Top Header conforming to Top Bar Contract */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6D28D9] text-white shadow-md shadow-[#6D28D9]/20 font-mono font-bold text-base">
              &lt;C/&gt;
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('feed');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap"
            >
              Code<span className="text-[#6D28D9]">Tribe</span>
            </a>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('feed')}
              className={`hover:text-[#6D28D9] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'feed' ? 'text-[#6D28D9]' : ''
              }`}
            >
              <Code2 className="h-4 w-4" />
              Feed
            </button>
            <button
              onClick={() => setActiveTab('debugger')}
              className={`hover:text-[#6D28D9] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'debugger' ? 'text-[#6D28D9]' : ''
              }`}
            >
              <Terminal className="h-4 w-4" />
              AI Debugger
            </button>
            <button
              onClick={() => setActiveTab('mentorship')}
              className={`hover:text-[#6D28D9] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'mentorship' ? 'text-[#6D28D9]' : ''
              }`}
            >
              <Users2 className="h-4 w-4" />
              Mentorship
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`hover:text-[#6D28D9] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'leaderboard' ? 'text-[#6D28D9]' : ''
              }`}
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setAuthModalTab('supabase');
                setIsAuthOpen(true);
              }}
              className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                isSupabaseLive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-purple-200 bg-purple-50 text-[#6D28D9] hover:bg-purple-100/60'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isSupabaseLive ? 'bg-emerald-500' : 'bg-purple-500 animate-pulse'}`} />
              <span>{isSupabaseLive ? 'Supabase Live' : 'Connect Project URL'}</span>
            </button>

            {currentUserProfile ? (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-purple-300 transition whitespace-nowrap"
              >
                <span className="font-mono text-[#6D28D9] font-bold">
                  {currentUserProfile.xp_points || 0} XP
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>@{currentUserProfile.username}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthModalTab('signup');
                  setIsAuthOpen(true);
                }}
                className="rounded-xl bg-[#6D28D9] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#6D28D9]/20 hover:bg-[#5b21b6] transition whitespace-nowrap"
              >
                Authenticate
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3-Column Layout: Responsive (3 cols on desktop, 1 col on mobile) */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
          {/* Left Navigation Sidebar: 3 cols on desktop */}
          <aside className="hidden md:block md:col-span-4 lg:col-span-3">
            <div className="sticky top-24">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onOpenAuth={(tab) => {
                  setAuthModalTab(tab || 'signup');
                  setIsAuthOpen(true);
                }}
                onOpenSettings={() => setIsSettingsOpen(true)}
                currentUserProfile={currentUserProfile}
                onSignOut={handleSignOut}
              />
            </div>
          </aside>

          {/* Center Main View: 6 cols on large desktop, 8 on medium, 12 on mobile */}
          <section className="col-span-12 md:col-span-8 lg:col-span-6">
            {activeTab === 'feed' && (
              <Feed
                currentUserProfile={currentUserProfile}
                onOpenAuth={() => {
                  setAuthModalTab('signup');
                  setIsAuthOpen(true);
                }}
                onPostCreated={triggerRefresh}
              />
            )}
            {activeTab === 'debugger' && (
              <AiDebugger
                currentUserProfile={currentUserProfile}
                onOpenAuth={() => {
                  setAuthModalTab('signup');
                  setIsAuthOpen(true);
                }}
                onSessionCreated={triggerRefresh}
              />
            )}
            {activeTab === 'mentorship' && (
              <MentorshipView
                currentUserProfile={currentUserProfile}
                onOpenAuth={() => {
                  setAuthModalTab('signup');
                  setIsAuthOpen(true);
                }}
              />
            )}
            {activeTab === 'leaderboard' && <LeaderboardView />}
          </section>

          {/* Right Sidebar: 3 cols on large desktop */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24">
              <RightSidebar
                onOpenAuth={(tab) => {
                  setAuthModalTab(tab || 'supabase');
                  setIsAuthOpen(true);
                }}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialTab={authModalTab}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          loadCurrentUser();
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUserProfile={currentUserProfile}
        onProfileUpdated={(updated) => {
          setCurrentUserProfile(updated);
          setRefreshTrigger((prev) => prev + 1);
        }}
      />
    </div>
  );
}
