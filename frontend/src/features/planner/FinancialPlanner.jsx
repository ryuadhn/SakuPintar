import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useFinance } from '../../contexts/FinanceContext';
import { fmtIDR, currentMonthKey } from '../../utils/format';
import { AlertTriangle, Info, PiggyBank, ShieldCheck, Target } from 'lucide-react';

export default function FinancialPlanner() {
    const { transactions, monthStats } = useFinance();

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
    const currentMonthTransactions = useMemo(
        () => transactions.filter((transaction) => (
            transaction.date?.slice(0, 7) === currentMonth
            && (transaction.type === 'income' || transaction.type === 'expense')
            && Number(transaction.amount) > 0
        )),
        [transactions, currentMonth]
    );
    const hasIncomeData = currentMonthTransactions.some((transaction) => transaction.type === 'income');
    const hasExpenseData = currentMonthTransactions.some((transaction) => transaction.type === 'expense');
    const hasCashflowData = hasIncomeData && hasExpenseData;

    // ─── Input States ───
    const [targetTitle, setTargetTitle] = useState('Dana Darurat Mandiri');
    const [targetAmount, setTargetAmount] = useState(100000000);
    const [years, setYears] = useState(5);
    const [initialSavings, setInitialSavings] = useState(10000000);
    const [inflationRate, setInflationRate] = useState(4); // 4% default inflation in ID
    const [returnRate, setReturnRate] = useState(7); // 7% default return

    const simulationInputsValid = [targetAmount, years, initialSavings, inflationRate, returnRate]
        .every((value) => Number.isFinite(value))
        && targetAmount > 0
        && years > 0
        && initialSavings >= 0
        && inflationRate >= 0
        && returnRate >= 0;

    // ─── Financial Calculator Logic ───
    const projection = useMemo(() => {
        if (!simulationInputsValid) {
            return {
                isValid: false,
                adjustedTarget: null,
                monthlyPMT: null,
                totalContributions: null,
                totalOutPocket: null,
                totalGains: null,
                feasibilityStatus: 'Belum cukup data',
                feasibilityDesc: 'Lengkapi target nominal, jangka waktu, modal awal, inflasi, dan bunga investasi dengan nilai yang valid.',
                feasibilityClass: 'ui-tone-neutral',
                feasibilityIcon: Info,
                allocationTitle: '',
                allocationDesc: '',
                allocationDetails: [],
                ratio: null,
            };
        }

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
        let feasibilityStatus = 'Belum cukup data';
        let feasibilityDesc = '';
        let feasibilityClass = 'ui-tone-neutral';
        let feasibilityIcon = Info;

        const ratio = netCashflow > 0 ? (monthlyPMT / netCashflow) * 100 : Infinity;

        if (!hasCashflowData) {
            feasibilityStatus = 'Belum cukup data';
            feasibilityDesc = 'Data pemasukan dan pengeluaran bulan ini belum lengkap. Catat transaksi terlebih dahulu agar kelayakan arus kas dapat dianalisis dengan lebih akurat.';
        } else if (netCashflow < 0) {
            feasibilityStatus = 'Tidak Disarankan';
            feasibilityClass = 'ui-tone-danger';
            feasibilityIcon = AlertTriangle;
            feasibilityDesc = `Arus kas bulan ini tercatat defisit sebesar ${fmtIDR(Math.abs(netCashflow))}. Setoran bulanan ${fmtIDR(monthlyPMT)} belum didukung oleh arus kas yang tercatat; pertimbangkan menyesuaikan target atau jangka waktunya.`;
        } else if (netCashflow === 0) {
            feasibilityStatus = 'Netral';
            feasibilityClass = 'ui-tone-neutral';
            feasibilityIcon = Info;
            feasibilityDesc = 'Arus kas bulan ini masih Rp 0, jadi belum ada surplus atau defisit tercatat. Tambahkan transaksi pemasukan dan pengeluaran agar rekomendasi lebih akurat.';
        } else if (monthlyPMT === 0) {
            feasibilityStatus = 'Layak';
            feasibilityClass = 'ui-tone-positive';
            feasibilityIcon = ShieldCheck;
            feasibilityDesc = `Berdasarkan parameter simulasi, modal awal dan asumsi pertumbuhan sudah menutup target. Arus kas bulan ini tercatat surplus ${fmtIDR(netCashflow)}.`;
        } else if (ratio <= 35) {
            feasibilityStatus = 'Layak';
            feasibilityClass = 'ui-tone-positive';
            feasibilityIcon = ShieldCheck;
            feasibilityDesc = `Setoran bulanan ${fmtIDR(monthlyPMT)} setara sekitar ${Math.round(ratio)}% dari surplus tercatat ${fmtIDR(netCashflow)}. Gunakan angka ini sebagai simulasi, bukan kepastian hasil.`;
        } else if (ratio <= 100) {
            feasibilityStatus = 'Perlu Penyesuaian';
            feasibilityClass = 'ui-tone-warning';
            feasibilityIcon = AlertTriangle;
            feasibilityDesc = `Setoran bulanan ${fmtIDR(monthlyPMT)} menggunakan sekitar ${Math.round(ratio)}% dari surplus tercatat ${fmtIDR(netCashflow)}. Pertimbangkan jangka waktu yang lebih panjang agar ruang kas tetap tersedia.`;
        } else {
            feasibilityStatus = 'Tidak Disarankan';
            feasibilityClass = 'ui-tone-danger';
            feasibilityIcon = AlertTriangle;
            const suggestedYears = Math.ceil(years * 1.8);
            feasibilityDesc = `Setoran bulanan ${fmtIDR(monthlyPMT)} melebihi surplus tercatat ${fmtIDR(netCashflow)}. Coba naikkan jangka waktu menjadi sekitar ${suggestedYears} tahun atau perkecil target utama.`;
        }

        // 7. Asset allocation advice based on tenure
        let allocationTitle = '';
        let allocationDesc = '';
        let allocationDetails = [];

        if (years <= 2) {
            allocationTitle = 'Profil Konservatif (Jangka Pendek)';
            allocationDesc = 'Contoh simulasi dengan fokus pada likuiditas dan pembatasan fluktuasi untuk horizon pendek.';
            allocationDetails = [
                { name: 'Reksadana Pasar Uang', pct: 75, desc: 'Contoh komponen likuid; risiko dan hasil mengikuti produk.' },
                { name: 'Tabungan Digital / Deposito', pct: 25, desc: 'Contoh komponen likuiditas; syarat dan bunga mengikuti penyedia.' }
            ];
        } else if (years <= 5) {
            allocationTitle = 'Profil Moderat (Jangka Menengah)';
            allocationDesc = 'Contoh simulasi yang membagi porsi antara pendapatan tetap, pertumbuhan, dan likuiditas.';
            allocationDetails = [
                { name: 'Reksadana Pendapatan Tetap / SBN', pct: 60, desc: 'Contoh komponen pendapatan tetap; risiko dan hasil dapat berbeda.' },
                { name: 'Reksadana Saham / ETF Indeks', pct: 25, desc: 'Contoh komponen pertumbuhan; nilainya dapat berfluktuasi.' },
                { name: 'Reksadana Pasar Uang', pct: 15, desc: 'Contoh komponen likuid untuk kebutuhan simulasi.' }
            ];
        } else {
            allocationTitle = 'Profil Agresif (Jangka Panjang)';
            allocationDesc = 'Contoh simulasi dengan porsi lebih besar pada aset pertumbuhan untuk horizon panjang.';
            allocationDetails = [
                { name: 'Reksadana Saham / ETF Saham', pct: 70, desc: 'Contoh komponen pertumbuhan; fluktuasi dan hasil tidak dijamin.' },
                { name: 'Surat Berharga Negara (SBN)', pct: 20, desc: 'Contoh komponen pendapatan tetap; bukan jaminan hasil simulasi.' },
                { name: 'Logam Mulia (Emas)', pct: 10, desc: 'Contoh diversifikasi; nilainya dapat berfluktuasi.' }
            ];
        }

        return {
            isValid: true,
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
    }, [targetAmount, years, initialSavings, inflationRate, returnRate, netCashflow, hasCashflowData, simulationInputsValid]);

    const FeasibilityIcon = projection.feasibilityIcon;

    return (
        <AuthenticatedLayout>
            <div className="app-page">
                
                {/* Header */}
                <div className="app-page-header">
                    <div>
                        <h1 className="app-page-title">Perencana AI</h1>
                        <p className="app-page-description">Simulasikan target investasi masa depan Anda dengan analisis kelayakan arus kas bulanan secara riil.</p>
                    </div>
                </div>

                {/* Main Projections Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left: Input Form Parameters (5/12) */}
                    <div className="ui-card lg:col-span-5 flex flex-col gap-4">
                        <div>
                            <h3 className="ui-section-title">Parameter Simulasi</h3>
                            <p className="ui-section-description">Sesuaikan instrumen dan estimasi target di bawah ini.</p>
                        </div>

                        {/* Title Input */}
                        <div>
                            <label htmlFor="financial-target-title" className="ui-field-label block mb-1.5">Nama target finansial</label>
                            <input
                                id="financial-target-title"
                                type="text"
                                value={targetTitle}
                                onChange={(e) => setTargetTitle(e.target.value)}
                                className="ui-control w-full bg-slate-50 px-4 py-2.5"
                            />
                        </div>

                        {/* Target Nominal */}
                        <div>
                            <label htmlFor="financial-target-amount" className="ui-field-label block mb-1.5">Target nominal utama (rupiah)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm font-semibold">Rp</div>
                                <input
                                    id="financial-target-amount"
                                    type="text"
                                    value={formatInputValue(targetAmount)}
                                    onChange={(e) => setTargetAmount(parseInputValue(e.target.value))}
                                    aria-describedby="financial-target-amount-hint"
                                    className="ui-control block w-full pl-10 pr-4 py-2.5 font-semibold"
                                />
                            </div>
                            <span id="financial-target-amount-hint" className="text-[10px] text-slate-400 mt-1 block">Contoh: 100.000.000 (100 Juta Rupiah)</span>
                        </div>

                        {/* Jangka Waktu Slider */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="financial-years" className="ui-field-label block">Jangka waktu pencapaian</label>
                                <span className="text-sm font-semibold text-emerald-800">{years} Tahun</span>
                            </div>
                            <input
                                id="financial-years"
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
                            <label htmlFor="financial-initial-savings" className="ui-field-label block mb-1.5">Modal awal tabungan (rupiah)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm font-semibold">Rp</div>
                                <input
                                    id="financial-initial-savings"
                                    type="text"
                                    value={formatInputValue(initialSavings)}
                                    onChange={(e) => setInitialSavings(parseInputValue(e.target.value))}
                                    className="ui-control block w-full pl-10 pr-4 py-2.5 font-semibold"
                                />
                            </div>
                        </div>

                        {/* Two columns: Inflation and Interest Rate */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="financial-inflation-rate" className="ui-field-label block mb-1.5">Asumsi inflasi</label>
                                <div className="relative">
                                    <input
                                        id="financial-inflation-rate"
                                        type="number"
                                        step="0.1"
                                        value={inflationRate}
                                        onChange={(e) => setInflationRate(Number(e.target.value))}
                                        className="ui-control block w-full pr-8 pl-3.5 py-2.5"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-sm">%</div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="financial-return-rate" className="ui-field-label block mb-1.5">Bunga investasi</label>
                                <div className="relative">
                                    <input
                                        id="financial-return-rate"
                                        type="number"
                                        step="0.1"
                                        value={returnRate}
                                        onChange={(e) => setReturnRate(Number(e.target.value))}
                                        className="ui-control block w-full pr-8 pl-3.5 py-2.5"
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
                            <div className="ui-card-emphasis p-5 flex flex-col justify-between min-h-32 relative overflow-hidden">
                                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-200">
                                    <PiggyBank className="h-4 w-4" aria-hidden="true" />
                                    Setoran bulanan wajib
                                </span>
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight mt-1.5">
                                        {projection.isValid ? fmtIDR(projection.monthlyPMT) : '—'}
                                    </h2>
                                    <p className="text-xs text-emerald-300 mt-1">
                                        {projection.isValid
                                            ? `Harus disisihkan selama ${years * 12} bulan.`
                                            : 'Lengkapi parameter simulasi untuk menghitung setoran.'}
                                    </p>
                                </div>
                            </div>

                            {/* Adjusted target with inflation */}
                            <div className="ui-card p-5 flex flex-col justify-between min-h-32 relative overflow-hidden">
                                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                    <Target className="h-4 w-4 text-sky-700" aria-hidden="true" />
                                    Target disesuaikan inflasi
                                </span>
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-800 tracking-tight mt-1.5">
                                        {projection.isValid ? fmtIDR(projection.adjustedTarget) : '—'}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {projection.isValid
                                            ? `Nilai masa depan di tahun ke-${years}.`
                                            : 'Hasil tersedia setelah input valid.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* AI Feasibility Advisor Alert */}
                        <div className={`ui-alert p-4 border ${projection.feasibilityClass} flex gap-3 items-start`}>
                            <FeasibilityIcon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">Status kelayakan AI:</span>
                                    <span className="ui-badge bg-white border-current">{projection.feasibilityStatus}</span>
                                </div>
                                <p className="text-sm leading-relaxed">{projection.feasibilityDesc}</p>
                            </div>
                        </div>

                        {/* Breakdown Box */}
                        {projection.isValid ? (
                        <div className="ui-card">
                            <h4 className="ui-section-title mb-3">Rincian Akumulasi Proyeksi</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Target Awal (Nilai Saat Ini)</span>
                                    <span className="font-medium text-slate-800">{fmtIDR(targetAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-b border-stone-100 pb-2.5">
                                    <span className="text-slate-500">Biaya Inflasi Tambahan ({inflationRate}% / thn)</span>
                                    <span className="font-medium text-rose-600">+{fmtIDR(projection.adjustedTarget - targetAmount)}</span>
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
                                    <span className="font-medium text-emerald-700">+{fmtIDR(projection.totalGains)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-2 font-semibold">
                                    <span className="text-slate-800">Total Akumulasi Masa Depan (FV)</span>
                                    <span className="text-emerald-800">{fmtIDR(projection.adjustedTarget)}</span>
                                </div>
                            </div>
                        </div>
                        ) : (
                            <div className="ui-card">
                                <h4 className="ui-section-title mb-2">Rincian Akumulasi Proyeksi</h4>
                                <p className="ui-section-description">Rincian akan ditampilkan setelah seluruh parameter simulasi diisi dengan nilai yang valid.</p>
                            </div>
                        )}

                        {/* AI Suggested Portfolio Allocation */}
                        {projection.isValid && (
                            <div className="ui-card flex flex-col gap-3">
                                <div>
                                    <h4 className="ui-section-title">Contoh Alokasi Berdasarkan Profil Simulasi</h4>
                                    <p className="ui-section-description">{projection.allocationTitle}. {projection.allocationDesc}</p>
                                    <p className="text-xs text-slate-400 mt-1">Alokasi ini bersifat rule-based dari jangka waktu simulasi, bukan rekomendasi investasi personal.</p>
                                </div>

                                <div className="space-y-4">
                                    {projection.allocationDetails.map((asset, idx) => (
                                        <div key={idx} className="space-y-1.5">
                                            <div className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-800" />
                                                    <span className="font-medium text-slate-700">{asset.name}</span>
                                                </div>
                                                <span className="font-semibold text-emerald-800">{asset.pct}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div className="bg-emerald-800 h-full rounded-full" style={{ width: `${asset.pct}%` }} />
                                            </div>
                                            <span className="text-[10px] text-slate-400 block pl-4.5">{asset.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}
