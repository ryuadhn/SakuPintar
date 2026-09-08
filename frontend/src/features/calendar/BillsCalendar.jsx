import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useFinance } from '../../contexts/FinanceContext';
import { FREQ_LABELS, fmtIDR, formatDateID, monthKeyOf, recurringTransactionId } from '../../utils/format';
import {
    ArrowDownRight,
    ArrowUpRight,
    Bell,
    CalendarClock,
    Check,
    ChevronLeft,
    ChevronRight,
    CircleDot,
    ListChecks,
    Pencil,
    Plus,
    Repeat2,
    ToggleLeft,
    ToggleRight,
    Trash2,
} from 'lucide-react';
import RecurringModal from '../../components/shared/RecurringModal';
import ReminderModal from '../../components/shared/ReminderModal';
import Modal from '../../components/ui/Modal';

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const REMINDER_TYPE_LABELS = {
    finance: 'Keuangan',
    task: 'Tugas',
    schedule: 'Jadwal',
    other: 'Lainnya',
};

const REMINDER_META = {
    finance: {
        label: 'Reminder keuangan',
        icon: Bell,
        chip: 'ui-tone-warning',
        dotClass: 'bg-amber-500',
        card: 'border-amber-200 bg-amber-50/30',
        iconBox: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    task: {
        label: 'Tugas',
        icon: ListChecks,
        chip: 'ui-tone-neutral',
        dotClass: 'bg-slate-500',
        card: 'border-slate-200 bg-slate-50/40',
        iconBox: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    schedule: {
        label: 'Jadwal',
        icon: CalendarClock,
        chip: 'ui-tone-info',
        dotClass: 'bg-sky-500',
        card: 'border-sky-200 bg-sky-50/20',
        iconBox: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    other: {
        label: 'Lainnya',
        icon: CircleDot,
        chip: 'ui-tone-neutral',
        dotClass: 'bg-stone-500',
        card: 'border-stone-200 bg-stone-50/50',
        iconBox: 'bg-stone-100 text-stone-700 border-stone-200',
    },
};

const LEGEND_ITEMS = [
    { label: 'Aktivitas keuangan', dotClass: 'bg-emerald-600' },
    { label: 'Reminder keuangan', dotClass: 'bg-amber-500' },
    { label: 'Tugas', dotClass: 'bg-slate-500' },
    { label: 'Jadwal', dotClass: 'bg-sky-500' },
    { label: 'Lainnya', dotClass: 'bg-stone-500' },
];

const getReminderMeta = (type) => REMINDER_META[type] || REMINDER_META.other;

const getDateKey = (year, month, day) => (
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
);

const parseISODate = (iso) => {
    if (typeof iso !== 'string') return null;
    const [year, month, day] = iso.split('-').map(Number);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > new Date(year, month, 0).getDate()) return null;
    return { year, month: month - 1, day };
};

const utcDay = ({ year, month, day }) => Date.UTC(year, month, day);

const isRecurringOccurrenceOnDate = (rule, year, month, day) => {
    if (!rule.active || !rule.nextDate) return false;

    const start = parseISODate(rule.nextDate);
    const target = { year, month, day };
    if (!start || utcDay(target) < utcDay(start)) return false;

    const daysSinceStart = Math.round((utcDay(target) - utcDay(start)) / 86400000);
    if (rule.frequency === 'daily') return true;
    if (rule.frequency === 'weekly') return daysSinceStart % 7 === 0;
    if (rule.frequency === 'monthly') {
        const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate();
        const parsedAnchorDay = Number(rule.anchorDay);
        const anchorDay = Number.isInteger(parsedAnchorDay) && parsedAnchorDay >= 1 && parsedAnchorDay <= 31
            ? parsedAnchorDay
            : start.day;
        return day === Math.min(anchorDay, lastDayOfTargetMonth);
    }
    return false;
};

const formatLongDate = (year, month, day) => (
    new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(year, month, day))
);

const formatShortTime = (time) => time || 'Tanpa waktu';

const getSignedAmount = (type, amount) => {
    if (type === 'income') return `+${fmtIDR(amount)}`;
    if (type === 'expense') return `-${fmtIDR(amount)}`;
    return fmtIDR(amount);
};

export default function BillsCalendar() {
    const {
        transactions = [],
        recurringRules = [],
        reminders = [],
        categories = [],
        wallets = [],
        toggleRecurringRule,
        deleteRecurringRule,
        toggleReminder,
        deleteReminder,
        syncLoading = false,
        syncError = '',
        retrySync,
        calendarBusy = false,
        calendarError = '',
        clearCalendarError,
    } = useFinance();
    const [isRecurringOpen, setIsRecurringOpen] = useState(false);
    const [isReminderOpen, setIsReminderOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [deletingReminder, setDeletingReminder] = useState(null);
    const [deletingRecurring, setDeletingRecurring] = useState(null);

    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const selectedDateIsToday = selectedDay === today.getDate()
        && currentMonth === today.getMonth()
        && currentYear === today.getFullYear();
    const calendarActionsDisabled = syncLoading || calendarBusy;

    const daysInMonth = useMemo(
        () => new Date(currentYear, currentMonth + 1, 0).getDate(),
        [currentYear, currentMonth],
    );

    const startDayOfWeek = useMemo(() => {
        const day = new Date(currentYear, currentMonth, 1).getDay();
        return day === 0 ? 6 : day - 1;
    }, [currentYear, currentMonth]);

    const calendarCells = useMemo(() => {
        const cells = [];
        for (let i = 0; i < startDayOfWeek; i += 1) {
            cells.push({ dayNumber: null, key: `empty-${i}` });
        }
        for (let day = 1; day <= daysInMonth; day += 1) {
            cells.push({ dayNumber: day, key: `day-${day}` });
        }
        const trailingEmptyCells = (7 - (cells.length % 7)) % 7;
        for (let i = 0; i < trailingEmptyCells; i += 1) {
            cells.push({ dayNumber: null, key: `empty-end-${i}` });
        }
        return cells;
    }, [daysInMonth, startDayOfWeek]);

    const getRulesForDay = (dayNumber) => {
        if (!dayNumber) return [];
        return recurringRules.filter((rule) => isRecurringOccurrenceOnDate(
            rule,
            currentYear,
            currentMonth,
            dayNumber,
        ));
    };

    const getTransactionsForDay = (dayNumber) => {
        if (!dayNumber) return [];
        return transactions.filter((transaction) => (
            transaction.date === getDateKey(currentYear, currentMonth, dayNumber)
        ));
    };

    const getRemindersForDay = (dayNumber) => {
        if (!dayNumber) return [];
        return reminders.filter((reminder) => (
            reminder.date === getDateKey(currentYear, currentMonth, dayNumber)
        ));
    };

    const selectedDayRules = useMemo(
        () => getRulesForDay(selectedDay),
        [selectedDay, currentYear, currentMonth, recurringRules],
    );

    const selectedDayTransactions = useMemo(
        () => getTransactionsForDay(selectedDay),
        [selectedDay, currentYear, currentMonth, transactions],
    );

    const selectedDayReminders = useMemo(
        () => getRemindersForDay(selectedDay),
        [selectedDay, currentYear, currentMonth, reminders],
    );

    const financialAgenda = useMemo(() => {
        const transactionItems = selectedDayTransactions.map((transaction) => ({
            ...transaction,
            itemType: 'transaction',
            sortTime: transaction.time || '99:99',
        }));
        const recurringItems = selectedDayRules.map((rule) => ({
            ...rule,
            itemType: 'recurring',
            sortTime: '00:00',
        }));
        return [...transactionItems, ...recurringItems].sort((a, b) => (
            a.sortTime.localeCompare(b.sortTime)
        ));
    }, [selectedDayRules, selectedDayTransactions]);

    const selectedAgendaCount = financialAgenda.length + selectedDayReminders.length;
    const completedReminderCount = selectedDayReminders.filter((reminder) => reminder.isCompleted).length;

    const monthlyStats = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        const monthKey = getDateKey(currentYear, currentMonth, 1).slice(0, 7);
        const monthTransactions = transactions.filter((transaction) => monthKeyOf(transaction.date) === monthKey);
        const postedRecurringIds = new Set();

        recurringRules.forEach((rule) => {
            monthTransactions.forEach((transaction) => {
                if (transaction.id === recurringTransactionId(rule.id, transaction.date)) {
                    postedRecurringIds.add(transaction.id);
                }
            });
        });

        monthTransactions.forEach((transaction) => {
            if (!transaction.auto && !postedRecurringIds.has(transaction.id)) return;
            const amount = Number(transaction.amount) || 0;
            if (transaction.type === 'income') totalIncome += amount;
            else if (transaction.type === 'expense') totalExpense += amount;
        });

        recurringRules.forEach((rule) => {
            if (!rule.active) return;
            for (let day = 1; day <= new Date(currentYear, currentMonth + 1, 0).getDate(); day += 1) {
                if (!isRecurringOccurrenceOnDate(rule, currentYear, currentMonth, day)) continue;
                const occurrenceId = recurringTransactionId(rule.id, getDateKey(currentYear, currentMonth, day));
                if (postedRecurringIds.has(occurrenceId)) continue;
                const amount = Number(rule.amount) || 0;
                if (rule.type === 'income') totalIncome += amount;
                else totalExpense += amount;
            }
        });

        return { totalIncome, totalExpense };
    }, [currentYear, currentMonth, recurringRules, transactions]);

    const upcomingBills = useMemo(() => {
        const list = [];
        const todayParts = { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
        const todayMs = utcDay(todayParts);

        for (let offset = 0; offset < 14; offset += 1) {
            const scanDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
            recurringRules
                .filter((rule) => isRecurringOccurrenceOnDate(
                    rule,
                    scanDate.getFullYear(),
                    scanDate.getMonth(),
                    scanDate.getDate(),
                ))
                .forEach((rule) => {
                    const scanParts = {
                        year: scanDate.getFullYear(),
                        month: scanDate.getMonth(),
                        day: scanDate.getDate(),
                    };
                    list.push({
                        rule,
                        date: scanDate,
                        daysRemaining: Math.round((utcDay(scanParts) - todayMs) / 86400000),
                    });
                });
        }

        return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [recurringRules, today.getFullYear(), today.getMonth(), today.getDate()]);

    const goToMonth = (offset) => {
        const nextMonth = new Date(currentYear, currentMonth + offset, 1);
        setCurrentYear(nextMonth.getFullYear());
        setCurrentMonth(nextMonth.getMonth());
        setSelectedDay(1);
    };

    const goToToday = () => {
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth());
        setSelectedDay(today.getDate());
    };

    const openAddReminder = () => {
        setEditingReminder(null);
        setIsReminderOpen(true);
    };

    const openEditReminder = (reminder) => {
        setEditingReminder(reminder);
        setIsReminderOpen(true);
    };

    const requestDeleteReminder = (reminder) => {
        clearCalendarError();
        setDeletingReminder(reminder);
    };

    const requestDeleteRecurring = (rule) => {
        clearCalendarError();
        setDeletingRecurring(rule);
    };

    const confirmDeleteReminder = async () => {
        if (!deletingReminder) return;
        const deleted = await deleteReminder(deletingReminder.id);
        if (deleted) setDeletingReminder(null);
    };

    const confirmDeleteRecurring = async () => {
        if (!deletingRecurring) return;
        const deleted = await deleteRecurringRule(deletingRecurring.id);
        if (deleted) setDeletingRecurring(null);
    };

    return (
        <AuthenticatedLayout>
            <div className="app-page">
                <header className="app-page-header">
                    <div className="max-w-2xl">
                        <h1 className="app-page-title">Kalender Tagihan</h1>
                        <p className="app-page-description max-w-xl">
                            Pantau transaksi, tagihan, tugas, dan pengingat dalam satu kalender.
                        </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <button
                            type="button"
                            onClick={() => setIsRecurringOpen(true)}
                            disabled={calendarActionsDisabled}
                            className="calendar-mobile-touch ui-button inline-flex w-full items-center justify-center gap-2 bg-emerald-800 text-white hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Tambah tagihan rutin
                        </button>
                        <button
                            type="button"
                            onClick={openAddReminder}
                            disabled={calendarActionsDisabled}
                            className="calendar-mobile-touch ui-button inline-flex w-full items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
                        >
                            <Bell className="h-4 w-4 text-slate-500" aria-hidden="true" />
                            Tambah pengingat
                        </button>
                    </div>
                </header>

                {syncLoading && (
                    <div role="status" aria-live="polite" className="ui-notice border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-800">
                        Memuat data kalender...
                    </div>
                )}
                {syncError && (
                    <div role="alert" className="ui-notice flex flex-col gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 sm:flex-row sm:items-center sm:justify-between">
                        <span>{syncError}</span>
                        <button
                            type="button"
                            onClick={retrySync}
                            className="ui-button ui-button-touch inline-flex items-center justify-center px-3 text-xs font-medium text-rose-800 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2"
                        >
                            Coba lagi
                        </button>
                    </div>
                )}
                {calendarError && !isReminderOpen && !deletingReminder && !deletingRecurring && (
                    <div role="alert" className="ui-notice flex flex-col gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 sm:flex-row sm:items-center sm:justify-between">
                        <span>{calendarError}</span>
                        <button
                            type="button"
                            onClick={clearCalendarError}
                            className="ui-button ui-button-touch inline-flex items-center justify-center px-3 text-xs font-medium text-rose-800 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2"
                        >
                            Tutup
                        </button>
                    </div>
                )}

                <div className="sr-only" role="status" aria-live="polite">
                    {calendarBusy ? 'Menyimpan perubahan kalender...' : ''}
                </div>

                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
                    <section aria-busy={syncLoading || calendarBusy} className="calendar-surface ui-card flex flex-col gap-4 p-4 sm:p-5 xl:col-span-8" aria-labelledby="calendar-heading">
                        <div className="calendar-toolbar flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <span className="calendar-eyebrow text-xs font-medium text-slate-500">Kalender</span>
                                <h2 id="calendar-heading" className="calendar-month-title mt-1 text-base font-semibold leading-snug text-slate-800">
                                    {MONTH_NAMES[currentMonth]} {currentYear}
                                </h2>
                                <p className="calendar-month-description ui-section-description">
                                    Pilih tanggal untuk membuka daily brief Anda.
                                </p>
                            </div>
                            <div className="calendar-month-nav flex w-full shrink-0 items-center gap-2 sm:w-auto sm:gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => goToMonth(-1)}
                                    aria-label="Bulan sebelumnya"
                                    className="calendar-nav-button calendar-mobile-touch inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                                >
                                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={goToToday}
                                    className="calendar-today-button calendar-mobile-touch inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 sm:flex-none"
                                >
                                    Hari ini
                                </button>
                                <button
                                    type="button"
                                    onClick={() => goToMonth(1)}
                                    aria-label="Bulan berikutnya"
                                    className="calendar-nav-button calendar-mobile-touch inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                                >
                                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        <div className="calendar-legend flex flex-wrap items-center gap-x-3 gap-y-1.5 border-y border-[#e2e9e3] py-2.5 sm:gap-x-4" aria-label="Keterangan jenis agenda">
                            {LEGEND_ITEMS.map(({ label, dotClass }) => (
                                <div key={label} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                    <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
                                    {label}
                                </div>
                            ))}
                        </div>

                        <div className="calendar-frame overflow-hidden border border-[#e2e9e3]">
                             <div className="calendar-weekdays grid grid-cols-7 border-b border-[#e2e9e3] bg-slate-50/80 py-2.5 text-center text-[10px] font-medium text-slate-500">
                                 {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
                             </div>
                             <div className="calendar-grid grid grid-cols-7 divide-x divide-y divide-[#e2e9e3] bg-white">
                                {calendarCells.map((cell) => {
                                    if (!cell.dayNumber) {
                                        return <div key={cell.key} className="calendar-empty-day-cell bg-slate-50/40" aria-hidden="true" />;
                                    }

                                    const dayTransactions = getTransactionsForDay(cell.dayNumber);
                                    const dayRules = getRulesForDay(cell.dayNumber);
                                    const dayReminders = getRemindersForDay(cell.dayNumber);
                                    const dayEvents = [
                                        ...dayTransactions.map((transaction) => ({
                                            id: `transaction-${transaction.id}`,
                                            title: transaction.title,
                                            icon: transaction.type === 'income' ? ArrowUpRight : ArrowDownRight,
                                             chip: transaction.type === 'income' ? 'ui-tone-positive' : transaction.type === 'transfer' ? 'ui-tone-info' : 'ui-tone-danger',
                                             dotClass: transaction.type === 'income' ? 'bg-emerald-600' : transaction.type === 'transfer' ? 'bg-sky-600' : 'bg-rose-600',
                                            isCompleted: false,
                                        })),
                                        ...dayRules.map((rule) => ({
                                            id: `rule-${rule.id}`,
                                            title: rule.title,
                                            icon: rule.type === 'income' ? ArrowUpRight : ArrowDownRight,
                                             chip: rule.type === 'income' ? 'ui-tone-positive' : 'ui-tone-danger',
                                             dotClass: rule.type === 'income' ? 'bg-emerald-600' : 'bg-rose-600',
                                            isCompleted: false,
                                        })),
                                        ...dayReminders.map((reminder) => {
                                            const meta = getReminderMeta(reminder.type);
                                            return {
                                                id: `reminder-${reminder.id}`,
                                                title: reminder.title,
                                                icon: meta.icon,
                                                chip: meta.chip,
                                                dotClass: meta.dotClass,
                                                isCompleted: reminder.isCompleted,
                                            };
                                        }),
                                    ];
                                    const isToday = cell.dayNumber === today.getDate()
                                        && currentMonth === today.getMonth()
                                        && currentYear === today.getFullYear();
                                    const isSelected = cell.dayNumber === selectedDay;
                                    const visibleEvents = dayEvents.slice(0, 2);
                                    const eventDots = [...new Set(dayEvents.map((event) => event.dotClass))].slice(0, 3);
                                    const eventCountLabel = dayEvents.length > 0
                                        ? `${dayEvents.length} agenda: ${dayEvents.slice(0, 2).map((event) => event.title).join(', ')}`
                                        : 'Tidak ada agenda';
                                    const dateLabel = `Tanggal ${cell.dayNumber} ${MONTH_NAMES[currentMonth]} ${currentYear}${isToday ? ', hari ini' : ''}, ${eventCountLabel}`;

                                    return (
                                        <button
                                             key={cell.key}
                                             type="button"
                                             onClick={() => setSelectedDay(cell.dayNumber)}
                                             aria-label={dateLabel}
                                             aria-current={isToday ? 'date' : undefined}
                                             aria-pressed={isSelected}
                                             className={`calendar-day-cell group flex min-w-0 flex-col items-stretch gap-1 p-1 text-left transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 sm:p-2 ${
                                                    isSelected ? 'calendar-selected-day bg-slate-100/80' : 'hover:bg-slate-50'
                                               }`}
                                          >
                                              <div className="flex items-center justify-between gap-1">
                                                  <span className={`calendar-day-number flex h-6 w-6 items-center justify-center self-start text-xs font-bold ${
                                                      isToday
                                                          ? 'rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
                                                          : isSelected
                                                              ? 'font-semibold text-slate-800'
                                                              : 'text-slate-700'
                                                 }`}>
                                                     {cell.dayNumber}
                                                 </span>
                                                 {eventDots.length > 0 && (
                                                     <span className="calendar-event-dots flex items-center gap-0.5" aria-hidden="true">
                                                         {eventDots.map((dotClass) => <span key={dotClass} className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />)}
                                                     </span>
                                                 )}
                                             </div>
                                              <span className="calendar-day-events flex min-w-0 flex-col gap-1 overflow-hidden">
                                                 {visibleEvents.map((event, eventIndex) => {
                                                    const EventIcon = event.icon;
                                                    return (
                                                        <span
                                                            key={event.id}
                                                               className={`calendar-event-chip ${eventIndex > 0 ? 'hidden sm:inline-flex' : ''} inline-flex min-w-0 max-w-full items-center gap-1 overflow-hidden rounded border border-l-2 px-1 py-0.5 text-[11px] font-medium leading-tight sm:text-[10px] ${event.chip} ${event.isCompleted ? 'text-slate-500 line-through opacity-80' : ''}`}
                                                             title={event.title}
                                                             aria-hidden="true"
                                                         >
                                                             <EventIcon className="hidden h-2.5 w-2.5 shrink-0 sm:block" />
                                                             <span className="min-w-0 truncate">{event.title}</span>
                                                         </span>
                                                     );
                                                 })}
                                                    {dayEvents.length > 1 && (
                                                        <span className="truncate pl-1 text-[10px] font-medium text-slate-500 sm:hidden">
                                                           +{dayEvents.length - 1} lainnya
                                                       </span>
                                                   )}
                                                   {dayEvents.length > 2 && (
                                                       <span className="hidden truncate pl-1 text-[10px] font-medium text-slate-500 sm:inline">
                                                          +{dayEvents.length - 2} lainnya
                                                       </span>
                                                   )}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                         <div className="calendar-summary grid grid-cols-1 gap-3 border-t border-[#e2e9e3] pt-4 sm:grid-cols-2">
                             <div className="calendar-summary-item flex items-center gap-3">
                                 <div className="calendar-summary-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800">
                                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                                </div>
                                <div>
                                     <span className="block text-xs font-medium text-slate-500">Pemasukan rutin</span>
                                    <span className="tabular-nums text-sm font-semibold text-slate-800">{fmtIDR(monthlyStats.totalIncome)}</span>
                                </div>
                            </div>
                             <div className="calendar-summary-item flex items-center gap-3 border-t border-[#e2e9e3] pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                                 <div className="calendar-summary-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-800">
                                    <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                                </div>
                                <div>
                                     <span className="block text-xs font-medium text-slate-500">Tagihan rutin</span>
                                    <span className="tabular-nums text-sm font-semibold text-slate-800">{fmtIDR(monthlyStats.totalExpense)}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                     <div className="calendar-sidebar flex flex-col gap-4 xl:col-span-4">
                          <section className="calendar-focus-card ui-card flex flex-col gap-4 p-4 sm:p-5" aria-labelledby="selected-agenda-heading">
                            <div className="flex items-start gap-3">
                                <div className="calendar-focus-date flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800">
                                    <span className="text-lg font-semibold leading-none">{selectedDay}</span>
                                    <span className="mt-1 text-[10px] font-medium">{MONTH_NAMES[currentMonth].slice(0, 3)}</span>
                                </div>
                                <div className="min-w-0 pt-0.5">
                                    <span className="text-xs font-medium text-emerald-800">Agenda tanggal</span>
                                      <h2 id="selected-agenda-heading" className="ui-section-title mt-1 capitalize leading-snug">
                                        {formatLongDate(currentYear, currentMonth, selectedDay)}
                                    </h2>
                                      <p className="ui-section-description">
                                         {selectedAgendaCount === 0
                                             ? selectedDateIsToday ? 'Belum ada agenda terjadwal hari ini.' : 'Belum ada agenda terjadwal pada tanggal ini.'
                                             : `${selectedAgendaCount} agenda pada ${selectedDateIsToday ? 'hari ini' : 'tanggal ini'}.`}
                                     </p>
                                </div>
                            </div>

                            {selectedAgendaCount === 0 ? (
                                 <div className="calendar-empty-state flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 px-4 py-5 text-center">
                                    <Bell className="h-7 w-7 text-amber-600" aria-hidden="true" />
                                    <div>
                                         <p className="text-sm font-semibold text-slate-700">Tidak ada agenda pada tanggal ini.</p>
                                        <p className="mt-1 text-xs leading-relaxed text-slate-500">Tambahkan pengingat jika ada hal yang perlu Anda ingat.</p>
                                    </div>
                                         <button
                                             type="button"
                                             onClick={openAddReminder}
                                             disabled={calendarActionsDisabled}
                                               className="calendar-agenda-touch ui-button-compact inline-flex items-center gap-1.5 text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
                                    >
                                        <Plus className="h-4 w-4" aria-hidden="true" />
                                        Tambah pengingat
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {financialAgenda.length > 0 && (
                                        <section aria-labelledby="financial-agenda-heading">
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <h3 id="financial-agenda-heading" className="text-xs font-semibold text-slate-700">Aktivitas keuangan</h3>
                                                <span className="text-xs font-medium text-slate-500">{financialAgenda.length} item</span>
                                            </div>
                                             <div className="calendar-agenda-list divide-y divide-[#e2e9e3] overflow-hidden rounded-lg border border-[#e2e9e3]">
                                                {financialAgenda.map((item) => {
                                                    const isIncome = item.type === 'income';
                                                    const isTransfer = item.type === 'transfer';
                                                    const category = categories.find((categoryItem) => categoryItem.id === item.categoryId);
                                                    const wallet = wallets.find((walletItem) => walletItem.id === item.walletId);
                                                    const ItemIcon = isIncome ? ArrowUpRight : ArrowDownRight;
                                                    const detail = isTransfer
                                                        ? `${wallets.find((walletItem) => walletItem.id === item.fromWalletId)?.name || 'Dompet'} ke ${wallets.find((walletItem) => walletItem.id === item.toWalletId)?.name || 'dompet lain'}`
                                                        : `${category?.name || 'Lainnya'}${wallet ? ` • ${wallet.name}` : ''}`;

                                                    return (
                                                        <div key={`${item.itemType}-${item.id}`} className="p-3">
                                                            <div className="flex items-start gap-3">
                                                                 <div className={`ui-tone-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isIncome ? 'ui-tone-positive' : isTransfer ? 'ui-tone-info' : 'ui-tone-danger'}`}>
                                                                    <ItemIcon className="h-4 w-4" aria-hidden="true" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="min-w-0">
                                                                            <h4 className="truncate text-xs font-semibold text-slate-800">{item.title}</h4>
                                                                            <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                                                                                {item.itemType === 'recurring'
                                                                                    ? item.type === 'income' ? 'Pemasukan rutin' : 'Tagihan rutin'
                                                                                    : isTransfer ? 'Transfer' : 'Transaksi'}
                                                                                {item.time ? ` • ${item.time}` : ''}
                                                                            </p>
                                                                        </div>
                                                                          <span className={`shrink-0 text-xs font-semibold tabular-nums ${isIncome ? 'ui-tone-positive-text' : isTransfer ? 'text-slate-700' : 'ui-tone-danger-text'}`}>
                                                                            {getSignedAmount(item.type, item.amount)}
                                                                        </span>
                                                                    </div>
                                                                     <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{detail}</p>
                                                                </div>
                                                            </div>
                                                            {item.itemType === 'recurring' && (
                                                                <div className="mt-3 flex items-center justify-between border-t border-[#e2e9e3] pt-2">
                                                                     <button
                                                                         type="button"
                                                                         onClick={() => toggleRecurringRule(item.id)}
                                                                         disabled={calendarActionsDisabled}
                                                                           className="calendar-agenda-touch inline-flex min-h-[40px] items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
                                                                    >
                                                                         {item.active ? <ToggleRight className="h-5 w-5 text-emerald-800" aria-hidden="true" /> : <ToggleLeft className="h-5 w-5 text-slate-500" aria-hidden="true" />}
                                                                        {item.active ? 'Aktif' : 'Mati'}
                                                                    </button>
                                                                     <button
                                                                         type="button"
                                                                         onClick={() => requestDeleteRecurring(item)}
                                                                         disabled={calendarActionsDisabled}
                                                                         aria-label={`Hapus tagihan rutin ${item.title}`}
                                                                         className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    )}

                                    {selectedDayReminders.length > 0 && (
                                        <section aria-labelledby="reminder-agenda-heading">
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <h3 id="reminder-agenda-heading" className="text-xs font-semibold text-slate-700">Pengingat</h3>
                                                <span className="text-xs font-medium text-slate-500">{completedReminderCount}/{selectedDayReminders.length} selesai</span>
                                            </div>
                                             <div className="calendar-agenda-list divide-y divide-[#e2e9e3] overflow-hidden rounded-lg border border-[#e2e9e3]">
                                                {selectedDayReminders.map((reminder) => {
                                                    const meta = getReminderMeta(reminder.type);
                                                    const ReminderIcon = meta.icon;
                                                    const isCompleted = reminder.isCompleted;

                                                    return (
                                                        <div key={reminder.id} className={`p-3 ${isCompleted ? 'bg-slate-50/80' : meta.card}`}>
                                                            <div className="flex items-start gap-3">
                                                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${isCompleted ? 'border-slate-200 bg-slate-100 text-slate-500' : meta.iconBox}`}>
                                                                    <ReminderIcon className="h-4 w-4" aria-hidden="true" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="min-w-0">
                                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                                 <h4 className={`truncate text-xs font-semibold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{reminder.title}</h4>
                                                                                 {isCompleted && <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">Selesai</span>}
                                                                            </div>
                                                                             <p className={`mt-0.5 text-[10px] font-semibold ${isCompleted ? 'text-slate-500' : 'text-slate-500'}`}>
                                                                                {meta.label}{reminder.time ? ` • ${formatShortTime(reminder.time)}` : ''}
                                                                            </p>
                                                                        </div>
                                                                        {reminder.type === 'finance' && reminder.amount !== null && reminder.amount !== undefined && (
                                                                             <span className={`shrink-0 text-xs font-semibold tabular-nums ${isCompleted ? 'text-slate-500' : 'text-amber-800'}`}>{fmtIDR(reminder.amount)}</span>
                                                                        )}
                                                                    </div>
                                                                     {reminder.notes && <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{reminder.notes}</p>}
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 flex items-center justify-between border-t border-[#e2e9e3] pt-2">
                                                                 <button
                                                                     type="button"
                                                                     onClick={() => toggleReminder(reminder.id)}
                                                                     disabled={calendarActionsDisabled}
                                                                     aria-pressed={isCompleted}
                                                                      className={`calendar-agenda-touch inline-flex min-h-[40px] items-center gap-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 ${isCompleted ? 'text-slate-500 hover:text-slate-800' : 'text-amber-800 hover:text-amber-900'}`}
                                                                >
                                                                    <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${isCompleted ? 'border-emerald-700 bg-emerald-800 text-white' : 'border-amber-300 bg-white text-transparent'}`}>
                                                                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                                                    </span>
                                                                    {isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
                                                                </button>
                                                                <div className="flex items-center gap-0.5">
                                                                     <button
                                                                         type="button"
                                                                         onClick={() => openEditReminder(reminder)}
                                                                         disabled={calendarActionsDisabled}
                                                                         aria-label={`Edit pengingat ${reminder.title}`}
                                                                         className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
                                                                    >
                                                                        <Pencil className="h-4 w-4" aria-hidden="true" />
                                                                    </button>
                                                                     <button
                                                                         type="button"
                                                                         onClick={() => requestDeleteReminder(reminder)}
                                                                         disabled={calendarActionsDisabled}
                                                                         aria-label={`Hapus pengingat ${reminder.title}`}
                                                                         className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    )}
                                </>
                            )}
                        </section>

                          <section className="calendar-side-card ui-card flex flex-col gap-4 p-4 sm:p-5" aria-labelledby="upcoming-heading">
                            <div>
                                <span className="text-xs font-medium text-slate-500">Fokus berikutnya</span>
                                 <h2 id="upcoming-heading" className="ui-section-title mt-1">Agenda rutin 14 hari ke depan</h2>
                                 <p className="ui-section-description">Pemasukan dan tagihan rutin yang perlu masuk dalam radar Anda.</p>
                            </div>
                            {upcomingBills.length === 0 ? (
                                  <div className="calendar-empty-state flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                                      <CalendarClock className="h-7 w-7 text-sky-700" aria-hidden="true" />
                                      <p className="text-xs font-semibold text-slate-500">Belum ada agenda rutin terdekat.</p>
                                     <p className="mt-1 text-[11px] text-slate-500">Agenda rutin yang aktif akan muncul di sini.</p>
                                </div>
                            ) : (
                                 <div className="calendar-agenda-list divide-y divide-[#e2e9e3] overflow-y-auto rounded-xl border border-[#e2e9e3]">
                                    {upcomingBills.map(({ rule, daysRemaining }) => (
                                        <div key={`${rule.id}-${daysRemaining}`} className="flex items-center justify-between gap-3 p-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                 <div className={`ui-tone-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${rule.type === 'income' ? 'ui-tone-positive' : 'ui-tone-danger'}`}>
                                                    {rule.type === 'income' ? <ArrowUpRight className="h-4 w-4" aria-hidden="true" /> : <ArrowDownRight className="h-4 w-4" aria-hidden="true" />}
                                                </div>
                                                <div className="min-w-0">
                                                     <span className="block truncate text-xs font-semibold text-slate-800">{rule.title}</span>
                                                      <span className="mt-0.5 block text-xs font-medium text-slate-500">
                                                        {daysRemaining === 0 ? 'Hari ini' : daysRemaining === 1 ? 'Besok' : `${daysRemaining} hari lagi`}
                                                    </span>
                                                </div>
                                            </div>
                                              <span className={`shrink-0 text-xs font-semibold tabular-nums ${rule.type === 'income' ? 'ui-tone-positive-text' : 'ui-tone-danger-text'}`}>
                                                {getSignedAmount(rule.type, rule.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                         </section>

                          <section className="calendar-side-card ui-card flex flex-col gap-4 p-4 sm:p-5" aria-labelledby="recurring-management-heading">
                            <div>
                                <span className="text-xs font-medium text-slate-500">Kelola jadwal</span>
                                 <h2 id="recurring-management-heading" className="ui-section-title mt-1">Aturan transaksi rutin</h2>
                                 <p className="ui-section-description">Aktifkan atau nonaktifkan aturan tanpa menghapusnya.</p>
                            </div>
                            {recurringRules.length === 0 ? (
                                  <div className="calendar-empty-state flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                                    <Repeat2 className="h-7 w-7 text-amber-700" aria-hidden="true" />
                                     <p className="text-xs font-semibold text-slate-500">Belum ada aturan rutin.</p>
                                    <p className="mt-1 text-[11px] text-slate-500">Tambahkan aturan untuk mengatur transaksi berulang.</p>
                                </div>
                            ) : (
                                 <div className="calendar-agenda-list divide-y divide-[#e2e9e3] overflow-hidden rounded-xl border border-[#e2e9e3]">
                                    {recurringRules.map((rule) => (
                                        <div key={rule.id} className={`p-3.5 ${rule.active ? 'bg-white' : 'bg-slate-50/70'}`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                     <h3 className={`truncate text-xs font-semibold ${rule.active ? 'text-slate-800' : 'text-slate-500'}`}>{rule.title}</h3>
                                                     <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                                                        {rule.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} • {FREQ_LABELS[rule.frequency] || 'Rutin'} • {rule.nextDate ? formatDateID(rule.nextDate) : 'Tanggal belum diatur'}
                                                    </p>
                                                </div>
                                                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${rule.active ? 'ui-tone-positive' : 'ui-tone-neutral'}`}>
                                                    {rule.active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between border-t border-[#e2e9e3] pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleRecurringRule(rule.id)}
                                                    disabled={calendarActionsDisabled}
                                                    aria-pressed={rule.active}
                                                     className="calendar-agenda-touch inline-flex min-h-[40px] items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
                                                >
                                                    {rule.active ? <ToggleRight className="h-5 w-5 text-emerald-800" aria-hidden="true" /> : <ToggleLeft className="h-5 w-5 text-slate-500" aria-hidden="true" />}
                                                    {rule.active ? 'Nonaktifkan' : 'Aktifkan'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => requestDeleteRecurring(rule)}
                                                    disabled={calendarActionsDisabled}
                                                    aria-label={`Hapus aturan rutin ${rule.title}`}
                                                     className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
                                                >
                                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            <RecurringModal isOpen={isRecurringOpen} onClose={() => setIsRecurringOpen(false)} />
            <ReminderModal
                isOpen={isReminderOpen}
                onClose={() => setIsReminderOpen(false)}
                editing={editingReminder}
                initialDate={getDateKey(currentYear, currentMonth, selectedDay)}
            />
            <Modal
                isOpen={Boolean(deletingReminder)}
                onClose={() => setDeletingReminder(null)}
                title="Hapus pengingat"
            >
                <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-slate-600">
                        Hapus pengingat <strong className="font-bold text-slate-900">{deletingReminder?.title}</strong>? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    {calendarError && (
                        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold leading-relaxed text-rose-800">
                            {calendarError}
                        </p>
                    )}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setDeletingReminder(null)}
                            className="ui-button ui-button-touch bg-slate-100 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeleteReminder}
                            disabled={calendarBusy || syncLoading}
                            className="ui-button ui-button-touch bg-rose-700 text-sm font-medium text-white transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
                        >
                            {syncLoading ? 'Memuat...' : calendarBusy ? 'Menghapus...' : 'Hapus pengingat'}
                        </button>
                    </div>
                </div>
            </Modal>
            <Modal
                isOpen={Boolean(deletingRecurring)}
                onClose={() => setDeletingRecurring(null)}
                title="Hapus aturan rutin"
            >
                <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-slate-600">
                        Hapus aturan <strong className="font-bold text-slate-900">{deletingRecurring?.title}</strong>? Transaksi yang sudah tercatat tetap ada.
                    </p>
                    {calendarError && (
                        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold leading-relaxed text-rose-800">
                            {calendarError}
                        </p>
                    )}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setDeletingRecurring(null)}
                            className="ui-button ui-button-touch bg-slate-100 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeleteRecurring}
                            disabled={calendarBusy || syncLoading}
                            className="ui-button ui-button-touch bg-rose-700 text-sm font-medium text-white transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
                        >
                            {syncLoading ? 'Memuat...' : calendarBusy ? 'Menghapus...' : 'Hapus aturan rutin'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
