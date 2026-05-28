import { Head, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { BookOpen, Briefcase, CheckCircle2, Github, Linkedin, Minus, PenLine, Phone, Plus, Save, TrendingUp, TriangleAlert, X, XCircle } from 'lucide-react';
import ReminderToggle from '@/components/reminder-toggle';
import { dashboard } from '@/routes';

const csrfToken = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

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

type DailyLog = {
    study_hours: number;
    interview_calls: number;
    linkedin_applications: number;
    naukri_applications: number;
    indeed_applications: number;
    linkedin_updated: boolean;
    naukri_updated: boolean;
    github_updated: boolean;
    indeed_updated: boolean;
};

type ApplicationStats = {
    total: number;
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
};

type FilterMode = 'today' | 'this-week' | 'this-month' | 'single' | 'range';
type AppFilterMode = 'all' | 'this-week' | 'this-month' | 'range';

import { fmt as dateToStr, fmtDisplay, todayStr, weekStart, weekEnd, monthStart, monthEnd, dateToStr as dateObjToStr } from '@/lib/date';

const fmt = dateToStr;
const todayStrVal = todayStr();

const emptyForm = {
    study_hours: '0',
    interview_calls: '0',
    linkedin_applications: '0',
    naukri_applications: '0',
    indeed_applications: '0',
    linkedin_updated: false,
    naukri_updated: false,
    github_updated: false,
    indeed_updated: false,
};

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, gradient, breakdown }: { icon: any; label: string; value: string | number; gradient: string; breakdown?: { date: string; count: number }[] }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className="group relative rounded-2xl border border-white/10 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-neutral-900"
            onMouseEnter={() => breakdown && breakdown.length > 0 && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20 ${gradient} overflow-hidden`} />
            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase dark:text-neutral-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-50">{value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${gradient} shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </div>
            {hovered && breakdown && breakdown.length > 0 && (
                <div className="absolute bottom-full left-0 z-20 mb-2 min-w-[160px] rounded-xl border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                    <p className="mb-1.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">Per Day</p>
                    <ul className="flex max-h-36 flex-col gap-1 overflow-y-auto">
                        {breakdown.map(({ date, count }) => (
                            <li key={date} className="flex items-center justify-between gap-4 text-xs">
                                <span className="text-neutral-500 dark:text-neutral-400">{fmtDisplay(date)}</span>
                                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ─── profile check item ───────────────────────────────────────────────────────

type ProfileCheckProps = {
    icon: any;
    label: string;
    filterMode: FilterMode;
    // today / single
    checked?: boolean;
    // week / month
    count?: number;
    total?: number;
    missedDates?: string[];
};

function ProfileCheckItem({ icon: Icon, label, filterMode, checked, count = 0, total = 0, missedDates = [] }: ProfileCheckProps) {
    const [hovered, setHovered] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const isRange = filterMode === 'this-week' || filterMode === 'this-month' || filterMode === 'range';

    // today: green if checked, yellow if not
    // single: green if checked, red if not
    const isTodayMode   = filterMode === 'today';
    const isSingleMode  = filterMode === 'single';

    const bgClass = isRange
        ? count === total
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400'
            : count === 0
                ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-400'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400'
        : checked
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400'
            : isTodayMode
                ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400'
                : 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-400';

    const StatusIcon = isRange
        ? null
        : checked
            ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            : isTodayMode
                ? <TriangleAlert className="h-4 w-4 text-amber-500" />
                : <XCircle className="h-4 w-4 text-rose-500" />;

    return (
        <div className="relative" ref={ref}
            onMouseEnter={() => isRange && missedDates.length > 0 && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${bgClass}`}>
                {StatusIcon}
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {isRange && (
                    <span className="ml-auto text-xs font-semibold tabular-nums">{count} / {total}</span>
                )}
            </div>

            {/* missed dates tooltip */}
            {hovered && missedDates.length > 0 && (
                <div className="absolute bottom-full left-0 z-20 mb-2 min-w-[140px] rounded-xl border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                    <p className="mb-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wide">Missed</p>
                    <ul className="flex max-h-36 flex-col gap-1 overflow-y-auto">
                        {missedDates.map((d) => (
                            <li key={d} className="text-xs text-rose-500">{fmtDisplay(d)}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ─── number input ─────────────────────────────────────────────────────────────

function NumInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const num = parseFloat(value) || 0;
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label>
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
                <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-transparent text-sm text-neutral-700 focus:outline-none dark:text-neutral-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onChange(String(Math.max(0, num - 1)))}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-700 dark:border-neutral-600 dark:hover:border-neutral-400 dark:hover:text-neutral-200"
                    >
                        <Minus className="h-3 w-3" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange(String(num + 1))}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-700 dark:border-neutral-600 dark:hover:border-neutral-400 dark:hover:text-neutral-200"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── main dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({
    remindersEnabled,
    vapidPublicKey,
}: {
    remindersEnabled: boolean;
    vapidPublicKey: string | null;
}) {
    const { auth } = usePage().props;

    // filter state
    const [filterMode, setFilterMode] = useState<FilterMode>('today');
    const [singleDate, setSingleDate] = useState(todayStrVal);
    const [fromDate, setFromDate]     = useState(todayStrVal);
    const [toDate, setToDate]         = useState(todayStrVal);

    // data state
    const [logs, setLogs]             = useState<DailyLog[]>([]);
    const [allApps, setAllApps]       = useState<any[]>([]);
    const [appStats, setAppStats]     = useState<ApplicationStats>({ total: 0, applied: 0, interview: 0, offer: 0, rejected: 0 });

    // app filter state
    const [appFilterMode, setAppFilterMode] = useState<AppFilterMode>('all');
    const [appFromDate, setAppFromDate]     = useState(todayStrVal);
    const [appToDate, setAppToDate]         = useState(todayStrVal);

    // log entry form state
    const [showForm, setShowForm]   = useState(false);
    const [formDate, setFormDate]   = useState(todayStrVal);
    const [form, setForm]           = useState(emptyForm);
    const [saving, setSaving]       = useState(false);
    const [saveMsg, setSaveMsg]     = useState('');

    const openDailyLogForm = () => {
        setFormDate(todayStrVal);
        setShowForm(true);
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        if (params.get('log') === '1') {
            openDailyLogForm();
            window.history.replaceState({}, '', '/dashboard');
        }
    }, []);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'open-daily-log') {
                openDailyLogForm();
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);

        return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }, []);

    // aggregate logs into one summary
    const summary: DailyLog = logs.reduce((acc, log) => ({
        study_hours:           acc.study_hours           + (log.study_hours ?? 0),
        interview_calls:       acc.interview_calls       + (log.interview_calls ?? 0),
        linkedin_applications: acc.linkedin_applications + (log.linkedin_applications ?? 0),
        naukri_applications:   acc.naukri_applications   + (log.naukri_applications ?? 0),
        indeed_applications:   acc.indeed_applications   + (log.indeed_applications ?? 0),
        linkedin_updated:      acc.linkedin_updated      || log.linkedin_updated,
        naukri_updated:        acc.naukri_updated        || log.naukri_updated,
        github_updated:        acc.github_updated        || log.github_updated,
        indeed_updated:        acc.indeed_updated        || log.indeed_updated,
    }), { study_hours: 0, interview_calls: 0, linkedin_applications: 0, naukri_applications: 0, indeed_applications: 0, linkedin_updated: false, naukri_updated: false, github_updated: false, indeed_updated: false });

    // fetch logs based on filter
    const fetchLogs = () => {
        let url = '';
        if (filterMode === 'today')      url = `/api/daily-logs/${todayStrVal}`;
        if (filterMode === 'this-week')  url = `/api/daily-logs/range?from=${weekStart()}&to=${weekEnd()}`;
        if (filterMode === 'this-month') url = `/api/daily-logs/range?from=${monthStart()}&to=${monthEnd()}`;
        if (filterMode === 'single')     url = `/api/daily-logs/${singleDate}`;
        if (filterMode === 'range')      url = `/api/daily-logs/range?from=${fromDate}&to=${toDate}`;

        apiFetch(url)
            .then((r) => r.json())
            .then((data) => setLogs(Array.isArray(data) ? data : data ? [data] : []))
            .catch(() => setLogs([]));
    };

    useEffect(() => { fetchLogs(); }, [filterMode, singleDate, fromDate, toDate]);

    // fetch application stats
    useEffect(() => {
        apiFetch('/api/applications')
            .then((r) => r.json())
            .then((data: any[]) => setAllApps(data))
            .catch(() => {});
    }, []);

    // recompute app stats whenever allApps or app filter changes
    useEffect(() => {
        let data = [...allApps];

        if (appFilterMode !== 'all') {
            let from = '';
            let to = todayStrVal;

            if (appFilterMode === 'this-week') {
                from = weekStart();
                to   = weekEnd();
            } else if (appFilterMode === 'this-month') {
                from = monthStart();
                to   = monthEnd();
            } else if (appFilterMode === 'range') {
                from = appFromDate;
                to   = appToDate;
            }

            data = data.filter((a) => a.applied_date >= from && a.applied_date <= to);
        }

        setAppStats({
            total:     data.length,
            applied:   data.filter((a) => a.status === 'applied').length,
            interview: data.filter((a) => a.status === 'interview').length,
            offer:     data.filter((a) => a.status === 'offer').length,
            rejected:  data.filter((a) => a.status === 'rejected').length,
        });
    }, [allApps, appFilterMode, appFromDate, appToDate]);

    // when form date changes load existing data for that date
    useEffect(() => {
        if (!showForm) return;
        apiFetch(`/api/daily-logs/${formDate}`)
            .then((r) => r.json())
            .then((data) => {
                if (data) {
                    setForm({
                        study_hours:           String(data.study_hours ?? '0'),
                        interview_calls:       String(data.interview_calls ?? '0'),
                        linkedin_applications: String(data.linkedin_applications ?? '0'),
                        naukri_applications:   String(data.naukri_applications ?? '0'),
                        indeed_applications:   String(data.indeed_applications ?? '0'),
                        linkedin_updated:      data.linkedin_updated ?? false,
                        naukri_updated:        data.naukri_updated ?? false,
                        github_updated:        data.github_updated ?? false,
                        indeed_updated:        data.indeed_updated ?? false,
                    });
                } else {
                    setForm(emptyForm);
                }
            })
            .catch(() => setForm(emptyForm));
    }, [formDate, showForm]);

    // save log
    const handleSave = async () => {
        setSaving(true);
        setSaveMsg('');
        try {
            const payload = {
                study_hours:           parseFloat(form.study_hours) || 0,
                interview_calls:       parseInt(form.interview_calls) || 0,
                linkedin_applications: parseInt(form.linkedin_applications) || 0,
                naukri_applications:   parseInt(form.naukri_applications) || 0,
                indeed_applications:   parseInt(form.indeed_applications) || 0,
                linkedin_updated:      form.linkedin_updated,
                naukri_updated:        form.naukri_updated,
                github_updated:        form.github_updated,
                indeed_updated:        form.indeed_updated,
            };

            // use updateOrCreate via saveTodayLog but for any date
            await apiFetch(`/api/daily-logs/save`, {
                method: 'POST',
                body: JSON.stringify({ ...payload, date: formDate }),
            });

            setSaveMsg('Saved!');
            setTimeout(() => { setSaveMsg(''); setShowForm(false); }, 1000);
            fetchLogs();
        } catch {
            setSaveMsg('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const f = (key: keyof typeof emptyForm) => (v: string | boolean) =>
        setForm((p) => ({ ...p, [key]: v }));

    // ── profile update stats for week/month modes ──
    const profileFields = [
        { key: 'linkedin_updated' as const, label: 'LinkedIn', icon: Linkedin },
        { key: 'naukri_updated'   as const, label: 'Naukri',   icon: TrendingUp },
        { key: 'github_updated'   as const, label: 'GitHub',   icon: Github },
        { key: 'indeed_updated'   as const, label: 'Indeed',   icon: TrendingUp },
    ];

    // dates that exist in the current range (past days only, up to today)
    const rangeFrom = filterMode === 'this-week' ? weekStart() : filterMode === 'this-month' ? monthStart() : filterMode === 'range' ? fromDate : null;
    const rangeTo   = filterMode === 'this-week' ? weekEnd()   : filterMode === 'this-month' ? monthEnd()   : filterMode === 'range' ? toDate   : null;

    const pastDatesInRange = (() => {
        if (!rangeFrom || !rangeTo) return [];
        const dates: string[] = [];
        const cur = new Date(rangeFrom + 'T00:00:00');
        const end = new Date(Math.min(new Date(rangeTo + 'T00:00:00').getTime(), new Date(todayStrVal + 'T00:00:00').getTime()));
        while (cur <= end) { dates.push(dateObjToStr(cur)); cur.setDate(cur.getDate() + 1); }
        return dates;
    })();

    const profileStats = profileFields.map(({ key, label, icon }) => {
        const updatedDates = new Set(logs.filter((l: any) => l[key]).map((l: any) => l.date?.split('T')[0] ?? l.date));
        const missedDates  = pastDatesInRange.filter((d) => !updatedDates.has(d));
        return { key, label, icon, count: updatedDates.size, total: pastDatesInRange.length, missedDates };
    });

    // interview calls breakdown per date (for week/month/range)
    const isMultiDay = filterMode === 'this-week' || filterMode === 'this-month' || filterMode === 'range';
    const interviewBreakdown = isMultiDay
        ? logs
            .filter((l: any) => (l.interview_calls ?? 0) > 0)
            .map((l: any) => ({ date: l.date?.split('T')[0] ?? l.date, count: l.interview_calls }))
            .sort((a, b) => a.date.localeCompare(b.date))
        : [];

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-8 p-4 sm:p-6">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {greeting}, {auth.user?.name?.split(' ')[0]} 👋
                        </h1>
                        <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">{today}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ReminderToggle enabled={remindersEnabled} vapidPublicKey={vapidPublicKey} />
                    </div>
                </div>

                {/* Log Entry Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">

                            {/* modal header */}
                            <div className="mb-5 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Daily Log Entry</h2>
                                <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* date picker — today or past */}
                            <div className="mb-5 flex flex-col gap-1">
                                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Date</label>
                                <input
                                    type="date"
                                    value={formDate}
                                    max={todayStrVal}
                                    onChange={(e) => setFormDate(e.target.value)}
                                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                                />
                                {formDate !== todayStrVal && (
                                    <p className="text-xs text-amber-500">Editing past date: {formDate}</p>
                                )}
                            </div>

                            {/* counts */}
                            <div className="mb-5 grid grid-cols-2 gap-4">
                                <NumInput label="Study Hours"          value={form.study_hours}           onChange={f('study_hours')} />
                                <NumInput label="Interview Calls"      value={form.interview_calls}       onChange={f('interview_calls')} />
                                <NumInput label="LinkedIn Applications" value={form.linkedin_applications} onChange={f('linkedin_applications')} />
                                <NumInput label="Naukri Applications"  value={form.naukri_applications}   onChange={f('naukri_applications')} />
                                <NumInput label="Indeed Applications"  value={form.indeed_applications}   onChange={f('indeed_applications')} />
                            </div>

                            {/* profile checkboxes */}
                            <div className="mb-6">
                                <p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">Profile Updated</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {([
                                        { key: 'linkedin_updated', label: 'LinkedIn' },
                                        { key: 'naukri_updated',   label: 'Naukri' },
                                        { key: 'github_updated',   label: 'GitHub' },
                                        { key: 'indeed_updated',   label: 'Indeed' },
                                    ] as { key: keyof typeof emptyForm; label: string }[]).map(({ key, label }) => (
                                        <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700">
                                            <input
                                                type="checkbox"
                                                checked={form[key] as boolean}
                                                onChange={(e) => f(key)(e.target.checked)}
                                                className="h-4 w-4 rounded accent-neutral-900"
                                            />
                                            <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* actions */}
                            <div className="flex items-center justify-end gap-3">
                                {saveMsg && (
                                    <span className={`text-sm font-medium ${saveMsg === 'Saved!' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {saveMsg}
                                    </span>
                                )}
                                <button onClick={() => setShowForm(false)}
                                    className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                    className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
                                    <Save className="h-4 w-4" />
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Date Filter */}
                <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase dark:text-neutral-500">Activity</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex overflow-x-auto rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900">
                                {(['today', 'this-week', 'this-month', 'single', 'range'] as FilterMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setFilterMode(mode)}
                                        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                            filterMode === mode
                                                ? 'bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900'
                                                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                                        }`}
                                    >
                                        {mode === 'today' ? 'Today' : mode === 'this-week' ? 'This Week' : mode === 'this-month' ? 'This Month' : mode === 'single' ? 'Single Day' : 'Custom'}
                                    </button>
                                ))}
                            </div>
                            {filterMode === 'single' && (
                                <div className="flex items-center gap-2">
                                    <input type="date" value={singleDate} max={todayStrVal}
                                        onChange={(e) => setSingleDate(e.target.value)}
                                        className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200" />
                                    <button onClick={() => { setSingleDate(todayStrVal); setFilterMode('today'); }} className="text-neutral-400 hover:text-neutral-600">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                            {filterMode === 'range' && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <input type="date" value={fromDate} max={toDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200" />
                                    <span className="text-xs text-neutral-400">to</span>
                                    <input type="date" value={toDate} min={fromDate} max={todayStrVal}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200" />
                                </div>
                            )}
                        </div>
                    </div>

                {/* Activity Stats + Profile Updates */}
                    <button
                        onClick={openDailyLogForm}
                        className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-4 text-left transition hover:border-neutral-400 hover:bg-white dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 shadow-sm dark:bg-white">
                                <PenLine className="h-4 w-4 text-white dark:text-neutral-900" />
                            </div>
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Log Today's Activity</p>
                        </div>
                        <span className="text-xs font-medium text-neutral-400 transition group-hover:text-neutral-700 dark:group-hover:text-neutral-200">Tap to log →</span>
                    </button>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        <StatCard icon={Phone}      label="Interview Calls"  value={summary.interview_calls}      gradient="bg-blue-500" breakdown={interviewBreakdown} />
                        <StatCard icon={BookOpen}   label="Study Hours"      value={`${summary.study_hours}h`}    gradient="bg-violet-500" />
                        <StatCard icon={TrendingUp} label="LinkedIn Applied" value={summary.linkedin_applications} gradient="bg-sky-500" />
                        <StatCard icon={TrendingUp} label="Naukri Applied"   value={summary.naukri_applications}  gradient="bg-orange-500" />
                        <StatCard icon={TrendingUp} label="Indeed Applied"   value={summary.indeed_applications}  gradient="bg-indigo-500" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                        {profileFields.map(({ key, label, icon }) => {
                            const stat = profileStats.find((s) => s.key === key)!;
                            const isRangeMode = filterMode === 'this-week' || filterMode === 'this-month' || filterMode === 'range';
                            return (
                                <ProfileCheckItem
                                    key={key}
                                    icon={icon}
                                    label={label}
                                    filterMode={filterMode}
                                    checked={summary[key]}
                                    count={isRangeMode ? stat.count : undefined}
                                    total={isRangeMode ? stat.total : undefined}
                                    missedDates={isRangeMode ? stat.missedDates : undefined}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Job Applications Overview */}
                <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase dark:text-neutral-500">Applications Overview</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex overflow-x-auto rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900">
                                {(['all', 'this-week', 'this-month', 'range'] as AppFilterMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setAppFilterMode(mode)}
                                        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                            appFilterMode === mode
                                                ? 'bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900'
                                                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                                        }`}
                                    >
                                        {mode === 'all' ? 'All Time' : mode === 'this-week' ? 'This Week' : mode === 'this-month' ? 'This Month' : 'Custom'}
                                    </button>
                                ))}
                            </div>
                            {appFilterMode === 'range' && (
                                <div className="flex items-center gap-2">
                                    <input type="date" value={appFromDate} max={appToDate}
                                        onChange={(e) => setAppFromDate(e.target.value)}
                                        className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200" />
                                    <span className="text-xs text-neutral-400">to</span>
                                    <input type="date" value={appToDate} min={appFromDate} max={todayStrVal}
                                        onChange={(e) => setAppToDate(e.target.value)}
                                        className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard icon={Briefcase} label="Total Applied"   value={appStats.total}     gradient="bg-neutral-500" />
                        <StatCard icon={Briefcase} label="In Interview"    value={appStats.interview} gradient="bg-amber-500" />
                        <StatCard icon={Briefcase} label="Offers"          value={appStats.offer}     gradient="bg-emerald-500" />
                        <StatCard icon={Briefcase} label="Rejected"        value={appStats.rejected}  gradient="bg-rose-500" />
                    </div>
                </div>



            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
