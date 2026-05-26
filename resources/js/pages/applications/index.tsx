import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Briefcase, Plus, Send, Trash2, X } from 'lucide-react';

// ─── types ───────────────────────────────────────────────────────────────────

type Application = {
    id: number;
    company_name: string;
    role: string;
    type: 'government' | 'corporate' | 'startup';
    source: 'linkedin' | 'naukri' | 'indeed' | 'referral' | 'careers_page' | 'other';
    applied_date: string;
    status: 'applied' | 'shortlisted' | 'interview' | 'offer' | 'rejected' | 'withdrawn' | 'ghosted';
    application_comments: Comment[];
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

const localToday = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const STATUS_COLORS: Record<Application['status'], string> = {
    applied:     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    shortlisted: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    interview:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    offer:       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    rejected:    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    withdrawn:   'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    ghosted:     'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const TYPE_COLORS: Record<Application['type'], string> = {
    government: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    corporate:  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    startup:    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

const emptyForm = {
    company_name: '',
    role: '',
    type: 'corporate' as Application['type'],
    source: 'linkedin' as Application['source'],
    applied_date: localToday(),
    status: 'applied' as Application['status'],
};

// ─── sub components ───────────────────────────────────────────────────────────

function Badge({ label, className }: { label: string; className: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${className}`}>
            {label}
        </span>
    );
}

function Select({ label, name, value, onChange, options }: {
    label: string; name: string; value: string;
    onChange: (v: string) => void;
    options: string[];
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label>
            <select
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            >
                {options.map((o) => (
                    <option key={o} value={o}>{o.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}</option>
                ))}
            </select>
        </div>
    );
}

function Input({ label, name, type = 'text', value, onChange }: {
    label: string; name: string; type?: string; value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            />
        </div>
    );
}

// ─── inline comments cell ─────────────────────────────────────────────────────

function CommentsCell({ appId, comments, onRefresh }: { appId: number; comments: Comment[]; onRefresh: () => void }) {
    const [text, setText]       = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!text.trim()) return;
        setSending(true);
        await apiFetch(`/api/applications/${appId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ comment: text.trim() }),
        });
        setText('');
        setSending(false);
        onRefresh();
    };

    const handleDelete = async (id: number) => {
        await apiFetch(`/api/applications/comments/${id}`, { method: 'DELETE' });
        onRefresh();
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Add comment..."
                    className="flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-700 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder-neutral-600"
                />
                <button
                    onClick={handleSend}
                    disabled={sending || !text.trim()}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white transition hover:bg-neutral-700 disabled:opacity-40 dark:bg-white dark:text-neutral-900"
                >
                    <Send className="h-3 w-3" />
                </button>
            </div>
            {comments.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                        <p className="text-xs text-neutral-700 dark:text-neutral-300">{c.comment}</p>
                        <p className="text-xs text-neutral-400">{fmtDateTime(c.created_at)}</p>
                    </div>
                    <button
                        onClick={() => handleDelete(c.id)}
                        className="shrink-0 text-rose-400 hover:text-rose-600"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
        </div>
    );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ApplicationsIndex() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [filtered, setFiltered]         = useState<Application[]>([]);
    const [loading, setLoading]           = useState(true);
    const [showForm, setShowForm]         = useState(false);
    const [form, setForm]                 = useState(emptyForm);
    const [saving, setSaving]             = useState(false);
    const [error, setError]               = useState('');

    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSource, setFilterSource] = useState('all');
    const [filterType, setFilterType]     = useState('all');

    const fetchApplications = () => {
        setLoading(true);
        apiFetch('/api/applications')
            .then((r) => r.json())
            .then((data: Application[]) => { setApplications(data); setFiltered(data); })
            .catch(() => setError('Failed to load applications'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchApplications(); }, []);

    useEffect(() => {
        let result = [...applications];
        if (filterStatus !== 'all') result = result.filter((a) => a.status === filterStatus);
        if (filterSource !== 'all') result = result.filter((a) => a.source === filterSource);
        if (filterType   !== 'all') result = result.filter((a) => a.type   === filterType);
        setFiltered(result);
    }, [filterStatus, filterSource, filterType, applications]);

    const handleAdd = async () => {
        if (!form.company_name || !form.role) { setError('Company and role are required'); return; }
        setSaving(true);
        setError('');
        try {
            const res = await apiFetch('/api/applications', { method: 'POST', body: JSON.stringify(form) });
            if (!res.ok) throw new Error();
            setShowForm(false);
            setForm(emptyForm);
            fetchApplications();
        } catch {
            setError('Failed to save application');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this application?')) return;
        await apiFetch(`/api/applications/${id}`, { method: 'DELETE' });
        fetchApplications();
    };

    const handleStatusChange = async (id: number, status: string) => {
        await apiFetch(`/api/applications/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        fetchApplications();
    };

    const handleSourceChange = async (id: number, source: string) => {
        await apiFetch(`/api/applications/${id}/source`, {
            method: 'PATCH',
            body: JSON.stringify({ source }),
        });
        fetchApplications();
    };

    const f = (key: keyof typeof emptyForm) => (v: string) => setForm((p) => ({ ...p, [key]: v }));

    return (
        <>
            <Head title="Applications" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-50">Job Applications</h1>
                        <p className="mt-1 text-sm text-neutral-400">{filtered.length} of {applications.length} applications</p>
                    </div>
                    <button
                        onClick={() => { setShowForm(true); setError(''); setForm({ ...emptyForm, applied_date: localToday() }); }}
                        className="flex items-center gap-2 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-700 sm:px-4 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Application</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <Select label="Status" name="status" value={filterStatus} onChange={setFilterStatus}
                        options={['all', 'applied', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn', 'ghosted']} />
                    <Select label="Source" name="source" value={filterSource} onChange={setFilterSource}
                        options={['all', 'linkedin', 'naukri', 'indeed', 'referral', 'careers_page', 'other']} />
                    <Select label="Type" name="type" value={filterType} onChange={setFilterType}
                        options={['all', 'government', 'corporate', 'startup']} />
                    {(filterStatus !== 'all' || filterSource !== 'all' || filterType !== 'all') && (
                        <button
                            onClick={() => { setFilterStatus('all'); setFilterSource('all'); setFilterType('all'); }}
                            className="mt-5 flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600"
                        >
                            <X className="h-3 w-3" /> Clear
                        </button>
                    )}
                </div>

                {/* Add Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">New Application</h2>
                                <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">{error}</p>}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><Input label="Company Name" name="company_name" value={form.company_name} onChange={f('company_name')} /></div>
                                <div className="col-span-2"><Input label="Role / Position" name="role" value={form.role} onChange={f('role')} /></div>
                                <Select label="Type" name="type" value={form.type} onChange={f('type')} options={['government', 'corporate', 'startup']} />
                                <Select label="Source" name="source" value={form.source} onChange={f('source')} options={['linkedin', 'naukri', 'indeed', 'referral', 'careers_page', 'other']} />
                                <Select label="Status" name="status" value={form.status} onChange={f('status')} options={['applied', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn', 'ghosted']} />
                                <Input label="Applied Date" name="applied_date" type="date" value={form.applied_date} onChange={f('applied_date')} />
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={() => setShowForm(false)}
                                    className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                                    Cancel
                                </button>
                                <button onClick={handleAdd} disabled={saving}
                                    className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-400">
                        <Briefcase className="h-10 w-10 opacity-30" />
                        <p className="text-sm">No applications found</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="flex flex-col gap-3 sm:hidden">
                            {filtered.map((app) => (
                                <div key={app.id} className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{app.company_name}</p>
                                            <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{app.role}</p>
                                        </div>
                                        <button onClick={() => handleDelete(app.id)} className="shrink-0 text-rose-500 hover:text-rose-700">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <Badge label={app.type} className={TYPE_COLORS[app.type]} />
                                        <select
                                            value={app.status}
                                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                            className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold capitalize focus:outline-none ${STATUS_COLORS[app.status]}`}
                                        >
                                            {['applied', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn', 'ghosted'].map((s) => (
                                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                            ))}
                                        </select>
                                        <span className="text-xs text-neutral-400">{fmtDate(app.applied_date)}</span>
                                    </div>
                                    <CommentsCell appId={app.id} comments={[...app.application_comments].reverse()} onRefresh={fetchApplications} />
                                </div>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-700 sm:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 bg-neutral-50 text-left dark:border-neutral-700 dark:bg-neutral-800/50">
                                        {['Company', 'Role', 'Type', 'Source', 'Date', 'Status', 'Comments', 'Actions'].map((h) => (
                                            <th key={h} className="px-4 py-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((app) => (
                                        <tr
                                            key={app.id}
                                            className="border-b border-neutral-100 bg-white transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/50"
                                        >
                                            <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{app.company_name}</td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{app.role}</td>
                                            <td className="px-4 py-3"><Badge label={app.type} className={TYPE_COLORS[app.type]} /></td>
                                            <td className="px-4 py-3 capitalize text-neutral-600 dark:text-neutral-400">
                                                <select
                                                    value={app.source}
                                                    onChange={(e) => handleSourceChange(app.id, e.target.value)}
                                                    className="rounded-full border-0 bg-transparent px-1 py-0.5 text-xs font-medium capitalize focus:outline-none focus:ring-2 focus:ring-neutral-900/20 text-neutral-600 dark:text-neutral-400"
                                                >
                                                    {['linkedin', 'naukri', 'indeed', 'referral', 'careers_page', 'other'].map((s) => (
                                                        <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{fmtDate(app.applied_date)}</td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={app.status}
                                                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                                    className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold capitalize focus:outline-none focus:ring-2 focus:ring-neutral-900/20 ${STATUS_COLORS[app.status]}`}
                                                >
                                                    {['applied', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn', 'ghosted'].map((s) => (
                                                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 min-w-[220px] max-w-xs align-top">
                                                <CommentsCell appId={app.id} comments={[...app.application_comments].reverse()} onRefresh={fetchApplications} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => handleDelete(app.id)} className="text-rose-500 hover:text-rose-700 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

ApplicationsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Applications', href: '/applications' },
    ],
};
