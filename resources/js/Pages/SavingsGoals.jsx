import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import GoalModal, { GOAL_ICONS } from '../Components/Savings/GoalModal';
import GoalDetailModal from '../Components/Savings/GoalDetailModal';
import CollaborateModal from '../Components/Savings/CollaborateModal';
import { useFinance } from '../Store/FinanceContext';
import { fmtIDR, formatMonthYear, monthsUntil } from '../Utils/format';

// ─── Chart data ───────────────────────────────────────────────────────────────
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
const collected = [10, 22, 35, 50, 65, 78, 92, 108, 0, 0, 0, 0];
const projection = [10, 22, 35, 50, 65, 78, 92, 108, 120, 135, 148, 145];
const maxVal = 165;

// ─── Component: GoalCard ─────────────────────────────────────────────────────
function GoalCard({ goal, onDelete, onClick, onCollaborate }) {
    const isDone = goal.progress >= 100;

    return (
        <div 
            onClick={onClick}
            className="bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-stone-300 p-6 flex flex-col gap-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-md transition-all cursor-pointer hover:outline-emerald-600/40 hover:-translate-y-[1px]"
        >
            {/* Top: Icon + Title + Progress */}
            <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 bg-stone-100 rounded-2xl flex justify-center items-center shrink-0">
                        {(() => {
                            const Icon = GOAL_ICONS[goal.iconKey]?.Icon || GOAL_ICONS.home.Icon;
                            return <Icon className="w-6 h-6 text-emerald-800" strokeWidth={1.75} />;
                        })()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-zinc-900 text-lg font-bold leading-6 truncate">{goal.title}</h4>
                            {goal.isShared && (
                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded text-[9px] font-bold uppercase tracking-wider shrink-0">
                                    Bersama
                                </span>
                            )}
                        </div>
                        <span className="text-neutral-700 text-xs font-normal leading-4 mt-0.5">
                            Target Selesai: {goal.deadlineLabel} {goal.partnerEmail ? `• ${goal.partnerEmail}` : ''}
                        </span>
                    </div>
                </div>
                {isDone ? (
                    <span className="shrink-0 self-start px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase leading-4 tracking-wider">
                        Selesai
                    </span>
                ) : (
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onCollaborate(goal); 
                            }}
                            className="p-2 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Kelola Kolaborasi Target"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </button>
                        <div className="flex flex-col items-end shrink-0">
                            <span className="text-neutral-700 text-[10px] font-bold uppercase leading-4 tracking-wider">Progres</span>
                            <span className="text-emerald-800 text-2xl font-bold leading-8">{goal.progress}%</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-medium leading-4">
                    <span className="text-zinc-900">{fmtIDR(goal.current)}</span>
                    <span className="text-neutral-700">Target {fmtIDR(goal.target)}</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-800 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, goal.progress)}%` }}
                    />
                </div>
            </div>

            {/* Footer Stats */}
            <div className="pt-4 border-t border-stone-200 grid grid-cols-2 gap-4 items-center">
                <div className="flex flex-col">
                    <span className="text-neutral-700 text-[10px] font-bold uppercase leading-4 tracking-wider">Setoran Bulanan</span>
                    <span className="text-zinc-900 text-base font-semibold leading-6 mt-1">{fmtIDR(goal.monthly)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-neutral-700 text-[10px] font-bold uppercase leading-4 tracking-wider">Sisa Waktu</span>
                    <span className="text-zinc-900 text-base font-semibold leading-6 mt-1">
                        {isDone ? 'Target Tercapai' : `${goal.remaining} Bulan`}
                    </span>
                </div>
                <button
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        if (window.confirm(`Hapus target "${goal.title}"?`)) onDelete(goal.id); 
                    }}
                    className="justify-self-end p-2 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus target"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ─── Component: GrowthChart ──────────────────────────────────────────────────
function GrowthChart() {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const chartW = 550;
    const chartH = 180;

    // Calculate coordinates
    const points = useMemo(() => {
        return months.map((m, i) => {
            const x = (i / 11) * (chartW - 40) + 20;
            const yProj = chartH - (projection[i] / maxVal) * (chartH - 45) - 25;
            const yColl = collected[i] > 0 
                ? chartH - (collected[i] / maxVal) * (chartH - 45) - 25 
                : null;
            return { x, yProj, yColl, month: m, collVal: collected[i], projVal: projection[i] };
        });
    }, []);

    // Generate Path strings
    const projPathD = useMemo(() => {
        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yProj}`).join(' ');
    }, [points]);

    const collPathD = useMemo(() => {
        const activePoints = points.filter(p => p.yColl !== null);
        return activePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yColl}`).join(' ');
    }, [points]);

    const collAreaD = useMemo(() => {
        const activePoints = points.filter(p => p.yColl !== null);
        if (activePoints.length === 0) return '';
        const first = activePoints[0];
        const last = activePoints[activePoints.length - 1];
        const lineParts = activePoints.map(p => `L ${p.x} ${p.yColl}`).join(' ');
        return `M ${first.x} ${chartH - 20} L ${first.x} ${first.yColl} ${lineParts} L ${last.x} ${chartH - 20} Z`;
    }, [points]);

    return (
        <div className="w-full bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-stone-300 p-8 flex flex-col gap-6 h-full relative">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h3 className="text-zinc-900 text-2xl font-semibold leading-8">Proyeksi Pertumbuhan</h3>
                    <p className="text-neutral-700 text-xs font-normal leading-4 mt-0.5">Estimasi total tabungan berdasarkan kontribusi aktif.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-800" />
                        <span className="text-neutral-700 text-[10px] font-bold uppercase tracking-wider">TERKUMPUL</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-200 border border-stone-300" />
                        <span className="text-neutral-700 text-[10px] font-bold uppercase tracking-wider">PROYEKSI</span>
                    </div>
                </div>
            </div>

            {/* SVG Line Chart */}
            <div className="w-full flex-1 relative min-h-[200px] flex items-center justify-center">
                <div className="w-full relative">
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full overflow-visible">
                        <defs>
                            <linearGradient id="coll-grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0E6C4A" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#0E6C4A" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* Horizontal Guide Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                            const y = 15 + val * (chartH - 45);
                            return (
                                <line 
                                    key={idx} 
                                    x1="20" y1={y} x2={chartW - 20} y2={y} 
                                    stroke="#f5f5f4" strokeWidth="1.5" 
                                />
                            );
                        })}

                        {/* Projection Path (Light Gray, Dashed) */}
                        <path 
                            d={projPathD} 
                            fill="none" 
                            stroke="#d6d3d1" 
                            strokeWidth="2.5" 
                            strokeDasharray="5 5" 
                        />

                        {/* Collected Area (Gradient) */}
                        <path 
                            d={collAreaD} 
                            fill="url(#coll-grad)" 
                        />

                        {/* Collected Path (Solid Emerald) */}
                        <path 
                            d={collPathD} 
                            fill="none" 
                            stroke="#0E6C4A" 
                            strokeWidth="3.5" 
                        />

                        {/* Current point (Ags) highlight dot */}
                        {points.filter(p => p.yColl !== null).length > 0 && (() => {
                            const activeList = points.filter(p => p.yColl !== null);
                            const curPoint = activeList[activeList.length - 1];
                            return (
                                <g>
                                    <circle 
                                        cx={curPoint.x} cx-id="outer" cy={curPoint.yColl} r="10" 
                                        fill="#0E6C4A" fillOpacity="0.15" 
                                    />
                                    <circle 
                                        cx={curPoint.x} cx-id="inner" cy={curPoint.yColl} r="5" 
                                        fill="#0E6C4A" 
                                        stroke="white" strokeWidth="2"
                                    />
                                </g>
                            );
                        })()}

                        {/* Hover tooltip dots */}
                        {hoveredIdx !== null && (
                            <g>
                                <circle 
                                    cx={points[hoveredIdx].x} 
                                    cy={points[hoveredIdx].yColl !== null ? points[hoveredIdx].yColl : points[hoveredIdx].yProj} 
                                    r="6" 
                                    fill={points[hoveredIdx].yColl !== null ? '#0E6C4A' : '#78716c'} 
                                    stroke="white" strokeWidth="2"
                                />
                            </g>
                        )}

                        {/* X-Axis labels */}
                        {points.map((p, i) => (
                            <text 
                                key={i} 
                                x={p.x} y={chartH - 2} 
                                textAnchor="middle" 
                                className="text-[11px] font-medium fill-stone-500"
                            >
                                {p.month}
                            </text>
                        ))}

                        {/* Transparent hover triggers */}
                        {points.map((p, i) => (
                            <rect 
                                key={i}
                                x={p.x - 20} y="0" 
                                width="40" height={chartH} 
                                fill="transparent" 
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                            />
                        ))}
                    </svg>

                    {/* Floating Interactive Tooltip */}
                    {hoveredIdx !== null && (() => {
                        const activeP = points[hoveredIdx];
                        const isColl = activeP.yColl !== null;
                        const val = isColl ? activeP.collVal : activeP.projVal;
                        const displayVal = fmtIDR(val * 1000000); 
                        
                        return (
                            <div 
                                className="absolute bg-stone-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-lg pointer-events-none flex flex-col gap-0.5 border border-stone-800 z-30"
                                style={{ 
                                    left: `${(activeP.x / chartW) * 100}%`,
                                    transform: 'translateX(-50%)',
                                    bottom: `${((chartH - (isColl ? activeP.yColl : activeP.yProj)) / chartH) * 100 + 4}%`
                                }}
                            >
                                <span className="text-[9px] uppercase tracking-wider text-stone-400">
                                    {isColl ? 'Terkumpul' : 'Proyeksi'} ({activeP.month})
                                </span>
                                <span>{displayVal}</span>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}

// ─── Component: BestPerformer ────────────────────────────────────────────────
function BestPerformer() {
    return (
        <div className="bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-stone-300 p-8 flex flex-col gap-6 h-full">
            <div>
                <h3 className="text-zinc-900 text-2xl font-semibold leading-8">Paling Berhasil</h3>
                <p className="text-neutral-700 text-xs font-normal leading-4 mt-1.5">Target dengan konsistensi tertinggi bulan ini.</p>
            </div>

            {/* Plane icon in ring */}
            <div className="flex flex-col items-center gap-4 py-4 flex-1 justify-center">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full border-[12px] border-emerald-800 flex justify-center items-center">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <path d="M10 40V35L16 30.8V23.6L0 30V24L16 12.8V4C16 2.9 16.3917 1.95833 17.175 1.175C17.9583 0.391667 18.9 0 20 0C21.1 0 22.0417 0.391667 22.825 1.175C23.6083 1.95833 24 2.9 24 4V12.8L40 24V30L24 23.6V30.8L30 35V40L20 37L10 40Z" fill="#0E6C4A" />
                        </svg>
                    </div>
                    {/* #1 Badge */}
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold leading-4">#1</span>
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-zinc-900 text-2xl font-semibold leading-8 text-center">Liburan ke Jepang</span>
                    <span className="text-emerald-800 text-base font-semibold leading-6">120% Capaian Bulanan</span>
                </div>
            </div>

            <button className="w-full py-4 rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 text-zinc-900 text-sm font-semibold leading-4 tracking-wide hover:bg-stone-50 transition-colors">
                Lihat Detail Laporan
            </button>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const SORT_OPTIONS = ['Tenggat Waktu', 'Progres', 'Jumlah Target'];

export default function SavingsGoals() {
    const { savingsGoals, deleteSavingsGoal, updateSavingsGoalSharing } = useFinance();
    const [activeTab, setActiveTab] = useState('berjalan');
    const [sortBy, setSortBy] = useState('Tenggat Waktu');
    const [sortOpen, setSortOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [collabGoal, setCollabGoal] = useState(null);

    useEffect(() => {
        if (!sortOpen) return;
        const close = () => setSortOpen(false);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [sortOpen]);

    const viewGoals = useMemo(() => savingsGoals.map((g) => {
        const progress = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
        return {
            ...g,
            progress,
            remaining: monthsUntil(g.deadlineISO),
            deadlineLabel: formatMonthYear(g.deadlineISO),
        };
    }), [savingsGoals]);

    const selectedGoal = useMemo(() => {
        return viewGoals.find(g => g.id === selectedGoalId) || null;
    }, [selectedGoalId, viewGoals]);

    const runningGoals = viewGoals.filter((g) => g.progress < 100);
    const doneGoals = viewGoals.filter((g) => g.progress >= 100);
    const visibleGoals = activeTab === 'berjalan' ? runningGoals : doneGoals;

    const sortedGoals = [...visibleGoals].sort((a, b) => {
        if (sortBy === 'Progres') return b.progress - a.progress;
        if (sortBy === 'Jumlah Target') return b.target - a.target;
        return a.remaining - b.remaining;
    });

    const totalCollected = viewGoals.reduce((s, g) => s + g.current, 0);
    const avgProgress = viewGoals.length > 0
        ? Math.round((viewGoals.reduce((s, g) => s + g.progress, 0) / viewGoals.length) * 10) / 10
        : 0;

    return (
        <AuthenticatedLayout>
            <div className="flex flex-col gap-10">

                {/* ── Header Section ── */}
                <div className="flex justify-between items-end flex-wrap gap-4">
                    <div className="space-y-1">
                        <h1 className="text-zinc-900 text-3xl font-bold leading-10">Target Tabungan</h1>
                        <p className="text-neutral-700 text-lg font-normal leading-7">
                            Kelola tujuan finansial Anda secara presisi dan efisien.
                        </p>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="w-52 h-12 bg-emerald-800 rounded-xl flex items-center justify-center gap-2 text-white text-sm font-semibold tracking-wide shadow-[0px_8px_10px_-6px_rgba(14,108,74,0.10),0px_20px_25px_-5px_rgba(14,108,74,0.10)] hover:bg-emerald-700 transition-colors active:scale-[0.98]"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M9 15H11V11H15V9H11V5H9V9H5V11H9V15ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6792 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3667 19.7375 12.6583 19.2125 13.875C18.6875 15.0917 17.975 16.1542 17.075 17.0625C16.175 17.9708 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z" fill="white" />
                        </svg>
                        Tambah Target
                    </button>
                </div>

                {/* ── Summary Bento Grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Total Terkumpul */}
                    <div className="p-6 bg-white rounded-2xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-300/20 rounded-2xl flex items-center justify-center shrink-0">
                            <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
                                <path d="M3.75 20V11.25H6.25V20H3.75ZM11.25 20V11.25H13.75V20H11.25ZM0 25V22.5H25V25H0ZM18.75 20V11.25H21.25V20H18.75ZM0 8.75V6.25L12.5 0L25 6.25V8.75H0Z" fill="#0E6C4A" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <span className="block text-neutral-700 text-xs font-medium leading-4">Total Terkumpul</span>
                            <span className="block text-zinc-900 text-xl font-semibold leading-7 mt-1 truncate">{fmtIDR(totalCollected)}</span>
                        </div>
                    </div>

                    {/* Target Aktif */}
                    <div className="p-6 bg-white rounded-2xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-100/30 rounded-2xl flex items-center justify-center shrink-0">
                            <svg width="19" height="22" viewBox="0 0 19 22" fill="none">
                                <path d="M0 21.25V0H11.25L11.75 2.5H18.75V15H10L9.5 12.5H2.5V21.25H0Z" fill="#565E74" />
                            </svg>
                        </div>
                        <div>
                            <span className="block text-neutral-700 text-xs font-medium leading-4">Target Aktif</span>
                            <span className="block text-zinc-900 text-xl font-semibold leading-7 mt-1">{runningGoals.length} Tujuan</span>
                        </div>
                    </div>

                    {/* Rerata Progres */}
                    <div className="p-6 bg-white rounded-2xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center gap-5">
                        <div className="w-14 h-14 bg-gray-400/30 rounded-2xl flex items-center justify-center shrink-0">
                            <svg width="23" height="23" viewBox="0 0 23 23" fill="none">
                                <path d="M5 17.5H7.5V11.25H5V17.5ZM15 17.5H17.5V5H15V17.5ZM10 17.5H12.5V13.75H10V17.5ZM10 11.25H12.5V8.75H10V11.25ZM2.5 22.5C1.8125 22.5 1.22396 22.2552 0.734375 21.7656C0.244792 21.276 0 20.6875 0 20V2.5C0 1.8125 0.244792 1.22396 0.734375 0.734375C1.22396 0.244792 1.8125 0 2.5 0H20C20.6875 0 21.276 0.244792 21.7656 0.734375C22.2552 1.22396 22.5 1.8125 22.5 2.5V20C22.5 20.6875 22.2552 21.276 21.7656 21.7656C21.276 22.2552 20.6875 22.5 20 22.5H2.5Z" fill="#466554" />
                            </svg>
                        </div>
                        <div>
                            <span className="block text-neutral-700 text-xs font-medium leading-4">Rerata Progres</span>
                            <span className="block text-zinc-900 text-xl font-semibold leading-7 mt-1">{avgProgress}%</span>
                        </div>
                    </div>
                </div>

                {/* ── Smart Insight Banner ── */}
                <div className="w-full px-8 py-8 bg-emerald-800 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
                    <div className="max-w-[576px] flex flex-col gap-3">
                        {/* Badge */}
                        <div className="self-start px-3 py-1 bg-white/10 rounded-full backdrop-blur-[6px] flex items-center gap-2">
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                <path d="M10.5 4.66667L9.77083 3.0625L8.16667 2.33333L9.77083 1.60417L10.5 0L11.2292 1.60417L12.8333 2.33333L11.2292 3.0625L10.5 4.66667ZM10.5 12.8333L9.77083 11.2292L8.16667 10.5L9.77083 9.77083L10.5 8.16667L11.2292 9.77083L12.8333 10.5L11.2292 11.2292L10.5 12.8333ZM4.66667 11.0833L3.20833 7.875L0 6.41667L3.20833 4.95833L4.66667 1.75L6.125 4.95833L9.33333 6.41667L6.125 7.875L4.66667 11.0833ZM4.66667 8.25417L5.25 7L6.50417 6.41667L5.25 5.83333L4.66667 4.57917L4.08333 5.83333L2.82917 6.41667L4.08333 7L4.66667 8.25417Z" fill="white" />
                            </svg>
                            <span className="text-white text-xs font-bold uppercase leading-4 tracking-wider">INSIGHT PINTAR</span>
                        </div>
                        <h2 className="text-white text-2xl font-semibold leading-8">
                            Target &quot;Liburan ke Jepang&quot; hampir tercapai!
                        </h2>
                        <p className="text-white/90 text-base font-normal leading-6">
                            Dengan menambah Rp 450.000 pada kontribusi bulan depan, Anda akan mencapai target 2 bulan lebih cepat dari jadwal semula.
                        </p>
                    </div>
                    <button className="px-6 py-3 bg-white rounded-xl text-emerald-800 text-sm font-semibold leading-4 tracking-wide hover:bg-stone-50 transition-colors shrink-0 active:scale-[0.98]">
                        Optimalkan Sekarang
                    </button>
                </div>

                {/* ── Main Interactive Section ── */}
                <div className="flex flex-col gap-6">
                    {/* Tab + Sort controls */}
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        {/* Tabs */}
                        <div className="p-1 bg-stone-200/70 rounded-xl flex items-center gap-1">
                            <button
                                onClick={() => setActiveTab('berjalan')}
                                className={`px-5 py-2 rounded-lg text-sm tracking-wide transition-all ${activeTab === 'berjalan'
                                    ? 'bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-emerald-800 font-bold'
                                    : 'text-neutral-700 font-semibold hover:text-zinc-900'
                                    }`}
                            >
                                Sedang Berjalan
                                <span className={`ml-2 text-xs ${activeTab === 'berjalan' ? 'text-emerald-700/70' : 'text-neutral-500'}`}>
                                    {runningGoals.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('selesai')}
                                className={`px-5 py-2 rounded-lg text-sm tracking-wide transition-all ${activeTab === 'selesai'
                                    ? 'bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-emerald-800 font-bold'
                                    : 'text-neutral-700 font-semibold hover:text-zinc-900'
                                    }`}
                            >
                                Selesai
                                <span className={`ml-2 text-xs ${activeTab === 'selesai' ? 'text-emerald-700/70' : 'text-neutral-500'}`}>
                                    {doneGoals.length}
                                </span>
                            </button>
                        </div>

                        {/* Sort dropdown */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <svg width="15" height="10" viewBox="0 0 15 10" fill="none">
                                    <path d="M0 10V8.33333H5V10H0ZM0 5.83333V4.16667H10V5.83333H0ZM0 1.66667V0H15V1.66667H0Z" fill="#3F4943" />
                                </svg>
                                <span className="text-neutral-700 text-sm font-semibold leading-4 tracking-wide">Urutkan:</span>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSortOpen((v) => !v); }}
                                    className="pl-4 pr-3 py-2.5 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center justify-between gap-2 w-44 hover:bg-stone-50 transition-colors"
                                >
                                    <span className="text-zinc-900 text-sm font-semibold leading-4 tracking-wide whitespace-nowrap">{sortBy}</span>
                                    <svg
                                        width="21" height="21" viewBox="0 0 21 21" fill="none"
                                        className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`}
                                    >
                                        <path d="M6.2998 8.40002L10.4998 12.6L14.6998 8.40002" stroke="#6B7280" strokeWidth="1.575" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                {sortOpen && (
                                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl outline outline-1 outline-stone-300 shadow-lg z-20 overflow-hidden py-1">
                                        {SORT_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => { setSortBy(opt); setSortOpen(false); }}
                                                className={`block w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-stone-50 transition-colors ${opt === sortBy ? 'text-emerald-800' : 'text-zinc-900'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Goal Cards Grid */}
                    {sortedGoals.length === 0 ? (
                        <div className="bg-white rounded-2xl outline outline-1 outline-dashed outline-stone-300 py-16 text-center">
                            <p className="text-neutral-500 text-sm">Belum ada target di kategori ini.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {sortedGoals.map((g) => (
                                <GoalCard 
                                    key={g.id} 
                                    goal={g} 
                                    onDelete={deleteSavingsGoal} 
                                    onClick={() => setSelectedGoalId(g.id)} 
                                    onCollaborate={(goal) => setCollabGoal(goal)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Lower: Proyeksi + Best Performer ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <GrowthChart />
                    </div>
                    <div>
                        <BestPerformer />
                    </div>
                </div>

            </div>

            {/* Add Goal Modal */}
            <GoalModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

            {/* Detail Goal Modal */}
            <GoalDetailModal 
                goal={selectedGoal} 
                isOpen={!!selectedGoalId} 
                onClose={() => setSelectedGoalId(null)} 
            />

            {/* Collaborate Modal */}
            <CollaborateModal
                isOpen={!!collabGoal}
                onClose={() => setCollabGoal(null)}
                goal={collabGoal}
                onSave={updateSavingsGoalSharing}
            />
        </AuthenticatedLayout>
    );
}
