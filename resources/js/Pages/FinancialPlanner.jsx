import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import { useFinance } from '../Store/FinanceContext';
import { fmtIDR, currentMonthKey } from '../Utils/format';
import { Compass, Info, TrendingUp, DollarSign, Calendar, RefreshCw, AlertTriangle, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function FinancialPlanner() {
    const { monthStats } = useFinance();

    // Helper to format raw numbers to IDR style dots (e.g. 10.000.000)
    const formatInputValue = (num) => {
        if (num === 0) return '0';
        if (!num) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // Helper to parse formatted IDR string back to raw number
    const parseInputValue = (str) => {
        const cleaned = str.replace(/\./g, '').replace(/\D/g, '');
        if (cleaned === '') return 0;
        return parseInt(cleaned, 10);
    };

    // ─── Live Cashflow Context ───
    const currentMonth = currentMonthKey();
    const stats = monthStats(currentMonth);
    const netCashflow = stats.net; // Sisa uang bersih bulan ini

    // ─── Input States ───
    const [targetTitle, setTargetTitle] = useState('Dana Darurat Mandiri');
    const [targetAmount, setTargetAmount] = useState(100000000);
    const [years, setYears] = useState(5);
    const [initialSavings, setInitialSavings] = useState(10000000);
    const [inflationRate, setInflationRate] = useState(4); // 4% default inflation in ID
    const [returnRate, setReturnRate] = useState(7); // 7% default return

    // ─── Financial Calculator Logic ───
    const projection = useMemo(() => {
        const totalMonths = Math.max(1, years * 12);
        
        // 1. Inflation Adjusted Target
        const inflationFactor = Math.pow(1 + (inflationRate / 100), years);
        const adjustedTarget = Math.round(targetAmount * inflationFactor);

        // 2. Initial Savings Growth
        const monthlyReturn = (returnRate / 100) / 12;
        const initialGrowth = Math.round(initialSavings * Math.pow(1 + monthlyReturn, totalMonths));

        // 3. Remaining amount to reach
        const remainingTarget = Math.max(0, adjustedTarget - initialGrowth);

        // 4. Monthly savings required (PMT)
        let monthlyPMT = 0;
        if (remainingTarget > 0) {
            if (monthlyReturn === 0) {
                monthlyPMT = Math.round(remainingTarget / totalMonths);
            } else {
                monthlyPMT = Math.round(
                    (remainingTarget * monthlyReturn) / 
                    (Math.pow(1 + monthlyReturn, totalMonths) - 1)
                );
            }
        }

        // 5. Total out-of-pocket & Total return gains
        const totalContributions = monthlyPMT * totalMonths;
        const totalOutPocket = initialSavings + totalContributions;
        const totalGains = Math.max(0, adjustedTarget - totalOutPocket);

        // 6. AI Feasibility Analysis
        let feasibilityStatus = 'Sangat Layak';
        let feasibilityDesc = '';
        let feasibilityClass = 'text-emerald-800 bg-emerald-50 border-emerald-200';
        let feasibilityIcon = ShieldCheck;

        const ratio = netCashflow > 0 ? (monthlyPMT / netCashflow) * 100 : Infinity;

        if (netCashflow <= 0) {
            feasibilityStatus = 'Perlu Penyesuaian';
            feasibilityClass = 'text-rose-700 bg-rose-50 border-rose-200';
            feasibilityIcon = AlertTriangle;
            feasibilityDesc = `Arus kas bulanan Anda saat ini sedang defisit (${fmtIDR(netCashflow)}). Disarankan untuk menekan pengeluaran belanja harian terlebih dahulu sebelum merencanakan investasi berkala ini.`;
        } else if (ratio <= 35) {
            feasibilityStatus = 'Sangat Realistis';
            feasibilityClass = 'text-emerald-800 bg-emerald-50 border-emerald-200';
            feasibilityIcon = ShieldCheck;
            feasibilityDesc = `Rencana investasi bulanan sebesar ${fmtIDR(monthlyPMT)} hanya memakan ${Math.round(ratio)}% dari sisa kas bulanan Anda (${fmtIDR(netCashflow)}). Anda berada di zona aman finansial!`;
        } else if (ratio <= 100) {
            feasibilityStatus = 'Menantang';
            feasibilityClass = 'text-amber-800 bg-amber-50 border-amber-200';
            feasibilityIcon = AlertTriangle;
            feasibilityDesc = `Cukup ketat. Setoran bulanan memakan ${Math.round(ratio)}% dari sisa kas bulanan Anda (${fmtIDR(netCashflow)}). Disarankan untuk menetapkan batas pengeluaran (budget limit) baru di halaman Kategori untuk mengamankan tabungan bulanan.`;
        } else {
            feasibilityStatus = 'Kurang Realistis';
            feasibilityClass = 'text-rose-700 bg-rose-50 border-rose-200';
            feasibilityIcon = AlertTriangle;
            const suggestedYears = Math.ceil(years * 1.8);
            feasibilityDesc = `Setoran wajib (${fmtIDR(monthlyPMT)}) melebihi sisa kas bulanan aktif Anda (${fmtIDR(netCashflow)}). Coba naikkan jangka waktu target menjadi minimal ${suggestedYears} tahun atau perkecil nominal target utama Anda agar arus kas tetap seimbang.`;
        }

        // 7. Asset allocation advice based on tenure
        let allocationTitle = '';
        let allocationDesc = '';
        let allocationDetails = [];

        if (years <= 2) {
            allocationTitle = 'Profil Konservatif (Jangka Pendek)';
            allocationDesc = 'Fokus utama pada perlindungan nilai modal dan kemudahan likuiditas aset.';
            allocationDetails = [
                { name: 'Reksadana Pasar Uang', pct: 75, desc: 'Likuiditas tinggi, risiko hampir nol.' },
                { name: 'Tabungan Digital / Deposito', pct: 25, desc: 'Aman dengan bunga tetap terjamin.' }
            ];
        } else if (years <= 5) {
            allocationTitle = 'Profil Moderat (Jangka Menengah)';
            allocationDesc = 'Menyeimbangkan pertumbuhan bunga majemuk dengan perlindungan fluktuasi jangka menengah.';
            allocationDetails = [
                { name: 'Reksadana Pendapatan Tetap / SBN', pct: 60, desc: 'Pendapatan kupon bulanan yang stabil.' },
                { name: 'Reksadana Saham / ETF Indeks', pct: 25, desc: 'Pertumbuhan modal jangka panjang.' },
                { name: 'Reksadana Pasar Uang', pct: 15, desc: 'Cadangan kas jika pasar terkoreksi.' }
            ];
        } else {
            allocationTitle = 'Profil Agresif (Jangka Panjang)';
            allocationDesc = 'Memaksimalkan kekuatan efek bunga majemuk untuk mengatasi inflasi secara optimal.';
            allocationDetails = [
                { name: 'Reksadana Saham / ETF Saham', pct: 70, desc: 'Keuntungan tinggi jangka panjang.' },
                { name: 'Surat Berharga Negara (SBN)', pct: 20, desc: 'Kestabilan dan jaminan kupon.' },
                { name: 'Logam Mulia (Emas)', pct: 10, desc: 'Aset lindung nilai terhadap inflasi tinggi.' }
            ];
        }

        return {
            adjustedTarget,
            monthlyPMT,
            totalContributions,
            totalOutPocket,
            totalGains,
            feasibilityStatus,
            feasibilityDesc,
            feasibilityClass,
            feasibilityIcon,
            allocationTitle,
            allocationDesc,
            allocationDetails,
            ratio: ratio !== Infinity ? Math.round(ratio) : 0
        };
    }, [targetAmount, years, initialSavings, inflationRate, returnRate, netCashflow]);

    const FeasibilityIcon = projection.feasibilityIcon;

    return (
        <AuthenticatedLayout>
            <div className="flex flex-col gap-8 pb-12">
                
                {/* Header */}
                <div>
                    <h1 className="text-zinc-900 text-3xl font-bold leading-10 flex items-center gap-3">
                        <Compass className="w-8 h-8 text-emerald-800" />
                        Perencana AI
                    </h1>
                    <p className="text-neutral-700 text-sm mt-1">Simulasikan target investasi masa depan Anda dengan analisis kelayakan arus kas bulanan secara riil.</p>
                </div>

                {/* Main Projections Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Input Form Parameters (5/12) */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-6">
                        <div>
                            <h3 className="font-bold text-slate-800 text-base">Parameter Simulasi</h3>
                            <p className="text-slate-500 text-xs mt-0.5">Sesuaikan instrumen dan estimasi target di bawah ini.</p>
                        </div>

                        {/* Title Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Target Finansial</label>
                            <input
                                type="text"
                                value={targetTitle}
                                onChange={(e) => setTargetTitle(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>

                        {/* Target Nominal */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Nominal Utama (Rupiah)</label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm font-semibold">Rp</div>
                                <input
                                    type="text"
                                    value={formatInputValue(targetAmount)}
                                    onChange={(e) => setTargetAmount(parseInputValue(e.target.value))}
                                    className="block w-full rounded-xl border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white border font-semibold text-slate-800"
                                />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">Contoh: 100.000.000 (100 Juta Rupiah)</span>
                        </div>

                        {/* Jangka Waktu Slider */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Jangka Waktu Pencapaian</label>
                                <span className="text-sm font-bold text-emerald-800">{years} Tahun</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="30"
                                value={years}
                                onChange={(e) => setYears(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-800"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                <span>1 Tahun</span>
                                <span>15 Tahun</span>
                                <span>30 Tahun</span>
                            </div>
                        </div>

                        {/* Tabungan Awal */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Modal Awal Tabungan (Rupiah)</label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm font-semibold">Rp</div>
                                <input
                                    type="text"
                                    value={formatInputValue(initialSavings)}
                                    onChange={(e) => setInitialSavings(parseInputValue(e.target.value))}
                                    className="block w-full rounded-xl border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white border font-semibold text-slate-800"
                                />
                            </div>
                        </div>

                        {/* Two columns: Inflation and Interest Rate */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Asumsi Inflasi</label>
                                <div className="relative rounded-xl shadow-sm">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={inflationRate}
                                        onChange={(e) => setInflationRate(Number(e.target.value))}
                                        className="block w-full rounded-xl border-slate-200 pr-8 pl-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white border"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-sm">%</div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Bunga Investasi</label>
                                <div className="relative rounded-xl shadow-sm">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={returnRate}
                                        onChange={(e) => setReturnRate(Number(e.target.value))}
                                        className="block w-full rounded-xl border-slate-200 pr-8 pl-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white border"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-sm">%</div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right: Results Projection & AI Advisor Analysis (7/12) */}
                    <div className="lg:col-span-7 flex flex-col gap-6">

                        {/* Key Output Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Monthly Saving Needed */}
                            <div className="bg-emerald-950 p-6 rounded-3xl border border-emerald-900 shadow-sm flex flex-col justify-between min-h-36 relative overflow-hidden text-white">
                                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-10">
                                    <DollarSign className="w-36 h-36" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Setoran Bulanan Wajib</span>
                                <div>
                                    <h2 className="text-3xl font-extrabold tracking-tight mt-2">{fmtIDR(projection.monthlyPMT)}</h2>
                                    <p className="text-xs text-emerald-300 mt-1">Harus disisihkan selama {years * 12} bulan.</p>
                                </div>
                            </div>

                            {/* Adjusted target with inflation */}
                            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between min-h-36 relative overflow-hidden">
                                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-5">
                                    <TrendingUp className="w-36 h-36" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Disesuaikan Inflasi</span>
                                <div>
                                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-2">{fmtIDR(projection.adjustedTarget)}</h2>
                                    <p className="text-xs text-slate-500 mt-1">Nilai masa depan di tahun ke-{years}.</p>
                                </div>
                            </div>
                        </div>

                        {/* AI Feasibility Advisor Alert */}
                        <div className={`p-6 rounded-3xl border ${projection.feasibilityClass} flex gap-4 items-start shadow-sm`}>
                            <FeasibilityIcon className="w-6 h-6 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider">Status Kelayakan AI:</span>
                                    <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-white border border-current">{projection.feasibilityStatus}</span>
                                </div>
                                <p className="text-sm leading-relaxed">{projection.feasibilityDesc}</p>
                            </div>
                        </div>

                        {/* Breakdown Box */}
                        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 text-sm mb-4">Rincian Akumulasi Proyeksi</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Target Awal (Nilai Saat Ini)</span>
                                    <span className="font-bold text-slate-800">{fmtIDR(targetAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-b border-stone-100 pb-2.5">
                                    <span className="text-slate-500">Biaya Inflasi Tambahan ({inflationRate}% / thn)</span>
                                    <span className="font-bold text-rose-600">+{fmtIDR(projection.adjustedTarget - targetAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs pt-1">
                                    <span className="text-slate-500">Modal Setor Awal Anda</span>
                                    <span className="font-semibold text-slate-800">{fmtIDR(initialSavings)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Total Akumulasi Setoran Bulanan</span>
                                    <span className="font-semibold text-slate-800">{fmtIDR(projection.totalContributions)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-b border-stone-100 pb-2.5">
                                    <span className="text-slate-500">Pertumbuhan Bunga/Hasil Investasi ({returnRate}% / thn)</span>
                                    <span className="font-bold text-emerald-700">+{fmtIDR(projection.totalGains)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-2 font-bold">
                                    <span className="text-slate-800">Total Akumulasi Masa Depan (FV)</span>
                                    <span className="text-emerald-800">{fmtIDR(projection.adjustedTarget)}</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Suggested Portfolio Allocation */}
                        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-4">
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">Alokasi Portofolio yang Disarankan</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{projection.allocationTitle}. {projection.allocationDesc}</p>
                            </div>
                            
                            <div className="space-y-4">
                                {projection.allocationDetails.map((asset, idx) => (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-800" />
                                                <span className="font-bold text-slate-700">{asset.name}</span>
                                            </div>
                                            <span className="font-bold text-emerald-800">{asset.pct}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-emerald-800 h-full rounded-full" style={{ width: `${asset.pct}%` }} />
                                        </div>
                                        <span className="text-[10px] text-slate-400 block pl-4.5">{asset.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}
