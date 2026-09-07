import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import GoalModal, { GOAL_ICONS } from '../Components/Savings/GoalModal';
import GoalDetailModal from '../Components/Savings/GoalDetailModal';
import CollaborateModal from '../Components/Savings/CollaborateModal';
import { useFinance } from '../Store/FinanceContext';
import { fmtIDR, formatMonthYear, monthKeyOf, monthsUntil, todayISO, currentMonthKey } from '../Utils/format';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

// ─── Component: GoalCard ─────────────────────────────────────────────────────
function GoalCard({ goal, onDelete, onClick, onCollaborate }) {
    const isDone = goal.progress >= 100;

    return (
        <div 
            onClick={onClick}
            className="ui-card p-5 flex flex-col gap-4 transition-colors cursor-pointer hover:outline hover:outline-emerald-700/20"
        >
            {/* Top: Icon + Title + Progress */}
            <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 bg-stone-100 rounded-xl flex justify-center items-center shrink-0">
                        {(() => {
                            const Icon = GOAL_ICONS[goal.iconKey]?.Icon || GOAL_ICONS.home.Icon;
                            return <Icon className="w-6 h-6 text-emerald-800" strokeWidth={1.75} />;
                        })()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-zinc-900 text-base font-semibold leading-5 truncate">{goal.title}</h4>
                            {goal.isShared && (
                                <span className="ui-badge bg-emerald-50 text-emerald-700 border-emerald-200/50 shrink-0">
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
                        <span className="ui-badge shrink-0 self-start bg-emerald-100 text-emerald-800 border-emerald-200">
                        Selesai
                    </span>
                ) : (
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onCollaborate(goal); 
                            }}
                            className="ui-icon-button"
                            aria-label={`Kelola kolaborasi target ${goal.title}`}
                            title="Kelola Kolaborasi Target"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </button>
                        <div className="flex flex-col items-end shrink-0">
                            <span className="text-neutral-700 text-xs font-medium">Progres</span>
                            <span className="text-emerald-800 text-xl font-semibold leading-7">{goal.progress}%</span>
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
            <div className="pt-3 border-t border-stone-200 grid grid-cols-2 gap-3 items-center">
                <div className="flex flex-col">
                    <span className="text-neutral-700 text-xs font-medium">Setoran bulanan</span>
                    <span className="text-zinc-900 text-sm font-semibold leading-5 mt-1">{fmtIDR(goal.monthly)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-neutral-700 text-xs font-medium">Sisa waktu</span>
                    <span className="text-zinc-900 text-sm font-semibold leading-5 mt-1">
                        {isDone ? 'Target Tercapai' : `${goal.remaining} Bulan`}
                    </span>
                </div>
                <button
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        if (window.confirm(`Hapus target "${goal.title}"?`)) onDelete(goal.id); 
                    }}
                    className="ui-icon-button ui-icon-button-danger justify-self-end"
                    aria-label={`Hapus target ${goal.title}`}
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
const buildGrowthData = (goals) => {
    const now = new Date();
    const currentKey = currentMonthKey();
    const totalCurrent = goals.reduce((sum, goal) => sum + Number(goal.current || 0), 0);
    const totalMonthly = goals.reduce((sum, goal) => sum + Number(goal.monthly || 0), 0);
    const history = goals.flatMap((goal) => (goal.history || []).map((entry) => ({
        date: entry.date,
        amount: Number(entry.amount || 0),
    })));
    const hasData = totalCurrent > 0 || totalMonthly > 0 || history.some((entry) => entry.amount !== 0);

    const points = Array.from({ length: 9 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() + index - 5, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const isProjection = index > 5;
        const changesAfterMonth = history
            .filter((entry) => monthKeyOf(entry.date) > key && monthKeyOf(entry.date) <= currentKey)
            .reduce((sum, entry) => sum + entry.amount, 0);
        const value = isProjection
            ? totalCurrent + totalMonthly * (index - 5)
            : Math.max(0, totalCurrent - changesAfterMonth);

        return {
            month: MONTH_LABELS[date.getMonth()],
            isProjection,
            value,
            projectedValue: isProjection ? value : totalCurrent,
        };
    });

    return { hasData, points };
};

function GrowthChart({ goals }) {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const chartW = 550;
    const chartH = 180;

    const growthData = useMemo(() => buildGrowthData(goals), [goals]);

    const points = useMemo(() => {
        const maxVal = Math.max(...growthData.points.map((point) => Math.max(point.value, point.projectedValue)), 1);
        const toY = (value) => chartH - (value / maxVal) * (chartH - 45) - 25;

        return growthData.points.map((point, index) => {
            const x = (index / (growthData.points.length - 1)) * (chartW - 40) + 20;
            return {
                ...point,
                x,
                yProj: index >= 5 ? toY(point.projectedValue) : null,
                yColl: point.isProjection ? null : toY(point.value),
                collVal: point.isProjection ? null : point.value,
                projVal: point.projectedValue,
            };
        });
    }, [growthData]);

    // Generate Path strings
    const projPathD = useMemo(() => {
        const projectionPoints = points.filter((point) => point.yProj !== null);
        return projectionPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.yProj}`).join(' ');
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

    if (!growthData.hasData) {
        return (
            <div className="ui-card w-full p-5 flex flex-col gap-4 h-full">
                <div>
                    <h3 className="ui-section-title">Proyeksi Pertumbuhan</h3>
                    <p className="ui-section-description">Estimasi total tabungan berdasarkan kontribusi aktif.</p>
                </div>
                <div className="ui-empty flex-1 min-h-[180px]">
                    <p>Proyeksi akan tersedia setelah ada saldo atau setoran pada target.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ui-card w-full p-5 flex flex-col gap-4 h-full relative">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
                <h3 className="ui-section-title">Proyeksi Pertumbuhan</h3>
                <p className="ui-section-description">Estimasi total tabungan berdasarkan kontribusi aktif.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-800" />
                        <span className="text-neutral-700 text-[10px] font-medium">Terkumpul</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-200 border border-stone-300" />
                        <span className="text-neutral-700 text-[10px] font-medium">Proyeksi</span>
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

                        {/* Current point highlight dot */}
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
                        const displayVal = fmtIDR(val);
                        
                        return (
                            <div 
                                className="ui-tooltip absolute bg-stone-900 text-white text-[11px] font-semibold px-3 py-1.5 pointer-events-none flex flex-col gap-0.5 border border-stone-800 z-30"
                                style={{ 
                                    left: `${(activeP.x / chartW) * 100}%`,
                                    transform: 'translateX(-50%)',
                                    bottom: `${((chartH - (isColl ? activeP.yColl : activeP.yProj)) / chartH) * 100 + 4}%`
                                }}
                            >
                                <span className="text-[9px] tracking-wider text-stone-400">
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
function BestPerformer({ goals }) {
    const bestGoal = goals
        .filter((goal) => goal.target > 0 && goal.progress > 0)
        .sort((a, b) => b.progress - a.progress)[0];

    return (
        <div className="ui-card p-5 flex flex-col gap-4 h-full">
            <div>
                <h3 className="ui-section-title">Paling Berhasil</h3>
                <p className="ui-section-description">Target aktif dengan progres tertinggi.</p>
            </div>

            {bestGoal ? (
                <div className="flex flex-col items-center gap-4 py-4 flex-1 justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-[8px] border-emerald-800 flex justify-center items-center">
                            {(() => {
                                const Icon = GOAL_ICONS[bestGoal.iconKey]?.Icon || GOAL_ICONS.other.Icon;
                                return <Icon className="w-9 h-9 text-emerald-800" strokeWidth={1.75} />;
                            })()}
                        </div>
                        <div className="absolute -top-2 -right-2 w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold leading-4">#1</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-zinc-900 text-xl font-semibold leading-7 text-center">{bestGoal.title}</span>
                        <span className="text-emerald-800 text-sm font-semibold leading-5">{bestGoal.progress}% progres</span>
                    </div>
                </div>
            ) : (
                <div className="ui-empty flex-1 min-h-[180px]">
                    <p>Belum ada target aktif dengan progres yang tercatat.</p>
                </div>
            )}
        </div>
    );
}

const monthlyContributionFor = (goal, monthKey) => (goal.history || [])
    .filter((entry) => monthKeyOf(entry.date) === monthKey && Number(entry.amount || 0) > 0)
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

const buildSavingsInsight = (goals) => {
    const overdueGoal = [...goals]
        .filter((goal) => goal.deadlineISO && goal.deadlineISO < todayISO())
        .sort((a, b) => a.remaining - b.remaining)[0];

    if (overdueGoal) {
        const remaining = Math.max(0, overdueGoal.target - overdueGoal.current);
        return {
            title: `Target "${overdueGoal.title}" melewati tenggat.`,
            description: `Masih tersisa ${fmtIDR(remaining)} dari target ${fmtIDR(overdueGoal.target)}. Perbarui rencana setoran atau tenggatnya.`,
        };
    }

    const nearGoal = [...goals]
        .filter((goal) => goal.progress >= 80)
        .sort((a, b) => b.progress - a.progress)[0];

    if (nearGoal) {
        const remaining = Math.max(0, nearGoal.target - nearGoal.current);
        return {
            title: `Target "${nearGoal.title}" sudah mencapai ${nearGoal.progress}%.`,
            description: `Tersisa ${fmtIDR(remaining)} untuk mencapai target ${fmtIDR(nearGoal.target)}.`,
        };
    }

    const currentMonth = currentMonthKey();
    const contributionGoal = [...goals]
        .filter((goal) => Number(goal.monthly || 0) > 0)
        .map((goal) => ({
            goal,
            contribution: monthlyContributionFor(goal, currentMonth),
        }))
        .filter(({ goal, contribution }) => contribution < Number(goal.monthly || 0))
        .sort((a, b) => (a.contribution / a.goal.monthly) - (b.contribution / b.goal.monthly))[0];

    if (contributionGoal) {
        const { goal, contribution } = contributionGoal;
        return {
            title: `Setoran bulan ini untuk "${goal.title}" belum mencapai target.`,
            description: `Terkumpul ${fmtIDR(contribution)} dari target bulanan ${fmtIDR(goal.monthly)}.`,
        };
    }

    const projectionGoal = [...goals]
        .filter((goal) => Number(goal.monthly || 0) > 0 && goal.target > goal.current)
        .sort((a, b) => (a.target - a.current) / a.monthly - (b.target - b.current) / b.monthly)[0];

    if (projectionGoal) {
        const remaining = Math.max(0, projectionGoal.target - projectionGoal.current);
        const estimatedMonths = Math.ceil(remaining / projectionGoal.monthly);
        return {
            title: `Estimasi "${projectionGoal.title}" tercapai dalam sekitar ${estimatedMonths} bulan.`,
            description: `Perhitungan ini menggunakan sisa ${fmtIDR(remaining)} dan setoran bulanan ${fmtIDR(projectionGoal.monthly)}.`,
        };
    }

    const totalCurrent = goals.reduce((sum, goal) => sum + Number(goal.current || 0), 0);
    const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.target || 0), 0);
    return {
        title: `${goals.length} target tabungan aktif sedang berjalan.`,
        description: `Total terkumpul ${fmtIDR(totalCurrent)} dari target ${fmtIDR(totalTarget)}.`,
    };
};

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
        const target = Number(g.target) || 0;
        const current = Number(g.current) || 0;
        const monthly = Number(g.monthly) || 0;
        const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        return {
            ...g,
            target,
            current,
            monthly,
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
    const hasActiveGoals = runningGoals.length > 0;
    const insight = hasActiveGoals ? buildSavingsInsight(runningGoals) : null;

    const sortedGoals = [...visibleGoals].sort((a, b) => {
        if (sortBy === 'Progres') return b.progress - a.progress;
        if (sortBy === 'Jumlah Target') return b.target - a.target;
        return a.remaining - b.remaining;
    });

    const totalCollected = viewGoals.reduce((s, g) => s + g.current, 0);
    const avgProgress = runningGoals.length > 0
        ? Math.round((runningGoals.reduce((s, g) => s + g.progress, 0) / runningGoals.length) * 10) / 10
        : 0;

    return (
        <AuthenticatedLayout>
            <div className="app-page">

                {/* ── Header Section ── */}
                <div className="app-page-header">
                    <div>
                        <h1 className="app-page-title">Target Tabungan</h1>
                        <p className="app-page-description">
                            Kelola tujuan finansial Anda secara presisi dan efisien.
                        </p>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="ui-button bg-emerald-800 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M9 15H11V11H15V9H11V5H9V9H5V11H9V15ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6792 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3667 19.7375 12.6583 19.2125 13.875C18.6875 15.0917 17.975 16.1542 17.075 17.0625C16.175 17.9708 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z" fill="white" />
                        </svg>
                        Tambah Target
                    </button>
                </div>

                {/* ── Summary Bento Grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Total Terkumpul */}
                    <div className="ui-stat-card flex items-center gap-4">
                        <div className="w-11 h-11 bg-emerald-300/20 rounded-xl flex items-center justify-center shrink-0">
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
                    <div className="ui-stat-card flex items-center gap-4">
                        <div className="w-11 h-11 bg-indigo-100/30 rounded-xl flex items-center justify-center shrink-0">
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
                    <div className="ui-stat-card flex items-center gap-4">
                        <div className="w-11 h-11 bg-gray-400/30 rounded-xl flex items-center justify-center shrink-0">
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
                {insight && (
                    <div className="ui-insight w-full px-5 py-4 flex items-start gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-800">
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                                <path d="M7.5 1.25a6.25 6.25 0 1 0 0 12.5 6.25 6.25 0 0 0 0-12.5Zm0 3.125v3.75m0 2.5h.006" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="max-w-[720px] flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
                                <span>Insight berdasarkan target Anda</span>
                            </div>
                            <h2 className="ui-section-title">{insight.title}</h2>
                            <p className="text-emerald-900/80 text-sm leading-5">{insight.description}</p>
                        </div>
                    </div>
                )}

                {/* ── Main Interactive Section ── */}
                <div className="flex flex-col gap-4">
                    {/* Tab + Sort controls */}
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        {/* Tabs */}
                        <div className="ui-segmented">
                            <button
                                onClick={() => setActiveTab('berjalan')}
                                aria-pressed={activeTab === 'berjalan'}
                                className={`ui-segmented-button ${activeTab === 'berjalan' ? 'is-active' : ''}`}
                            >
                                Sedang Berjalan
                                <span className={`ml-2 text-xs ${activeTab === 'berjalan' ? 'text-emerald-700/70' : 'text-neutral-500'}`}>
                                    {runningGoals.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('selesai')}
                                aria-pressed={activeTab === 'selesai'}
                                className={`ui-segmented-button ${activeTab === 'selesai' ? 'is-active' : ''}`}
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
                                     className="ui-button w-44 justify-between border border-stone-300 bg-white text-zinc-900 hover:bg-stone-50"
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
                                    <div className="ui-popover absolute right-0 mt-2 w-44 bg-white outline outline-1 outline-stone-300 z-20 overflow-hidden py-1">
                                        {SORT_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => { setSortBy(opt); setSortOpen(false); }}
                                             className={`ui-menu-item ${opt === sortBy ? 'is-active' : ''} ${opt === sortBy ? 'text-emerald-800' : 'text-zinc-900'
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
                        <div className="ui-empty flex flex-col items-center gap-3 text-center">
                            {activeTab === 'berjalan' ? (
                                <>
                                    <p className="text-base font-semibold text-zinc-900">Belum ada target tabungan aktif</p>
                                    <p>Buat target pertama Anda untuk mulai memantau progres, proyeksi tabungan, dan insight finansial.</p>
                                    <button
                                        onClick={() => setModalOpen(true)}
                                        className="ui-button bg-emerald-800 hover:bg-emerald-700 text-white mt-1"
                                    >
                                        + Tambah Target
                                    </button>
                                </>
                            ) : (
                                <p>Belum ada target tabungan yang selesai.</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                {hasActiveGoals && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            <GrowthChart goals={runningGoals} />
                        </div>
                        <div>
                            <BestPerformer goals={runningGoals} />
                        </div>
                    </div>
                )}

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
