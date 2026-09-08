import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import GoalModal, { GOAL_ICONS } from './components/GoalModal';
import GoalDetailModal from './components/GoalDetailModal';
import CollaborateModal from './components/CollaborateModal';
import { useSearchParams } from 'react-router-dom';
import { useFinance } from '../../contexts/FinanceContext';
import { fmtIDR, formatMonthYear, monthKeyOf, monthsUntil, todayISO, currentMonthKey } from '../../utils/format';
import { CalendarClock, ChevronDown, Lightbulb, PiggyBank, Plus, SlidersHorizontal, Target, Trash2, TrendingUp, Users } from 'lucide-react';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

const formatCompactIDR = (value) => {
    const amount = Number(value) || 0;
    if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1).replace('.0', '')} M`;
    if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1).replace('.0', '')} jt`;
    if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(1).replace('.0', '')} rb`;
    return fmtIDR(amount);
};

// ─── Component: GoalCard ─────────────────────────────────────────────────────
function GoalCard({ goal, onDelete, onClick, onCollaborate }) {
    const isDone = goal.progress >= 100;

    return (
        <article className="ui-card relative p-5 transition-colors hover:outline hover:outline-emerald-700/20">
            <button
                type="button"
                onClick={onClick}
                className="absolute inset-0 z-0 w-full cursor-pointer rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 focus-visible:outline-offset-2"
                aria-label={`Buka detail target ${goal.title}`}
            />
            <div className="pointer-events-none relative z-10 flex flex-col gap-4">
                {/* Top: Icon + Title + Progress */}
                <div className="flex items-start justify-between gap-3 pr-14">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100">
                            {(() => {
                                const Icon = GOAL_ICONS[goal.iconKey]?.Icon || GOAL_ICONS.home.Icon;
                                return <Icon className="h-6 w-6 text-emerald-800" strokeWidth={1.75} aria-hidden="true" />;
                            })()}
                        </div>
                        <div className="flex min-w-0 flex-col">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className="truncate text-base font-semibold leading-5 text-zinc-900">{goal.title}</h4>
                                {goal.isShared && (
                                    <span className="ui-badge shrink-0 border-emerald-200/50 bg-emerald-50 text-emerald-700">
                                        Bersama
                                    </span>
                                )}
                            </div>
                            <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-normal leading-4 text-neutral-700">
                                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-sky-700" aria-hidden="true" />
                                Target Selesai: {goal.deadlineLabel} {goal.partnerEmail ? `• ${goal.partnerEmail}` : ''}
                            </span>
                        </div>
                    </div>
                    {isDone ? (
                        <span className="ui-badge shrink-0 self-start border-emerald-200 bg-emerald-100 text-emerald-800">
                            Selesai
                        </span>
                    ) : (
                        <div className="flex shrink-0 flex-col items-end">
                            <span className="text-xs font-medium text-neutral-700">Progres</span>
                            <span className="text-xl font-semibold leading-7 text-emerald-800">{goal.progress}%</span>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-medium leading-4">
                        <span className="text-zinc-900">{fmtIDR(goal.current)}</span>
                        <span className="text-neutral-700">Target {fmtIDR(goal.target)}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
                        <div
                            className="h-full rounded-full bg-emerald-800 transition-all duration-700"
                            style={{ width: `${Math.min(100, goal.progress)}%` }}
                        />
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="grid grid-cols-2 items-center gap-3 border-t border-stone-200 pt-3 pr-14">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-neutral-700">Setoran bulanan</span>
                        <span className="mt-1 text-sm font-semibold leading-5 text-zinc-900">{fmtIDR(goal.monthly)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-neutral-700">Sisa waktu</span>
                        <span className="mt-1 text-sm font-semibold leading-5 text-zinc-900">
                            {isDone ? 'Target Tercapai' : `${goal.remaining} Bulan`}
                        </span>
                    </div>
                </div>
            </div>

            {!isDone && (
                <button
                    type="button"
                    onClick={() => onCollaborate(goal)}
                    className="ui-icon-button absolute right-5 top-5 z-20"
                    aria-label={`Kelola kolaborasi target ${goal.title}`}
                    title="Kelola Kolaborasi Target"
                >
                    <Users className="h-4 w-4" aria-hidden="true" />
                </button>
            )}
            <button
                type="button"
                onClick={() => {
                    if (window.confirm(`Hapus target "${goal.title}"?`)) onDelete(goal.id);
                }}
                className="ui-icon-button ui-icon-button-danger absolute bottom-5 right-5 z-20"
                aria-label={`Hapus target ${goal.title}`}
                title="Hapus target"
            >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
        </article>
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
    const chartW = 600;
    const chartH = 180;
    const chartLeft = 42;
    const chartRight = 20;

    const growthData = useMemo(() => buildGrowthData(goals), [goals]);
    const chartBaseline = chartH - 20;
    const chartMaxValue = Math.max(...growthData.points.map((point) => Math.max(point.value, point.projectedValue)), 1);

    const points = useMemo(() => {
        const toY = (value) => chartBaseline - (value / chartMaxValue) * (chartBaseline - 25);

        return growthData.points.map((point, index) => {
            const x = (index / (growthData.points.length - 1)) * (chartW - chartLeft - chartRight) + chartLeft;
            return {
                ...point,
                x,
                yProj: index >= 5 ? toY(point.projectedValue) : null,
                yColl: point.isProjection ? null : toY(point.value),
                collVal: point.isProjection ? null : point.value,
                projVal: point.projectedValue,
            };
        });
    }, [growthData, chartBaseline, chartMaxValue, chartLeft, chartRight]);

    const bars = useMemo(() => points.map((point, index) => {
        const isProjected = index > 5;
        const value = isProjected ? point.projVal : point.collVal;
        const y = isProjected ? point.yProj : point.yColl;
        const height = Math.max(4, chartBaseline - y);
        const barWidth = 36;

        return {
            ...point,
            value,
            y,
            height,
            barX: point.x - barWidth / 2,
            barWidth,
            barY: chartBaseline - height,
            isProjected,
        };
    }), [points, chartBaseline]);

    if (!growthData.hasData) {
        return (
            <div className="ui-card w-full p-5 flex flex-col gap-4 h-full">
                <div>
                    <h3 className="ui-section-title">Proyeksi Pertumbuhan</h3>
                    <p className="ui-section-description">Estimasi total tabungan berdasarkan kontribusi aktif.</p>
                </div>
                <div className="ui-empty flex-1 min-h-[180px]">
                    <TrendingUp className="h-8 w-8 text-emerald-700" aria-hidden="true" />
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
                        <div className="h-2.5 w-4 rounded-sm bg-gradient-to-b from-emerald-800 to-emerald-400" />
                        <span className="text-neutral-700 text-[10px] font-medium">Terkumpul</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-4 rounded-sm border border-emerald-200 bg-gradient-to-b from-emerald-200 to-emerald-50" />
                        <span className="text-neutral-700 text-[10px] font-medium">Proyeksi</span>
                    </div>
                </div>
            </div>

            {/* SVG Bar Chart */}
            <div className="w-full flex-1 relative min-h-[200px] flex items-center justify-center">
                <div className="w-full relative">
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="h-full w-full overflow-visible">
                        <defs>
                            <linearGradient id="growth-collected-bars" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#075c3e" />
                                <stop offset="55%" stopColor="#0e6c4a" />
                                <stop offset="100%" stopColor="#55b987" />
                            </linearGradient>
                            <linearGradient id="growth-projection-bars" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a6d8b9" />
                                <stop offset="45%" stopColor="#cce9d6" />
                                <stop offset="100%" stopColor="#edf7f0" />
                            </linearGradient>
                            <linearGradient id="growth-projection-zone" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#eef8f2" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#f8fbf9" stopOpacity="0.3" />
                            </linearGradient>
                            <filter id="growth-bar-shadow" x="-20%" y="-10%" width="140%" height="130%">
                                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0e6c4a" floodOpacity="0.16" />
                            </filter>
                            <filter id="growth-current-glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" />
                            </filter>
                        </defs>

                        {/* Projection zone */}
                        <rect
                            x={points[5].x}
                            y="15"
                            width={Math.max(0, chartW - points[5].x - chartRight)}
                            height={chartBaseline - 15}
                            fill="url(#growth-projection-zone)"
                        />

                        {/* Horizontal Guide Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                            const y = 15 + val * (chartH - 45);
                            return (
                                <line
                                    key={idx}
                                    x1={chartLeft}
                                    y1={y}
                                    x2={chartW - chartRight}
                                    y2={y}
                                    stroke="#edf1ee"
                                    strokeWidth="1.5"
                                />
                            );
                        })}

                        {/* Value scale */}
                        {[1, 0.5, 0].map((ratio) => {
                            const y = chartBaseline - ratio * (chartBaseline - 25);
                            return (
                                <text
                                    key={`axis-${ratio}`}
                                    x="0"
                                    y={y + 3}
                                    className="fill-stone-400 text-[9px] font-medium"
                                >
                                    {formatCompactIDR(chartMaxValue * ratio)}
                                </text>
                            );
                        })}

                        <line
                            x1={chartLeft}
                            y1={chartBaseline}
                            x2={chartW - chartRight}
                            y2={chartBaseline}
                            stroke="#c9ddd0"
                            strokeWidth="2"
                        />

                        {/* Current boundary */}
                        <line
                            x1={points[5].x}
                            y1="15"
                            x2={points[5].x}
                            y2={chartBaseline}
                            stroke="#c9e5d3"
                            strokeWidth="1.5"
                            strokeDasharray="3 4"
                        />

                        {/* Monthly savings bars */}
                        {bars.map((bar, index) => (
                            <g key={`bar-${index}`}>
                                <rect
                                    x={bar.barX}
                                    y={bar.barY}
                                    width={bar.barWidth}
                                    height={bar.height}
                                    rx="5"
                                    fill={bar.isProjected ? 'url(#growth-projection-bars)' : 'url(#growth-collected-bars)'}
                                    stroke={bar.isProjected ? '#b7cfc0' : 'none'}
                                    strokeWidth={bar.isProjected ? 1 : 0}
                                    filter={bar.isProjected ? undefined : 'url(#growth-bar-shadow)'}
                                />
                                <rect
                                    x={bar.barX + 2}
                                    y={bar.barY + 2}
                                    width={Math.max(0, bar.barWidth - 4)}
                                    height={Math.min(4, bar.height - 1)}
                                    rx="2"
                                    fill="white"
                                    fillOpacity={bar.isProjected ? 0.32 : 0.16}
                                />
                                {index === 5 && bar.height > 10 && (
                                    <rect
                                        x={bar.barX}
                                        y={bar.barY}
                                        width={bar.barWidth}
                                        height="3"
                                        rx="1.5"
                                        fill="#075c3e"
                                    />
                                )}
                                {index === 5 && (
                                    <rect
                                        x={bar.barX - 4}
                                        y={bar.barY - 4}
                                        width={bar.barWidth + 8}
                                        height={bar.height + 8}
                                        rx="9"
                                        fill="none"
                                        stroke="#8cc8a5"
                                        strokeOpacity="0.22"
                                        strokeWidth="4"
                                        filter="url(#growth-current-glow)"
                                    />
                                )}
                            </g>
                        ))}

                        {/* Projection label stays above the bars */}
                        <g pointerEvents="none">
                            <rect
                                x={points[5].x + 5}
                                y="17"
                                width="82"
                                height="16"
                                rx="8"
                                fill="white"
                                fillOpacity="0.95"
                                stroke="#c9e5d3"
                            />
                            <text x={points[5].x + 12} y="28" className="fill-emerald-800 text-[9px] font-semibold">
                                Mulai proyeksi
                            </text>
                        </g>

                        {/* Hovered bar highlight */}
                        {hoveredIdx !== null && (
                            <rect
                                x={bars[hoveredIdx].barX - 2}
                                y={bars[hoveredIdx].barY - 2}
                                width={bars[hoveredIdx].barWidth + 4}
                                height={bars[hoveredIdx].height + 4}
                                rx="7"
                                fill="none"
                                stroke={bars[hoveredIdx].isProjected ? '#79a98d' : '#075c3e'}
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                            />
                        )}

                        {/* X-Axis labels */}
                        {points.map((p, i) => (
                            <text
                                key={i}
                                x={p.x}
                                y={chartH - 2}
                                textAnchor="middle"
                                className="fill-stone-500 text-[11px] font-medium"
                            >
                                {p.month}
                            </text>
                        ))}

                        {/* Transparent hover triggers */}
                        {points.map((p, i) => (
                            <rect
                                key={i}
                                x={p.x - 20}
                                y="0"
                                width="40"
                                height={chartH}
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
                                return <Icon className="h-9 w-9 text-emerald-800" strokeWidth={1.75} aria-hidden="true" />;
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
    const [searchParams] = useSearchParams();
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

    const searchQuery = searchParams.get('q')?.trim().toLowerCase() || '';
    const searchedGoals = searchQuery
        ? viewGoals.filter((goal) => {
            const haystack = ['target tabungan', goal.title, goal.partnerEmail]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return searchQuery.split(/\s+/).every((token) => haystack.includes(token));
        })
        : viewGoals;

    const selectedGoal = useMemo(() => {
        return viewGoals.find(g => g.id === selectedGoalId) || null;
    }, [selectedGoalId, viewGoals]);

    const runningGoals = searchedGoals.filter((g) => g.progress < 100);
    const doneGoals = searchedGoals.filter((g) => g.progress >= 100);
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
                        <Plus className="h-5 w-5" aria-hidden="true" strokeWidth={2.5} />
                        <svg className="hidden" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M9 15H11V11H15V9H11V5H9V9H5V11H9V15ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6792 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3667 19.7375 12.6583 19.2125 13.875C18.6875 15.0917 17.975 16.1542 17.075 17.0625C16.175 17.9708 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z" fill="white" />
                        </svg>
                        Tambah Target
                    </button>
                </div>

                {/* ── Summary Bento Grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Total Terkumpul */}
                    <div className="savings-stat-card savings-stat-collected ui-stat-card flex items-center gap-4">
                        <div className="ui-tone-icon ui-tone-positive w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                            <PiggyBank className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-neutral-700 text-xs font-medium leading-4">Total Terkumpul</span>
                            <span className="block text-zinc-900 text-xl font-semibold leading-7 mt-1 truncate">{fmtIDR(totalCollected)}</span>
                        </div>
                    </div>

                    {/* Target Aktif */}
                    <div className="savings-stat-card savings-stat-active ui-stat-card flex items-center gap-4">
                        <div className="ui-tone-icon ui-tone-info w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                            <Target className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                            <span className="block text-neutral-700 text-xs font-medium leading-4">Target Aktif</span>
                            <span className="block text-zinc-900 text-xl font-semibold leading-7 mt-1">{runningGoals.length} Tujuan</span>
                        </div>
                    </div>

                    {/* Rerata Progres */}
                    <div className="savings-stat-card savings-stat-progress ui-stat-card flex items-center gap-4">
                        <div className="ui-tone-icon ui-tone-positive w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                            <TrendingUp className="h-5 w-5" aria-hidden="true" />
                            <svg className="hidden" width="23" height="23" viewBox="0 0 23 23" fill="none">
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
                            <Lightbulb className="h-4 w-4" aria-hidden="true" />
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
                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                            <div className="inline-flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4 text-slate-600" aria-hidden="true" />
                                <span className="text-neutral-700 text-sm font-semibold leading-4 tracking-wide">Urutkan:</span>
                            </div>
                            <div className="relative min-w-0 flex-1 sm:flex-none">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setSortOpen((v) => !v); }}
                                    aria-expanded={sortOpen}
                                    aria-controls="savings-sort-menu"
                                    className="ui-button inline-flex min-h-[2.375rem] w-full min-w-0 items-center justify-between border border-stone-300 bg-white text-zinc-900 hover:bg-stone-50 sm:w-40"
                                >
                                    <span className="truncate text-left text-sm font-semibold leading-4 tracking-wide">{sortBy}</span>
                                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${sortOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                                </button>
                                {sortOpen && (
                                    <div id="savings-sort-menu" className="ui-popover absolute right-0 z-20 mt-2 w-full min-w-40 overflow-hidden bg-white py-1 outline outline-1 outline-stone-300 sm:w-40">
                                        {SORT_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
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
                            {searchQuery ? (
                                <>
                                    <Target className="h-8 w-8 text-sky-700" aria-hidden="true" />
                                    <p className="text-base font-semibold text-zinc-900">Target tidak ditemukan</p>
                                    <p>Tidak ada target yang cocok dengan pencarian &quot;{searchParams.get('q')}&quot;.</p>
                                </>
                            ) : activeTab === 'berjalan' ? (
                                <>
                                    <Target className="h-8 w-8 text-sky-700" aria-hidden="true" />
                                    <p className="text-base font-semibold text-zinc-900">Belum ada target tabungan aktif</p>
                                    <p>Buat target pertama Anda untuk mulai memantau progres, proyeksi tabungan, dan insight finansial.</p>
                                    <button
                                        onClick={() => setModalOpen(true)}
                                        className="ui-button mt-1 inline-flex items-center gap-2 bg-emerald-800 text-white hover:bg-emerald-700"
                                    >
                                        <Plus className="h-4 w-4" aria-hidden="true" />
                                        Tambah Target
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
