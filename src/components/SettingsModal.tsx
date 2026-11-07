import { useState, useEffect, FormEvent } from 'react';
import { dbService, getSupabaseCredentials, saveSupabaseCredentials, clearSupabaseCredentials } from '../lib/supabase';
import { Profile } from '../types/database';
import { X, Save, CheckCircle2, AlertCircle, Database } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: Profile | null;
  onProfileUpdated: (profile: Profile) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  currentUserProfile,
  onProfileUpdated,
}: SettingsModalProps) {
  const [fullName, setFullName] = useState(currentUserProfile?.full_name || '');
  const [username, setUsername] = useState(currentUserProfile?.username || '');
  const [bio, setBio] = useState(currentUserProfile?.bio || '');
  const [role, setRole] = useState<Profile['role']>(currentUserProfile?.role || 'senior_dev');
  const [avatarUrl, setAvatarUrl] = useState(currentUserProfile?.avatar_url || '');

  // Settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Supabase keys
  const creds = getSupabaseCredentials();
  const [sbUrl, setSbUrl] = useState(creds.url);
  const [sbKey, setSbKey] = useState(creds.anonKey);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUserProfile) {
      setFullName(currentUserProfile.full_name);
      setUsername(currentUserProfile.username);
      setBio(currentUserProfile.bio || '');
      setRole(currentUserProfile.role);
      setAvatarUrl(currentUserProfile.avatar_url || '');

      dbService.getSettings(currentUserProfile.id).then((s) => {
        setTheme(s.theme);
        setNotificationsEnabled(s.notifications_enabled);
      });
    }
  }, [currentUserProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    try {
      if (currentUserProfile) {
        const updated = await dbService.updateProfile(currentUserProfile.id, {
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim(),
          role,
          avatar_url: avatarUrl.trim() || `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
        });
        onProfileUpdated(updated);

        await dbService.updateSettings(currentUserProfile.id, {
          theme,
          notifications_enabled: notificationsEnabled,
        });
      }

      if (sbUrl.trim() !== creds.url || sbKey.trim() !== creds.anonKey) {
        if (sbUrl && sbKey) {
          saveSupabaseCredentials(sbUrl, sbKey);
        } else if (!sbUrl && !sbKey) {
          clearSupabaseCredentials();
        }
      }

      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg my-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 shrink-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">Tribal Settings & Profile</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 sm:p-3 text-xs text-rose-600 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 sm:p-3 text-xs text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          {/* Profile Details */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              Developer Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#6D28D9] focus:outline-none min-h-[40px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#6D28D9] focus:outline-none min-h-[40px]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                Engineering Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Profile['role'])}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#6D28D9] focus:outline-none min-h-[40px]"
              >
                <option value="senior_dev">Senior Software Engineer</option>
                <option value="mentor">Technical Mentor</option>
                <option value="staff_engineer">Staff / Principal Engineer</option>
                <option value="architect">Systems Architect</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                Bio & Tech Focus
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="e.g. Distributed consensus, Rust concurrency..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#6D28D9] focus:outline-none"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Preferences */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              Preferences
            </h3>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-semibold text-slate-800">Email Notifications</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500">Mentorship alerts and RFC replies</p>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="h-5 w-5 rounded text-[#6D28D9] focus:ring-[#6D28D9] min-h-[24px] min-w-[24px]"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Supabase Connection */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-[#6D28D9]" />
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                Live Supabase Backend
              </h3>
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 mb-1">
                Supabase URL
              </label>
              <input
                type="text"
                value={sbUrl}
                onChange={(e) => setSbUrl(e.target.value)}
                placeholder="https://xyzproject.supabase.co"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:border-[#6D28D9] focus:outline-none min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 mb-1">
                Supabase Anon Key
              </label>
              <input
                type="password"
                value={sbKey}
                onChange={(e) => setSbKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1Ni..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:border-[#6D28D9] focus:outline-none min-h-[40px]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#6D28D9] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#5b21b6] transition disabled:opacity-50 flex items-center gap-1.5 min-h-[44px]"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
