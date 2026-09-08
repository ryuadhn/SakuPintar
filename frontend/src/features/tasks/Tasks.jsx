import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    CalendarDays,
    Check,
    Clock3,
    ListChecks,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useFinance } from '../../contexts/FinanceContext';
import { formatDateID, todayISO } from '../../utils/format';
import ReminderModal from '../../components/shared/ReminderModal';
import Modal from '../../components/ui/Modal';

const FILTERS = [
    { value: 'all', label: 'Semua' },
    { value: 'today', label: 'Hari Ini' },
    { value: 'upcoming', label: 'Mendatang' },
    { value: 'completed', label: 'Selesai' },
];

const PRIORITY_LABELS = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
};

const PRIORITY_STYLES = {
    low: 'ui-tone-info',
    medium: 'ui-tone-warning',
    high: 'ui-tone-danger',
};

const GROUPS = [
    { value: 'today', label: 'Hari Ini', description: 'Termasuk tugas yang terlambat.' },
    { value: 'upcoming', label: 'Mendatang', description: 'Tugas dengan tanggal di depan.' },
    { value: 'completed', label: 'Selesai', description: 'Tugas yang sudah dituntaskan.' },
];

const getTaskGroup = (task, today) => {
    if (task.isCompleted) return 'completed';
    return task.date > today ? 'upcoming' : 'today';
};

const sortTasks = (a, b) => {
    const dateOrder = (a.date || '').localeCompare(b.date || '');
    if (dateOrder !== 0) return dateOrder;
    return (a.time || '99:99').localeCompare(b.time || '99:99');
};

const formatDueDate = (date, today) => {
    if (date === today) return 'Hari ini';
    return formatDateID(date);
};

export default function Tasks() {
    const {
        reminders = [],
        toggleReminder,
        deleteReminder,
        syncLoading = false,
        syncError = '',
        retrySync,
        calendarBusy = false,
        calendarError = '',
        clearCalendarError,
    } = useFinance();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isTaskOpen, setIsTaskOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [deletingTask, setDeletingTask] = useState(null);
    const today = todayISO();
    const requestedFilter = searchParams.get('filter');
    const activeFilter = FILTERS.some((filter) => filter.value === requestedFilter) ? requestedFilter : 'all';
    const actionsDisabled = syncLoading || calendarBusy;

    const tasks = useMemo(
        () => reminders.filter((reminder) => reminder.type === 'task'),
        [reminders],
    );

    const taskStats = useMemo(() => ({
        total: tasks.length,
        completed: tasks.filter((task) => task.isCompleted).length,
        today: tasks.filter((task) => getTaskGroup(task, today) === 'today').length,
    }), [tasks, today]);

    const visibleGroups = useMemo(() => GROUPS.map((group) => ({
        ...group,
        tasks: tasks
            .filter((task) => getTaskGroup(task, today) === group.value)
            .filter((task) => activeFilter === 'all' || activeFilter === group.value)
            .sort(sortTasks),
    })).filter((group) => group.tasks.length > 0), [tasks, today, activeFilter]);

    const hasVisibleTasks = visibleGroups.some((group) => group.tasks.length > 0);
    const hasTasks = tasks.length > 0;

    const changeFilter = (filter) => {
        if (filter === 'all') setSearchParams({});
        else setSearchParams({ filter });
    };

    const openAddTask = () => {
        clearCalendarError();
        setEditingTask(null);
        setIsTaskOpen(true);
    };

    const openEditTask = (task) => {
        clearCalendarError();
        setEditingTask(task);
        setIsTaskOpen(true);
    };

    const requestDeleteTask = (task) => {
        clearCalendarError();
        setDeletingTask(task);
    };

    const confirmDeleteTask = async () => {
        if (!deletingTask) return;
        const deleted = await deleteReminder(deletingTask.id);
        if (deleted) setDeletingTask(null);
    };

    return (
        <AuthenticatedLayout>
            <div className="app-page">
                <header className="app-page-header">
                    <div className="max-w-2xl">
                        <p className="text-xs font-medium text-emerald-800">Ruang fokus</p>
                        <h1 className="app-page-title mt-1">Tugas</h1>
                        <p className="app-page-description max-w-xl">
                            Catat hal penting dengan ringan. Setiap tugas tetap terhubung ke tanggal di kalender Anda.
                        </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <Link
                            to="/calendar"
                            className="ui-button inline-flex w-full items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
                        >
                            <CalendarDays className="h-4 w-4" aria-hidden="true" />
                            Buka kalender
                        </Link>
                        <button
                            type="button"
                            onClick={openAddTask}
                            disabled={actionsDisabled}
                            className="ui-button inline-flex w-full items-center justify-center gap-2 bg-emerald-800 text-white transition-colors hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Tambah tugas
                        </button>
                    </div>
                </header>

                {syncLoading && (
                    <div role="status" aria-live="polite" className="ui-notice border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-800">
                        Memuat tugas...
                    </div>
                )}
                {syncError && (
                    <div role="alert" className="ui-notice flex flex-col gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 sm:flex-row sm:items-center sm:justify-between">
                        <span>{syncError}</span>
                        <button
                            type="button"
                            onClick={retrySync}
                            className="ui-button ui-button-touch inline-flex items-center justify-center px-3 text-xs font-medium text-rose-800 transition-colors hover:bg-rose-100"
                        >
                            Coba lagi
                        </button>
                    </div>
                )}
                {calendarError && !isTaskOpen && !deletingTask && (
                    <div role="alert" className="ui-notice flex flex-col gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 sm:flex-row sm:items-center sm:justify-between">
                        <span>{calendarError}</span>
                        <button
                            type="button"
                            onClick={clearCalendarError}
                            className="ui-button ui-button-touch inline-flex items-center justify-center px-3 text-xs font-medium text-rose-800 transition-colors hover:bg-rose-100"
                        >
                            Tutup
                        </button>
                    </div>
                )}

                <section className="ui-card grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 sm:p-5" aria-label="Ringkasan tugas">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800">
                            <ListChecks className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500">Semua tugas</p>
                            <p className="mt-0.5 text-base font-semibold text-slate-800">{taskStats.total}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 border-t border-[#e2e9e3] pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-800">
                            <Clock3 className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500">Perlu perhatian</p>
                            <p className="mt-0.5 text-base font-semibold text-slate-800">{taskStats.today}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 border-t border-[#e2e9e3] pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                            <Check className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500">Sudah selesai</p>
                            <p className="mt-0.5 text-base font-semibold text-slate-800">{taskStats.completed}</p>
                        </div>
                    </div>
                </section>

                <section className="ui-card flex flex-col gap-4 p-4 sm:p-5" aria-busy={syncLoading} aria-labelledby="task-list-heading">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 id="task-list-heading" className="ui-section-title">Daftar tugas</h2>
                            <p className="ui-section-description">Pilih status untuk melihat daftar yang ingin Anda fokuskan.</p>
                        </div>
                        <div className="flex w-max max-w-full shrink-0 flex-nowrap items-center gap-0.5 overflow-x-auto rounded-lg bg-slate-100/70 p-0.5" role="group" aria-label="Filter tugas">
                            {FILTERS.map((filter) => (
                                <button
                                    key={filter.value}
                                    type="button"
                                    onClick={() => changeFilter(filter.value)}
                                    aria-pressed={activeFilter === filter.value}
                                    className={`min-h-8 shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-1 ${activeFilter === filter.value ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-white hover:text-slate-800 active:bg-slate-200'}`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {syncLoading && !hasTasks ? (
                        <div role="status" className="ui-empty">
                            Menyiapkan daftar tugas Anda...
                        </div>
                    ) : syncError && !hasTasks ? (
                        <div className="ui-empty flex flex-col items-center gap-3">
                            <p className="font-semibold text-slate-700">Tugas belum dapat dimuat</p>
                            <p className="text-xs leading-relaxed text-slate-500">Periksa koneksi Anda lalu coba lagi untuk memuat daftar tugas.</p>
                            <button type="button" onClick={retrySync} className="ui-button-compact text-emerald-800 hover:bg-emerald-50">
                                Coba lagi
                            </button>
                        </div>
                    ) : !hasTasks ? (
                        <div className="ui-empty flex flex-col items-center gap-3">
                            <ListChecks className="h-8 w-8 text-emerald-700" aria-hidden="true" />
                            <div>
                                <p className="font-semibold text-slate-700">Belum ada tugas</p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500">Tambahkan satu tugas kecil untuk mulai mengatur hari Anda.</p>
                            </div>
                            <button type="button" onClick={openAddTask} className="ui-button-compact inline-flex items-center gap-1.5 text-emerald-800 hover:bg-emerald-50">
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Tambah tugas pertama
                            </button>
                        </div>
                    ) : !hasVisibleTasks ? (
                        <div className="ui-empty flex flex-col items-center gap-3">
                            <ListChecks className="h-8 w-8 text-slate-400" aria-hidden="true" />
                            <p className="font-semibold text-slate-700">Belum ada tugas di bagian ini.</p>
                            <p className="text-xs leading-relaxed text-slate-500">Coba pilih filter lain atau tambahkan tugas baru.</p>
                            <button type="button" onClick={() => changeFilter('all')} className="ui-button-compact text-emerald-800 hover:bg-emerald-50">
                                Lihat semua tugas
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {visibleGroups.map((group) => (
                                <section key={group.value} aria-labelledby={`task-group-${group.value}`}>
                                    <div className="mb-2 flex items-end justify-between gap-3">
                                        <div>
                                            <h3 id={`task-group-${group.value}`} className="text-sm font-semibold text-slate-800">{group.label}</h3>
                                            <p className="mt-0.5 text-xs text-slate-500">{group.description}</p>
                                        </div>
                                        <span className="text-xs font-medium text-slate-500">{group.tasks.length} tugas</span>
                                    </div>
                                    <div className="divide-y divide-[#e2e9e3] overflow-hidden rounded-xl border border-[#e2e9e3]">
                                        {group.tasks.map((task) => {
                                            const isCompleted = task.isCompleted;
                                            const isOverdue = !isCompleted && task.date < today;
                                            return (
                                                <article key={task.id} className={`p-3.5 ${isCompleted ? 'bg-slate-50/80' : 'bg-white'}`}>
                                                    <div className="flex items-start gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleReminder(task.id)}
                                                            disabled={actionsDisabled}
                                                            aria-pressed={isCompleted}
                                                            aria-label={isCompleted ? `Tandai ${task.title} belum selesai` : `Tandai ${task.title} selesai`}
                                                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 ${isCompleted ? 'border-emerald-700 bg-emerald-800 text-white' : 'border-slate-300 bg-white text-transparent hover:border-emerald-600'}`}
                                                        >
                                                            <Check className="h-4 w-4" aria-hidden="true" />
                                                        </button>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                                <div className="min-w-0">
                                                                     <div className="flex flex-wrap items-center gap-2">
                                                                         <h4 className={`text-sm font-semibold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{task.title}</h4>
                                                                         {task.priority && (
                                                                             <span className={`ui-badge ${PRIORITY_STYLES[task.priority] || ''}`}>{PRIORITY_LABELS[task.priority]}</span>
                                                                         )}
                                                                         {isCompleted && <span className="ui-badge border-slate-200 bg-slate-100 text-slate-600">Selesai</span>}
                                                                     </div>
                                                                     <div className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium ${isOverdue ? 'text-rose-700' : 'text-slate-500'}`}>
                                                                         {isOverdue && <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700">Terlambat</span>}
                                                                         <span className="inline-flex items-center gap-1.5">
                                                                             <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                                                                             {formatDueDate(task.date, today)}
                                                                        </span>
                                                                        {task.time && (
                                                                            <span className="inline-flex items-center gap-1.5">
                                                                                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                                                                                {task.time}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openEditTask(task)}
                                                                        disabled={actionsDisabled}
                                                                        aria-label={`Edit tugas ${task.title}`}
                                                                        className="ui-icon-button"
                                                                    >
                                                                        <Pencil className="h-4 w-4" aria-hidden="true" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => requestDeleteTask(task)}
                                                                        disabled={actionsDisabled}
                                                                        aria-label={`Hapus tugas ${task.title}`}
                                                                        className="ui-icon-button ui-icon-button-danger"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {task.notes && <p className={`mt-2 text-xs leading-relaxed ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>{task.notes}</p>}
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <ReminderModal
                isOpen={isTaskOpen}
                onClose={() => setIsTaskOpen(false)}
                editing={editingTask}
                initialDate={today}
                taskOnly
            />
            <Modal
                isOpen={Boolean(deletingTask)}
                onClose={() => setDeletingTask(null)}
                title="Hapus tugas"
            >
                <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-slate-600">
                        Hapus tugas <strong className="font-bold text-slate-900">{deletingTask?.title}</strong>? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    {calendarError && (
                        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold leading-relaxed text-rose-800">
                            {calendarError}
                        </p>
                    )}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button type="button" onClick={() => setDeletingTask(null)} className="ui-button ui-button-touch bg-slate-100 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200">
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeleteTask}
                            disabled={actionsDisabled}
                            className="ui-button ui-button-touch bg-rose-700 text-sm font-medium text-white transition-colors hover:bg-rose-800 disabled:pointer-events-none disabled:opacity-60"
                        >
                            {syncLoading ? 'Memuat...' : calendarBusy ? 'Menghapus...' : 'Hapus tugas'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
