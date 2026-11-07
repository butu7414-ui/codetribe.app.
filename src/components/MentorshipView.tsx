import { useState, useEffect, FormEvent } from 'react';
import { dbService } from '../lib/supabase';
import { Profile, MentorshipSession } from '../types/database';
import { Users2, Calendar, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface MentorshipViewProps {
  currentUserProfile: Profile | null;
  onOpenAuth: () => void;
}

export default function MentorshipView({ currentUserProfile, onOpenAuth }: MentorshipViewProps) {
  const [mentors, setMentors] = useState<Profile[]>([]);
  const [mySessions, setMySessions] = useState<MentorshipSession[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Profile | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMentorsAndSessions();
  }, [currentUserProfile]);

  const loadMentorsAndSessions = async () => {
    try {
      const allProfiles = await dbService.getLeaderboard(20);
      const mentorProfiles = allProfiles.filter(
        (p) => p.role === 'mentor' || p.role === 'architect' || p.role === 'staff_engineer'
      );
      setMentors(mentorProfiles);

      if (currentUserProfile) {
        const sessions = await dbService.getMentorshipSessions(currentUserProfile.id);
        setMySessions(sessions);
      }
    } catch (err) {
      console.error('Mentorship loading error:', err);
    }
  };

  const handleBookSession = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      onOpenAuth();
      return;
    }
    if (!selectedMentor || !scheduledTime) {
      setErrorMsg('Please select a mentor and preferred date/time.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const session = await dbService.scheduleMentorship(
        selectedMentor.id,
        currentUserProfile.id,
        scheduledTime,
        notes
      );
      setMySessions([...mySessions, session]);
      setSuccessMsg(true);
      setNotes('');
      setScheduledTime('');
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to schedule mentorship session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Intro Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-6 shadow-sm min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#6D28D9] text-white shadow-md shadow-[#6D28D9]/20 shrink-0">
            <Users2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              Senior 1-on-1 Mentorship
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              Direct architecture review sessions with Staff Engineers.
            </p>
          </div>
        </div>
      </div>

      {/* Available Mentors */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-6 shadow-sm min-w-0">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-3 sm:mb-4">
          Available Mentors & Architects
        </h3>

        {mentors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
            <p className="text-xs text-slate-500">No mentors registered in the directory yet.</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
              Set role to &quot;Technical Mentor&quot; in Settings to list your profile here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
            {mentors.map((m) => {
              const isSelected = selectedMentor?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMentor(m)}
                  className={`cursor-pointer rounded-xl border p-3 sm:p-4 transition ${
                    isSelected
                      ? 'border-[#6D28D9] bg-purple-50/40 ring-1 ring-[#6D28D9]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {m.avatar_url ? (
                      <img
                        src={m.avatar_url}
                        alt={m.full_name}
                        className="h-9 w-9 rounded-full object-cover border border-purple-200 shrink-0"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-xs text-[#6D28D9]">
                        {m.full_name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {m.full_name}
                        </span>
                        <ShieldCheck className="h-3.5 w-3.5 text-[#6D28D9] shrink-0" />
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[#6D28D9] capitalize font-medium truncate">
                        {m.role.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  {m.bio && <p className="mt-2 text-[11px] sm:text-xs text-slate-600 line-clamp-2">{m.bio}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Form */}
      {selectedMentor && (
        <div className="rounded-2xl border border-purple-200 bg-white p-3.5 sm:p-6 shadow-sm min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
            Request Session with {selectedMentor.full_name}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mb-3.5">
            Topics: Distributed Systems, Database Bottlenecks, RFC Peer Review.
          </p>

          <form onSubmit={handleBookSession} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                Preferred Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#6D28D9] focus:outline-none min-h-[40px]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                Agenda / Questions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What architectural challenge would you like to review?"
                className="w-full rounded-xl border border-slate-200 p-2.5 sm:p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#6D28D9] focus:outline-none"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Session request recorded in database!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto rounded-xl bg-[#6D28D9] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#5b21b6] transition disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? 'Transmitting...' : 'Submit Mentorship Request'}
            </button>
          </form>
        </div>
      )}

      {/* User's Scheduled Sessions */}
      {mySessions.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-6 shadow-sm min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2.5">
            Your Scheduled Sessions ({mySessions.length})
          </h3>
          <div className="space-y-2.5">
            {mySessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4 min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Calendar className="h-4 w-4 text-[#6D28D9] shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {new Date(session.scheduled_time).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  {session.notes && (
                    <p className="mt-1 text-[11px] sm:text-xs text-slate-600 truncate">{session.notes}</p>
                  )}
                </div>
                <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-[#6D28D9] uppercase shrink-0">
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
