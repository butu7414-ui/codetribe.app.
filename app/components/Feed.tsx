"use client";

import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
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
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  role: string;
}

interface Like {
  user_id: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  code_snippet: string | null;
  language: string | null;
  created_at: string;
  profiles: Profile;
  likes: Like[];
  comments: { id: string }[];
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Form State
  const [content, setContent] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionAndPosts();
  }, []);

  const fetchSessionAndPosts = async () => {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user?.id ?? null);

    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,
        user_id,
        content,
        code_snippet,
        language,
        created_at,
        profiles (
          id,
          full_name,
          username,
          avatar_url,
          role
        ),
        likes (
          user_id
        ),
        comments (
          id
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data as unknown as Post[]);
    }
    setLoading(false);
  };

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUserId || !supabase) {
      setErrorMsg("You must be authenticated with Supabase to broadcast a post.");
      return;
    }

    if (!content.trim()) return;

    setSubmitting(true);

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: currentUserId,
        content: content.trim(),
        code_snippet: showCodeInput && codeSnippet.trim() ? codeSnippet.trim() : null,
        language: showCodeInput && codeSnippet.trim() ? language : null,
      })
      .select(`
        id,
        user_id,
        content,
        code_snippet,
        language,
        created_at,
        profiles (
          id,
          full_name,
          username,
          avatar_url,
          role
        ),
        likes (
          user_id
        ),
        comments (
          id
        )
      `)
      .single();

    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      setPosts([data as unknown as Post, ...posts]);
      setContent("");
      setCodeSnippet("");
      setShowCodeInput(false);
    }
    setSubmitting(false);
  };

  const handleLikeToggle = async (postId: string, currentLikes: Like[]) => {
    if (!currentUserId || !supabase) {
      alert("Please sign in to like posts.");
      return;
    }

    const hasLiked = currentLikes.some((like) => like.user_id === currentUserId);

    // Optimistic UI update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const updatedLikes = hasLiked
            ? post.likes.filter((l) => l.user_id !== currentUserId)
            : [...post.likes, { user_id: currentUserId }];
          return { ...post, likes: updatedLikes };
        }
        return post;
      })
    );

    if (hasLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId);
    } else {
      await supabase
        .from("likes")
        .insert({ post_id: postId, user_id: currentUserId });
    }
  };

  const copyCodeToClipboard = (text: string, postId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(postId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Create Post Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-sm min-w-0 overflow-hidden">
        <form onSubmit={handleCreatePost} className="space-y-3.5 sm:space-y-4">
          <div className="flex gap-2.5 sm:gap-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Post an architectural insight, system design problem, or RFC..."
              className="w-full resize-none border-0 bg-transparent p-1 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-xs sm:text-sm leading-relaxed"
              rows={3}
            />
          </div>

          {/* Code Snippet Editor Section (#0F172A) */}
          {showCodeInput && (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0F172A] p-3 sm:p-4 text-slate-100 shadow-inner max-w-full">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-purple-400">
                  <Terminal className="h-3.5 w-3.5" /> Embedded Snippet
                </span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] sm:text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                  <option value="sql">PostgreSQL</option>
                  <option value="bash">Bash</option>
                </select>
              </div>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="// Paste production code or architectural snippet here..."
                rows={5}
                className="w-full resize-y bg-transparent font-mono text-[11px] sm:text-xs text-slate-200 placeholder-slate-500 focus:outline-none leading-relaxed"
                style={{ fontFamily: "var(--font-mono)" }}
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
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition min-h-[38px] ${
                showCodeInput
                  ? "bg-purple-50 text-[#6D28D9]"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <Code className="h-4 w-4" />
              <span>{showCodeInput ? "Remove Snippet" : "Add Code Snippet"}</span>
            </button>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5b21b6] disabled:opacity-50 min-h-[38px]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submitting ? "Deploying..." : "Broadcast"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Feed List */}
      <div className="space-y-3.5 sm:space-y-4 min-w-0">
        {loading ? (
          <div className="space-y-3.5 sm:space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-28 rounded bg-slate-200" />
                    <div className="h-2 w-16 rounded bg-slate-200" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full rounded bg-slate-200" />
                  <div className="h-3 w-4/5 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center">
            <Code className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-2 text-xs sm:text-sm font-semibold text-slate-900">
              No transmission logs yet
            </h3>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
              Be the first architect to share an RFC or system post to CodeTribe.
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const hasLiked = post.likes?.some(
              (l) => l.user_id === currentUserId
            );
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
                        {post.profiles?.full_name?.charAt(0) || "D"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                          {post.profiles?.full_name || "Tribal Member"}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono font-medium text-slate-600 uppercase shrink-0">
                          {post.profiles?.role || "senior_dev"}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-400 truncate mt-0.5">
                        @{post.profiles?.username || "dev"} ·{" "}
                        {new Date(post.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
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
                      <span className="font-mono text-purple-400 text-[10px] sm:text-[11px] uppercase tracking-wider truncate max-w-[150px]">
                        {post.language || "source"}
                      </span>
                      <button
                        onClick={() => copyCodeToClipboard(post.code_snippet!, post.id)}
                        className="flex items-center gap-1 text-slate-400 transition hover:text-white text-[10px] sm:text-[11px] min-h-[30px]"
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
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      <code>{post.code_snippet}</code>
                    </pre>
                  </div>
                )}

                {/* Actions: Likes, Comments, Bookmark (Touch targets >= 44x44px for thumb reach) */}
                <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2 text-slate-500">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <button
                      onClick={() => handleLikeToggle(post.id, post.likes || [])}
                      className={`flex items-center gap-1.5 text-xs font-medium transition min-h-[44px] min-w-[44px] justify-center ${
                        hasLiked
                          ? "text-[#6D28D9]"
                          : "hover:text-slate-800"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          hasLiked ? "fill-[#6D28D9] text-[#6D28D9]" : ""
                        }`}
                      />
                      <span className="text-xs">{post.likes?.length || 0}</span>
                    </button>

                    <button className="flex items-center gap-1.5 text-xs font-medium hover:text-slate-800 transition min-h-[44px] min-w-[44px] justify-center">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-xs">{post.comments?.length || 0}</span>
                    </button>
                  </div>

                  <button className="text-slate-400 hover:text-slate-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Bookmark className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
