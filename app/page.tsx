import Sidebar from "./components/Sidebar";
import Feed from "./components/Feed";
import RightSidebar from "./components/RightSidebar";
import { Code2, Terminal, Users2, Trophy } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-[#6D28D9] selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-2 sm:gap-8 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-[#6D28D9] text-white shadow-md shadow-[#6D28D9]/20 font-mono font-bold text-xs sm:text-base">
              &lt;C/&gt;
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Code<span className="text-[#6D28D9]">Tribe</span>
            </span>
          </div>
        </div>
      </header>

      {/* 3-Column Responsive Grid */}
      <main className="mx-auto max-w-7xl w-full px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-24 md:pb-8 flex-1 min-w-0">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-12 lg:gap-8 min-w-0">
          {/* Left Navigation: 3 cols on large desktop, 4 on medium */}
          <aside className="hidden md:block md:col-span-4 lg:col-span-3">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </aside>

          {/* Center Feed: 12 on mobile (older phones 320px+), 8 on medium, 6 on desktop */}
          <section className="col-span-12 md:col-span-8 lg:col-span-6 min-w-0 w-full">
            <Feed />
          </section>

          {/* Right Sidebar: 3 cols on large desktop */}
          <aside className="hidden lg:block lg:col-span-3 min-w-0">
            <div className="sticky top-20">
              <RightSidebar />
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1">
        <div className="grid grid-cols-4 items-center justify-items-center max-w-md mx-auto">
          <a
            href="#"
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-center text-[#6D28D9]"
          >
            <Code2 className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Feed</span>
          </a>
          <a
            href="#debugger"
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-center text-slate-500 hover:text-slate-900"
          >
            <Terminal className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Debugger</span>
          </a>
          <a
            href="#mentorship"
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-center text-slate-500 hover:text-slate-900"
          >
            <Users2 className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Mentors</span>
          </a>
          <a
            href="#leaderboard"
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-center text-slate-500 hover:text-slate-900"
          >
            <Trophy className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Ranks</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
