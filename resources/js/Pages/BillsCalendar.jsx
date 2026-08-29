import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import { useFinance } from '../Store/FinanceContext';
import { fmtIDR } from '../Utils/format';
import { 
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertCircle, 
    ArrowUpRight, ArrowDownRight, Clock, ToggleLeft, ToggleRight, Trash2, ShieldAlert
} from 'lucide-react';
import RecurringModal from '../Shared/RecurringModal';

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function BillsCalendar() {
    const { recurringRules, categories, wallets, toggleRecurringRule, deleteRecurringRule } = useFinance();
    const [isRecurringOpen, setIsRecurringOpen] = useState(false);

    // ─── Calendar Navigation State ───
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
    const [selectedDay, setSelectedDay] = useState(today.getDate());

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    // ─── Projections Logic ───
    const daysInMonth = useMemo(() => {
        return new Date(currentYear, currentMonth + 1, 0).getDate();
    }, [currentYear, currentMonth]);

    const startDayOfWeek = useMemo(() => {
        // Get day of week of the 1st of the month (0 = Sun, 1 = Mon...)
        let day = new Date(currentYear, currentMonth, 1).getDay();
        // Adjust so Monday is index 0
        return day === 0 ? 6 : day - 1;
    }, [currentYear, currentMonth]);

    // Build array of grid cells (including empty padding for start of month)
    const calendarCells = useMemo(() => {
        const cells = [];
        
        // Padding cells for starting day offset
        for (let i = 0; i < startDayOfWeek; i++) {
            cells.push({ dayNumber: null, key: `empty-${i}` });
        }
        
        // Month days
        for (let day = 1; day <= daysInMonth; day++) {
            cells.push({ dayNumber: day, key: `day-${day}` });
        }
        
        return cells;
    }, [daysInMonth, startDayOfWeek]);

    // Match rules for a specific day number
    const getRulesForDay = (dayNum) => {
        if (!dayNum) return [];
        return recurringRules.filter(rule => {
            if (!rule.active) return false;
            // Parse day from nextDate (formatted as YYYY-MM-DD)
            const ruleDay = parseInt(rule.nextDate.split('-')[2]);
            return ruleDay === dayNum;
        });
    };

    // Selected date rules
    const selectedDayRules = useMemo(() => {
        return getRulesForDay(selectedDay);
    }, [selectedDay, recurringRules]);

    // ─── Stats: Bill Summary for viewed month ───
    const monthlyStats = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;

        recurringRules.forEach(rule => {
            if (!rule.active) return;
            if (rule.type === 'income') {
                totalIncome += rule.amount;
            } else {
                totalExpense += rule.amount;
            }
        });

        return { totalIncome, totalExpense };
    }, [recurringRules]);

    // ─── Upcoming bills in next 14 days ───
    const upcomingBills = useMemo(() => {
        const list = [];
        const todayMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

        for (let offset = 0; offset < 14; offset++) {
            const scanDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
            const scanDayNum = scanDate.getDate();
            const scanDayRules = recurringRules.filter(rule => {
                if (!rule.active) return false;
                const ruleDay = parseInt(rule.nextDate.split('-')[2]);
                return ruleDay === scanDayNum;
            });

            scanDayRules.forEach(rule => {
                list.push({
                    rule,
                    date: scanDate,
                    daysRemaining: offset
                });
            });
        }

        return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [recurringRules]);

    return (
        <AuthenticatedLayout>
            <div className="flex flex-col gap-8 pb-12">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-zinc-900 text-3xl font-bold leading-10 flex items-center gap-3">
                            <CalendarIcon className="w-8 h-8 text-emerald-800" />
                            Kalender Tagihan
                        </h1>
                        <p className="text-neutral-700 text-sm mt-1">Pantau dan kelola jadwal jatuh tempo pembayaran tagihan rutin bulanan Anda.</p>
                    </div>
                    <button
                        onClick={() => setIsRecurringOpen(true)}
                        className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm self-start md:self-auto flex items-center gap-2"
                    >
                        <CalendarIcon className="w-4 h-4" />
                        Tambah Tagihan Rutin
                    </button>
                </div>

                {/* Main Split Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Interactive Calendar Grid (8/12) */}
                    <div className="xl:col-span-8 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-6">
                        
                        {/* Month Navigator Header */}
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <h2 className="font-extrabold text-slate-800 text-xl tracking-tight">
                                    {MONTH_NAMES[currentMonth]} {currentYear}
                                </h2>
                                <p className="text-slate-500 text-xs mt-0.5">Klik pada tanggal untuk melihat detail jadwal.</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handlePrevMonth}
                                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                                </button>
                                <button
                                    onClick={() => {
                                        setCurrentYear(today.getFullYear());
                                        setCurrentMonth(today.getMonth());
                                        setSelectedDay(today.getDate());
                                    }}
                                    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition-all"
                                >
                                    Hari Ini
                                </button>
                                <button 
                                    onClick={handleNextMonth}
                                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid Container */}
                        <div className="border border-stone-100 rounded-2xl overflow-hidden">
                            {/* Day Labels */}
                            <div className="grid grid-cols-7 bg-slate-50 border-b border-stone-100 text-center py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {WEEKDAYS.map(day => (
                                    <div key={day}>{day}</div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 auto-rows-[90px] md:auto-rows-[100px] divide-x divide-y divide-stone-100 bg-white">
                                {calendarCells.map((cell) => {
                                    const isToday = cell.dayNumber === today.getDate() && 
                                                    currentMonth === today.getMonth() && 
                                                    currentYear === today.getFullYear();
                                                    
                                    const isSelected = cell.dayNumber === selectedDay;
                                    const dayRules = getRulesForDay(cell.dayNumber);

                                    return (
                                        <div 
                                            key={cell.key}
                                            onClick={() => cell.dayNumber && setSelectedDay(cell.dayNumber)}
                                            className={`p-2 flex flex-col justify-between items-stretch transition-all relative ${
                                                cell.dayNumber ? 'cursor-pointer hover:bg-slate-50/50' : 'bg-slate-50/30'
                                            } ${isSelected && cell.dayNumber ? 'bg-emerald-50/30 ring-1 ring-emerald-600/20' : ''}`}
                                        >
                                            {/* Day Number and Today Indicator */}
                                            <div className="flex justify-between items-center">
                                                <span className={`text-xs font-bold ${
                                                    cell.dayNumber ? 'text-slate-700' : 'text-slate-300'
                                                } ${isToday ? 'w-5.5 h-5.5 bg-emerald-800 text-white rounded-full flex items-center justify-center font-extrabold' : ''}`}>
                                                    {cell.dayNumber}
                                                </span>
                                            </div>

                                            {/* Due Badges List */}
                                            <div className="flex flex-col gap-1.5 overflow-y-hidden mt-1.5">
                                                {dayRules.slice(0, 2).map(r => (
                                                    <div 
                                                        key={r.id} 
                                                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold truncate leading-tight border ${
                                                            r.type === 'income' 
                                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                                                                : 'bg-rose-50 text-rose-800 border-rose-100'
                                                        }`}
                                                    >
                                                        {r.title}
                                                    </div>
                                                ))}
                                                {dayRules.length > 2 && (
                                                    <span className="text-[9px] text-slate-400 font-bold block pl-1">
                                                        +{dayRules.length - 2} lainnya
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Viewed Month Billing summary */}
                        <div className="grid grid-cols-2 gap-4 border border-stone-100 bg-slate-50/50 p-4 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
                                    <ArrowUpRight className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pemasukan Rutin</span>
                                    <span className="text-sm font-bold text-slate-800">{fmtIDR(monthlyStats.totalIncome)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 border-l border-stone-200 pl-4">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-800">
                                    <ArrowDownRight className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tagihan Keluar</span>
                                    <span className="text-sm font-bold text-slate-800">{fmtIDR(monthlyStats.totalExpense)}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right: Selected Date details + Upcoming Alerts (4/12) */}
                    <div className="xl:col-span-4 flex flex-col gap-6">
                        
                        {/* Day Details Card */}
                        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-4">
                            <div>
                                <h3 className="font-bold text-slate-800 text-base">Detail Tanggal {selectedDay}</h3>
                                <p className="text-slate-500 text-xs mt-0.5">Jadwal transaksi rutin pada hari yang Anda pilih.</p>
                            </div>

                            {selectedDayRules.length === 0 ? (
                                <div className="py-8 text-center border border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                                    <Clock className="w-6 h-6 text-slate-400" />
                                    <span className="text-xs text-slate-400 font-semibold">Tidak ada tagihan terjadwal.</span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedDayRules.map(rule => {
                                        const catObj = categories.find(c => c.id === rule.categoryId) || { name: 'Lainnya' };
                                        const wObj = wallets.find(w => w.id === rule.walletId) || { name: 'Utama' };

                                        return (
                                            <div key={rule.id} className="p-3.5 border border-stone-150 hover:border-stone-300 rounded-2xl flex flex-col gap-3 transition-colors bg-slate-50/20">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h5 className="text-xs font-bold text-slate-800">{rule.title}</h5>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                                                            {catObj.name} • {wObj.name}
                                                        </span>
                                                    </div>
                                                    <span className={`text-xs font-bold ${
                                                        rule.type === 'income' ? 'text-emerald-800' : 'text-rose-800'
                                                    }`}>
                                                        {rule.type === 'income' ? '+' : '-'}{fmtIDR(rule.amount)}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center border-t border-stone-100 pt-2.5">
                                                    <button
                                                        onClick={() => toggleRecurringRule(rule.id)}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                                    >
                                                        {rule.active ? (
                                                            <ToggleRight className="w-5 h-5 text-emerald-800 shrink-0" />
                                                        ) : (
                                                            <ToggleLeft className="w-5 h-5 text-slate-400 shrink-0" />
                                                        )}
                                                        {rule.active ? 'Aktif' : 'Mati'}
                                                    </button>

                                                    <button
                                                        onClick={() => deleteRecurringRule(rule.id)}
                                                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Upcoming Bills panel */}
                        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-4">
                            <div>
                                <h3 className="font-bold text-slate-800 text-base">Tagihan Terdekat (14 Hari)</h3>
                                <p className="text-slate-500 text-xs mt-0.5">Proyeksi transaksi berulang dalam dua minggu ke depan.</p>
                            </div>

                            {upcomingBills.length === 0 ? (
                                <p className="text-xs text-slate-400 py-4 text-center">Belum ada tagihan terdekat.</p>
                            ) : (
                                <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                                    {upcomingBills.map(({ rule, date, daysRemaining }, idx) => (
                                        <div key={idx} className="flex justify-between items-center gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                    rule.type === 'income' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                                                }`}>
                                                    {rule.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-800 block leading-tight">{rule.title}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5 uppercase tracking-wide">
                                                        {daysRemaining === 0 ? 'Hari Ini' : daysRemaining === 1 ? 'Besok' : `${daysRemaining} hari lagi`}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <span className={`text-xs font-bold ${
                                                rule.type === 'income' ? 'text-emerald-800' : 'text-slate-700'
                                            }`}>
                                                {rule.type === 'income' ? '+' : '-'}{fmtIDR(rule.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                </div>

            </div>
            <RecurringModal isOpen={isRecurringOpen} onClose={() => setIsRecurringOpen(false)} />
        </AuthenticatedLayout>
    );
}
