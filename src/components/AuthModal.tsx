import { useState, useEffect, FormEvent } from 'react';
import { dbService, getSupabaseCredentials, saveSupabaseCredentials, testSupabaseConnection, DEFAULT_PUBLISHABLE_KEY } from '../lib/supabase';
import { Profile } from '../types/database';
import { X, ShieldCheck, Key, AlertCircle, Sparkles, Check, Database, RefreshCw, ExternalLink } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: 'signin' | 'signup' | 'supabase';
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialTab = 'signup' }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup' | 'supabase'>(initialTab);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Profile['role']>('senior_dev');
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Supabase direct connection inputs
  const creds = getSupabaseCredentials();
  const [sbUrl, setSbUrl] = useState(creds.url);
  const [sbKey, setSbKey] = useState(creds.anonKey || DEFAULT_PUBLISHABLE_KEY);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      const c = getSupabaseCredentials();
      setSbUrl(c.url);
      setSbKey(c.anonKey || DEFAULT_PUBLISHABLE_KEY);
      setError(null);
      setTestResult(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'signup') {
        if (!email || !fullName || !username) {
          throw new Error('Please fill out all required fields.');
        }
        await dbService.signUp(email, fullName, username, role);
      } else if (tab === 'signin') {
        if (!email) {
          throw new Error('Please enter your developer email.');
        }
        // In local mode or supabase magic link
        await dbService.signUp(email, email.split('@')[0], email.split('@')[0], 'senior_dev');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupabaseConfig = (e: FormEvent) => {
    e.preventDefault();
    if (!sbUrl.startsWith('http')) {
      setError('Supabase URL must start with https:// or http://');
      return;
    }
    saveSupabaseCredentials(sbUrl, sbKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6D28D9] font-mono text-sm font-bold text-white">
              &lt;/&gt;
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Developer Identity</h2>
              <p className="text-xs text-slate-500">CodeTribe Senior Engineering Network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              tab === 'signup'
                ? 'bg-white text-[#6D28D9] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create Profile
          </button>
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              tab === 'signin'
                ? 'bg-white text-[#6D28D9] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Quick Sign In
          </button>
          <button
            onClick={() => setTab('supabase')}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              tab === 'supabase'
                ? 'bg-white text-[#6D28D9] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Key className="h-3.5 w-3.5" /> Supabase
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-600 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'supabase' ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-purple-50/70 border border-purple-100 p-3 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-[#6D28D9] block mb-1">Publishable Key Pre-Configured</span>
                Your Supabase API key (<code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-purple-200">sb_publishable_...</code>) is loaded. Enter your <strong>Supabase Project URL</strong> to complete live database syncing.
              </div>

              {testResult && (
                <div
                  className={`flex items-center gap-2 rounded-xl p-3 text-xs border ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <form onSubmit={handleSaveSupabaseConfig} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Supabase Project URL</span>
                    <span className="text-[10px] text-slate-400 font-normal">e.g. https://your-project.supabase.co</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://abcdefghijklmnopqrst.supabase.co"
                    value={sbUrl}
                    onChange={(e) => {
                      setSbUrl(e.target.value);
                      setTestResult(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-[#6D28D9] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Supabase Anon / Publishable Key</span>
                    <span className="text-[10px] text-purple-700 font-semibold font-mono">Loaded</span>
                  </label>
                  <input
                    type="text"
                    placeholder="sb_publishable_..."
                    value={sbKey}
                    onChange={(e) => {
                      setSbKey(e.target.value);
                      setTestResult(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-[#6D28D9] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!sbUrl || !sbUrl.startsWith('http')) {
                        setError('Please enter a valid URL starting with https://');
                        return;
                      }
                      setTestingConnection(true);
                      setError(null);
                      const res = await testSupabaseConnection(sbUrl, sbKey);
                      setTestResult(res);
                      setTestingConnection(false);
                    }}
                    disabled={testingConnection || !sbUrl}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                    Test Ping
                  </button>

                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[#6D28D9] py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#5b21b6] transition flex items-center justify-center gap-1.5"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="h-4 w-4" /> Connected! Reloading...
                      </>
                    ) : (
                      'Save & Connect Project'
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              {tab === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#6D28D9] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Handle / Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. alex_architect"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#6D28D9] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tribal Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as Profile['role'])}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#6D28D9] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
                    >
                      <option value="senior_dev">Senior Engineer</option>
                      <option value="mentor">Technical Mentor</option>
                      <option value="staff_engineer">Staff / Principal Engineer</option>
                      <option value="architect">Systems Architect</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Developer Email
                </label>
                <input
                  type="email"
                  placeholder="engineer@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#6D28D9] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#6D28D9] py-2.5 text-xs font-semibold text-white shadow-md shadow-[#6D28D9]/20 hover:bg-[#5b21b6] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  'Verifying...'
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    {tab === 'signup' ? 'Join CodeTribe (+100 XP)' : 'Sign In as Senior Dev'}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
