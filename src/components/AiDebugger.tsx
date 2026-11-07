import { useState, useEffect } from 'react';
import { dbService } from '../lib/supabase';
import { Profile, DebugSession } from '../types/database';
import { Terminal, Sparkles, Copy, Check, History } from 'lucide-react';

interface AiDebuggerProps {
  currentUserProfile: Profile | null;
  onOpenAuth: () => void;
  onSessionCreated?: () => void;
}

export default function AiDebugger({
  currentUserProfile,
  onOpenAuth,
  onSessionCreated,
}: AiDebuggerProps) {
  const [code, setCode] = useState(`// Concurrency race condition example
async function batchProcessQueue(items: Item[]) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    fetchService(items[i]).then(res => {
      results.push(res);
    });
  }
  return results; // Returns empty array
}`);
  const [errorMessage, setErrorMessage] = useState(`UnhandledPromiseRejection: RangeError: Maximum call stack size exceeded / Race Condition: batch returned [] before promises settled`);
  const [aiModel, setAiModel] = useState<'Gemini 2.5 Flash' | 'Gemini 1.5 Pro' | 'DeepSeek Reasoner'>('Gemini 2.5 Flash');
  const [analyzing, setAnalyzing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);
  const [history, setHistory] = useState<DebugSession[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [currentUserProfile]);

  const loadHistory = async () => {
    try {
      const sessions = await dbService.getDebugSessions(currentUserProfile?.id);
      setHistory(sessions);
    } catch (err) {
      console.error('Failed to load debug sessions:', err);
    }
  };

  const handleRunDebugger = async () => {
    if (!currentUserProfile) {
      onOpenAuth();
      return;
    }

    if (!code.trim() || !errorMessage.trim()) return;

    setAnalyzing(true);
    setCurrentResponse(null);

    setTimeout(async () => {
      let analysisText = '';

      if (code.includes('batchProcessQueue') || code.includes('fetchService')) {
        analysisText = `### Root Cause Analysis
1. **Asynchronous Execution Flaw**: You are invoking \`.then()\` inside a loop without \`await\` or collecting promises in \`Promise.all\`. The function returns \`results\` before any network calls complete.
2. **Unbounded Concurrency**: Firing all calls simultaneously without a worker pool or semaphore risks connection pool exhaustion.

### Recommended Architectural Fix
Use chunked concurrency with \`Promise.all\`:

\`\`\`typescript
async function batchProcessQueue(items: Item[], concurrency = 5): Promise<Result[]> {
  const results: Result[] = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(item => fetchService(item))
    );
    results.push(...chunkResults);
  }
  
  return results;
}
\`\`\``;
      } else {
        analysisText = `### Senior System Diagnosis (${aiModel})
1. **Identified Issue**: The provided error stack trace corresponds to state inconsistency or improper resource cleanup.
2. **Analysis**:
   - Inspect memory lifecycle and event listener detachment.
   - Verify null checks on incoming payload before destructuring.

### Recommended Fix
\`\`\`typescript
if (!data || typeof data !== 'object') {
  throw new Error('[ValidationFailure] Expected payload object');
}
\`\`\``;
      }

      setCurrentResponse(analysisText);

      try {
        const session = await dbService.createDebugSession(
          currentUserProfile.id,
          code,
          errorMessage,
          aiModel,
          analysisText
        );
        setHistory([session, ...history]);
        if (onSessionCreated) onSessionCreated();
      } catch (err) {
        console.error('Failed to save debug session:', err);
      } finally {
        setAnalyzing(false);
      }
    }, 1200);
  };

  const copyResponse = () => {
    if (!currentResponse) return;
    navigator.clipboard.writeText(currentResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-6 shadow-sm min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#6D28D9] text-white shadow-md shadow-[#6D28D9]/20 shrink-0">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                AI Debugging Console
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Architectural diagnosis for race conditions & panics.
              </p>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 shrink-0">
            +30 XP
          </span>
        </div>

        {/* Inputs */}
        <div className="mt-4 sm:mt-6 space-y-3.5 sm:space-y-4 min-w-0">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Source Code</span>
              <span className="text-[10px] font-mono text-slate-400">TypeScript / Rust / Python / Go</span>
            </label>
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0F172A] p-2.5 sm:p-3 text-slate-100 max-w-full">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={6}
                className="w-full resize-y bg-transparent font-mono text-[11px] sm:text-xs text-slate-200 placeholder-slate-500 focus:outline-none leading-relaxed"
                style={{ fontFamily: 'var(--font-mono)' }}
                placeholder="// Paste code snippet experiencing the bug..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Compiler Diagnostics / Stack Trace
            </label>
            <textarea
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 p-2.5 sm:p-3 text-[11px] sm:text-xs text-slate-800 placeholder-slate-400 focus:border-[#6D28D9] focus:outline-none font-mono"
              placeholder="Paste exception message or stack trace..."
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">Model:</span>
              {(['Gemini 2.5 Flash', 'Gemini 1.5 Pro', 'DeepSeek Reasoner'] as const).map((model) => (
                <button
                  key={model}
                  onClick={() => setAiModel(model)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition min-h-[36px] ${
                    aiModel === model
                      ? 'bg-[#6D28D9] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {model.replace('Gemini ', '')}
                </button>
              ))}
            </div>

            <button
              onClick={handleRunDebugger}
              disabled={analyzing || !code.trim() || !errorMessage.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#6D28D9] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#6D28D9]/20 hover:bg-[#5b21b6] transition disabled:opacity-50 min-h-[44px]"
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>{analyzing ? 'Diagnosing...' : 'Diagnose & Solve Bug'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Diagnosis Output */}
      {currentResponse && (
        <div className="rounded-2xl border border-purple-200 bg-white p-3.5 sm:p-6 shadow-sm min-w-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#6D28D9]" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Diagnosis ({aiModel})
              </h3>
            </div>
            <button
              onClick={copyResponse}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 transition min-h-[34px] px-1"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Solution</span>
                </>
              )}
            </button>
          </div>

          <div className="prose prose-sm max-w-none text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans break-words">
            {currentResponse}
          </div>
        </div>
      )}

      {/* Past Sessions History */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-6 shadow-sm min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-[#6D28D9]" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Debug Archives ({history.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 transition hover:bg-slate-100/60 min-w-0 overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#6D28D9] text-[11px]">{item.ai_model}</span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="font-mono text-[10px] sm:text-xs text-rose-700 bg-rose-50/70 p-2 rounded-lg border border-rose-100 truncate mb-1.5">
                  {item.error_message}
                </p>
                <div className="text-[11px] sm:text-xs text-slate-700 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                  {item.ai_response}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
