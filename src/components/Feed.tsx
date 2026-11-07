import { useState, useEffect, FormEvent } from 'react';
import { dbService } from '../lib/supabase';
import { Post, Profile, Comment } from '../types/database';
import {
  Code,
  Send,
  Heart,
  MessageSquare,
  Bookmark,
  Copy,
  Check,
  Terminal,
  AlertCircle,
  RotateCw,
} from 'lucide-react';

interface FeedProps {
  currentUserProfile: Profile | null;
  onOpenAuth: () => void;
  onPostCreated?: () => void;
}

export default function Feed({ currentUserProfile, onOpenAuth, onPostCreated }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'code' | 'saved'>('all');

  // Form State
  const [content, setContent] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active comments dropdown per post
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await dbService.getPosts();
      setPosts(data);
    } catch (err: any) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUserProfile) {
      onOpenAuth();
      return;
    }

    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const snippet = showCodeInput && codeSnippet.trim() ? codeSnippet.trim() : null;
      const lang = snippet ? language : null;

      const created = await dbService.createPost(currentUserProfile.id, content.trim(), snippet, lang);
      setPosts([created, ...posts]);
      setContent('');
      setCodeSnippet('');
      setShowCodeInput(false);
      if (onPostCreated) onPostCreated();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not broadcast post. Check Supabase connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeToggle = async (post: Post) => {
    if (!currentUserProfile) {
      onOpenAuth();
      return;
    }

    const currentUserId = currentUserProfile.id;
    const hasLiked = (post.likes || []).some((l) => l.user_id === currentUserId);

    // Optimistic UI update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === post.id) {
          const updatedLikes = hasLiked
            ? (p.likes || []).filter((l) => l.user_id !== currentUserId)
            : [...(p.likes || []), { user_id: currentUserId }];
          return { ...p, likes: updatedLikes };
        }
        return p;
      })
    );

    try {
      await dbService.toggleLike(post.id, currentUserId, hasLiked);
    } catch (err) {
      console.error('Like toggle failed:', err);
      loadPosts();
    }
  };

  const handleBookmarkToggle = async (post: Post) => {
    if (!currentUserProfile) {
      onOpenAuth();
      return;
    }

    const currentUserId = currentUserProfile.id;
    const hasBookmarked = (post.bookmarks || []).some((b) => b.user_id === currentUserId);

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === post.id) {
          const updatedBookmarks = hasBookmarked
            ? (p.bookmarks || []).filter((b) => b.user_id !== currentUserId)
            : [...(p.bookmarks || []), { user_id: currentUserId }];
          return { ...p, bookmarks: updatedBookmarks };
        }
        return p;
      })
    );

    try {
      await dbService.toggleBookmark(post.id, currentUserId, hasBookmarked);
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
      loadPosts();
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!currentUserProfile) {
      onOpenAuth();
      return;
    }

    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const newComment = await dbService.addComment(postId, currentUserProfile.id, commentText.trim());

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              comments: [...(p.comments || []), newComment],
            };
          }
          return p;
        })
      );
      setCommentText('');
    } catch (err) {
      console.error('Comment submission error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const copyCodeToClipboard = (text: string, postId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(postId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    if (filterMode === 'code') return Boolean(p.code_snippet);
    if (filterMode === 'saved') {
      if (!currentUserProfile) return false;
      return (p.bookmarks || []).some((b) => b.user_id === currentUserProfile.id);
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Create Post Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-sm min-w-0 overflow-hidden">
        <form onSubmit={handleCreatePost} className="space-y-3.5 sm:space-y-4">
          <div className="flex gap-2.5 sm:gap-3">
            {currentUserProfile?.avatar_url ? (
              <img
                src={currentUserProfile.avatar_url}
                alt={currentUserProfile.full_name}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover shrink-0 border border-purple-200 mt-0.5"
              />
            ) : (
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-xs text-[#6D28D9] mt-0.5">
                {currentUserProfile ? currentUserProfile.full_name.charAt(0) : '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  currentUserProfile
                    ? `Share an RFC, production bug postmortem, or design notes, @${currentUserProfile.username}...`
                    : 'Share an architectural RFC or production pattern with senior engineers...'
                }
                className="w-full resize-none border-0 bg-transparent p-0.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-xs sm:text-sm leading-relaxed"
                rows={3}
              />
            </div>
          </div>

          {/* Dark Navy Code Snippet Block Editor (#0F172A) */}
          {showCodeInput && (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0F172A] p-3 sm:p-4 text-slate-100 shadow-inner max-w-full">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-purple-400">
                  <Terminal className="h-3.5 w-3.5 shrink-0" /> Snippet Editor
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 hidden xs:inline">Language:</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="sql">PostgreSQL / SQL</option>
                    <option value="bash">Bash / Shell</option>
                    <option value="graphql">GraphQL</option>
                    <option value="json">JSON Schema</option>
                  </select>
                </div>
              </div>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="// Paste production code, SQL query, or architecture definition here..."
                rows={5}
                className="w-full resize-y bg-transparent font-mono text-[11px] sm:text-xs text-slate-200 placeholder-slate-500 focus:outline-none leading-relaxed"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 sm:p-3 text-xs text-rose-600 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 sm:pt-3">
            <button
              type="button"
              onClick={() => setShowCodeInput(!showCodeInput)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition min-h-[38px] ${
                showCodeInput
                  ? 'bg-purple-100 text-[#6D28D9]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Code className="h-4 w-4 shrink-0" />
              <span>{showCodeInput ? 'Hide Code' : 'Attach Code Snippet'}</span>
            </button>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5b21b6] disabled:opacity-40 min-h-[38px]"
            >
              <Send className="h-3.5 w-3.5 shrink-0" />
              <span>{submitting ? 'Publishing...' : 'Broadcast (+25 XP)'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs - Horizontal Scrolling Carousel for small viewports */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70 overflow-x-auto no-scrollbar max-w-[calc(100vw-70px)] sm:max-w-none">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[34px] flex items-center ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({posts.length})
          </button>
          <button
            onClick={() => setFilterMode('code')}
            className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[34px] flex items-center ${
              filterMode === 'code'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            With Code ({posts.filter((p) => p.code_snippet).length})
          </button>
          <button
            onClick={() => setFilterMode('saved')}
            className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[34px] flex items-center ${
              filterMode === 'saved'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bookmarks
          </button>
        </div>

        <button
          onClick={loadPosts}
          className="text-xs text-slate-500 hover:text-[#6D28D9] font-medium transition p-1.5 min-h-[34px] min-w-[34px] flex items-center justify-center shrink-0"
          title="Refresh Feed"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Feed List */}
      <div className="space-y-3.5 sm:space-y-4 min-w-0">
        {loading ? (
          <div className="space-y-3.5 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-28 rounded bg-slate-200" />
                    <div className="h-2 w-16 rounded bg-slate-200" />
                  </div>
                </div>
                <div className="mt-3.5 space-y-2">
                  <div className="h-3 w-full rounded bg-slate-200" />
                  <div className="h-3 w-4/5 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-purple-50 text-[#6D28D9] mb-2.5">
              <Code className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              {filterMode === 'saved'
                ? 'No saved bookmarks yet'
                : filterMode === 'code'
                ? 'No code snippets found'
                : 'No transmissions published yet'}
            </h3>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {filterMode === 'saved'
                ? 'Click the bookmark icon on any architecture log to save it to your personal library.'
                : 'Be the first senior engineer to broadcast an architectural pattern or code snippet.'}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const hasLiked = currentUserProfile
              ? (post.likes || []).some((l) => l.user_id === currentUserProfile.id)
              : false;
            const hasBookmarked = currentUserProfile
              ? (post.bookmarks || []).some((b) => b.user_id === currentUserProfile.id)
              : false;
            const commentsCount = (post.comments || []).length;
            const isCommentsOpen = activeCommentsPostId === post.id;

            return (
              <article
                key={post.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-sm transition hover:border-slate-300 min-w-0 overflow-hidden"
              >
                {/* Post Author Info */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {post.profiles?.avatar_url ? (
                      <img
                        src={post.profiles.avatar_url}
                        alt={post.profiles.full_name}
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border border-purple-200 shrink-0"
                      />
                    ) : (
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-xs sm:text-sm text-[#6D28D9]">
                        {post.profiles?.full_name?.charAt(0) || 'D'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {post.profiles?.full_name || 'Senior Architect'}
                        </span>
                        <span className="text-[10px] font-semibold text-[#6D28D9] capitalize bg-purple-50 px-1.5 py-0.2 rounded shrink-0">
                          {post.profiles?.role?.replace('_', ' ') || 'Senior Dev'}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-400 truncate mt-0.5">
                        @{post.profiles?.username || 'engineer'} ·{' '}
                        {new Date(post.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mt-3 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed break-words">
                  {post.content}
                </div>

                {/* Dark Navy Code Snippet Block (#0F172A) */}
                {post.code_snippet && (
                  <div className="relative mt-3.5 overflow-hidden rounded-xl border border-slate-800 bg-[#0F172A] text-slate-100 max-w-full">
                    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-3 sm:px-4 py-2 text-xs">
                      <span className="font-mono text-purple-400 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold truncate max-w-[150px]">
                        {post.language || 'code'}
                      </span>
                      <button
                        onClick={() => copyCodeToClipboard(post.code_snippet!, post.id)}
                        className="flex items-center gap-1 text-slate-400 transition hover:text-white text-[10px] sm:text-[11px] font-medium min-h-[30px] px-1"
                      >
                        {copiedId === post.id ? (
                          <>
                            <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre
                      className="overflow-x-auto p-3 sm:p-4 text-[11px] sm:text-xs leading-relaxed text-slate-200 max-w-full"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      <code>{post.code_snippet}</code>
                    </pre>
                  </div>
                )}

                {/* Actions: Likes, Comments, Bookmarks (Touch targets >= 44x44px for thumb reach) */}
                <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2 text-slate-500">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <button
                      onClick={() => handleLikeToggle(post)}
                      className={`flex items-center gap-1.5 text-xs font-semibold transition min-h-[44px] min-w-[44px] justify-center ${
                        hasLiked ? 'text-[#6D28D9]' : 'hover:text-slate-800'
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          hasLiked ? 'fill-[#6D28D9] text-[#6D28D9]' : ''
                        }`}
                      />
                      <span className="tabular-nums text-xs">{(post.likes || []).length}</span>
                    </button>

                    <button
                      onClick={() =>
                        setActiveCommentsPostId(isCommentsOpen ? null : post.id)
                      }
                      className="flex items-center gap-1.5 text-xs font-semibold hover:text-slate-800 transition min-h-[44px] min-w-[44px] justify-center"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="tabular-nums text-xs">{commentsCount}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleBookmarkToggle(post)}
                    className={`transition min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      hasBookmarked
                        ? 'text-[#6D28D9]'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title={hasBookmarked ? 'Remove Bookmark' : 'Save Transmission'}
                  >
                    <Bookmark
                      className={`h-4 w-4 ${
                        hasBookmarked ? 'fill-[#6D28D9]' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Inline Comments Section */}
                {isCommentsOpen && (
                  <div className="mt-3 border-t border-slate-100 pt-3 space-y-2.5">
                    <h4 className="text-[11px] sm:text-xs font-semibold text-slate-700">
                      Engineering Feedback ({commentsCount})
                    </h4>

                    {/* Comments list */}
                    <div className="space-y-2">
                      {(post.comments || []).map((c) => (
                        <div
                          key={c.id}
                          className="rounded-xl bg-slate-50 p-2.5 sm:p-3 text-[11px] sm:text-xs text-slate-800 border border-slate-100 break-words"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 truncate">
                              {c.profiles?.full_name || 'Senior Colleague'}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 shrink-0">
                              {new Date(c.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="leading-relaxed text-slate-700">{c.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* New Comment Input */}
                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post.id);
                        }}
                        placeholder="Add peer review..."
                        className="flex-1 min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#6D28D9] focus:outline-none min-h-[40px]"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={submittingComment || !commentText.trim()}
                        className="rounded-xl bg-[#6D28D9] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#5b21b6] transition disabled:opacity-40 min-h-[40px] shrink-0"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
