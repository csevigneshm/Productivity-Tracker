import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageSquare, Send, Trash2 } from 'lucide-react';

// ─── types ───────────────────────────────────────────────────────────────────

type Application = {
    id: number;
    company_name: string;
    role: string;
    type: string;
    source: string;
    applied_date: string;
    status: string;
};

type Comment = {
    id: number;
    comment: string;
    created_at: string;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const csrfToken = () =>
    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

const apiFetch = (url: string, options: RequestInit = {}) =>
    fetch(url, {
        ...options,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
            ...(options.headers ?? {}),
        },
        credentials: 'same-origin',
    });

const STATUS_COLORS: Record<string, string> = {
    applied:     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    shortlisted: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    interview:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    offer:       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    rejected:    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    withdrawn:   'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    ghosted:     'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ─── main page ────────────────────────────────────────────────────────────────

export default function ApplicationShow() {
    // Laravel passes the {id} param via Inertia page props
    const { id } = usePage().props as unknown as { id: number };

    const [app, setApp]           = useState<Application | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId]   = useState<number | null>(null);
    const [editText, setEditText]     = useState('');
    const [sending, setSending]       = useState(false);
    const [error, setError]           = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    // ── fetch application ──
    const fetchApp = () =>
        apiFetch(`/api/applications/${id}`)
            .then((r) => r.json())
            .then((data) => setApp(data))
            .catch(() => setError('Failed to load application'));

    // ── fetch comments ──
    const fetchComments = () =>
        apiFetch(`/api/applications/${id}/comments`)
            .then((r) => r.json())
            .then((data: Comment[]) => setComments(data))
            .catch(() => {});

    useEffect(() => {
        fetchApp();
        fetchComments();
    }, [id]);

    // scroll to bottom when comments load
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    // ── add comment ──
    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setSending(true);
        try {
            const res = await apiFetch(`/api/applications/${id}/comments`, {
                method: 'POST',
                body: JSON.stringify({ comment: newComment.trim() }),
            });
            if (!res.ok) throw new Error();
            setNewComment('');
            fetchComments();
        } catch {
            setError('Failed to add comment');
        } finally {
            setSending(false);
        }
    };

    // ── edit comment ──
    const handleEditComment = async (commentId: number) => {
        if (!editText.trim()) return;
        await apiFetch(`/api/applications/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({ comment: editText.trim() }),
        });
        setEditingId(null);
        fetchComments();
    };

    // ── delete comment ──
    const handleDeleteComment = async (commentId: number) => {
        if (!confirm('Delete this comment?')) return;
        await apiFetch(`/api/applications/comments/${commentId}`, { method: 'DELETE' });
        fetchComments();
    };

    // ── update status ──
    const handleStatusChange = async (status: string) => {
        await apiFetch(`/api/applications/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        fetchApp();
    };

    // enter key to send comment
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); }
    };

    if (!app) return (
        <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            {error || 'Loading...'}
        </div>
    );

    return (
        <>
            <Head title={`${app.company_name} — ${app.role}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">

                {/* Back */}
                <Link href="/applications" className="flex w-fit items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                    <ArrowLeft className="h-4 w-4" /> Back to Applications
                </Link>

                {/* Application Card */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{app.company_name}</h1>
                            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{app.role}</p>
                        </div>
                        {/* inline status update */}
                        <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className={`rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize focus:outline-none focus:ring-2 focus:ring-neutral-900/20 ${STATUS_COLORS[app.status] ?? ''}`}
                        >
                            {['applied', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn', 'ghosted'].map((s) => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                        <span><span className="font-medium text-neutral-700 dark:text-neutral-300">Type:</span> {app.type}</span>
                        <span><span className="font-medium text-neutral-700 dark:text-neutral-300">Source:</span> {app.source}</span>
                        <span><span className="font-medium text-neutral-700 dark:text-neutral-300">Applied:</span> {app.applied_date}</span>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="flex flex-1 flex-col rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">

                    {/* header */}
                    <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                        <MessageSquare className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Comments ({comments.length})
                        </span>
                    </div>

                    {/* comments list */}
                    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
                        {comments.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-neutral-300 dark:text-neutral-600">
                                <MessageSquare className="h-8 w-8" />
                                <p className="text-sm">No comments yet. Add one below.</p>
                            </div>
                        ) : (
                            comments.map((c) => (
                                <div key={c.id} className="group flex flex-col gap-1 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                                    {editingId === c.id ? (
                                        <div className="flex gap-2">
                                            <textarea
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                rows={2}
                                                className="flex-1 resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                                            />
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => handleEditComment(c.id)}
                                                    className="rounded-lg bg-neutral-900 px-3 py-1 text-xs font-semibold text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900">
                                                    Save
                                                </button>
                                                <button onClick={() => setEditingId(null)}
                                                    className="rounded-lg border border-neutral-200 px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-neutral-700 dark:text-neutral-300">{c.comment}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-neutral-400">{fmt(c.created_at)}</span>
                                            <div className="flex gap-3">
                                                    <button
                                                        onClick={() => { setEditingId(c.id); setEditText(c.comment); }}
                                                        className="text-xs text-blue-500 hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteComment(c.id)}
                                                        className="text-xs text-rose-500 hover:underline"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* add comment input */}
                    {error && <p className="px-5 text-xs text-rose-500">{error}</p>}
                    <div className="flex gap-3 border-t border-neutral-100 p-4 dark:border-neutral-800">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Add a comment... (Enter to send)"
                            rows={2}
                            className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder-neutral-500"
                        />
                        <button
                            onClick={handleAddComment}
                            disabled={sending || !newComment.trim()}
                            className="flex h-10 w-10 items-center justify-center self-end rounded-xl bg-neutral-900 text-white shadow-sm transition hover:bg-neutral-700 disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>

            </div>
        </>
    );
}

ApplicationShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Applications', href: '/applications' },
        { title: 'Detail', href: '#' },
    ],
};
