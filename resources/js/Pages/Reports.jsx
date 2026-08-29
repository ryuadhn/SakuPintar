import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import { useFinance } from '../Store/FinanceContext';
import { fmtIDR, currentMonthKey, formatMonthYear } from '../Utils/format';
import { TrendingUp, TrendingDown, BrainCircuit, CheckCircle, Info, Calendar } from 'lucide-react';

export default function Reports() {
    const { transactions, categories, getBudgetAlerts, wallets } = useFinance();

    // ─── State ───
    const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
    const [hoveredCatId, setHoveredCatId] = useState(null);

    // ─── Extract All Available Months for Filter ───
    const availableMonths = useMemo(() => {
        const monthsSet = new Set([currentMonthKey()]);
        transactions.forEach((t) => {
            if (t.date) {
                monthsSet.add(t.date.slice(0, 7));
            }
        });
        return Array.from(monthsSet).sort().reverse();
    }, [transactions]);

    // ─── Filter Transactions for Selected Month ───
    const monthTransactions = useMemo(() => {
        return transactions.filter((t) => t.date && t.date.slice(0, 7) === selectedMonth);
    }, [transactions, selectedMonth]);

    // ─── Calculate Cash Flow Stats ───
    const stats = useMemo(() => {
        let income = 0;
        let expense = 0;
        monthTransactions.forEach((t) => {
            if (t.type === 'income') income += t.amount;
            else if (t.type === 'expense') expense += t.amount;
        });
        const net = income - expense;
        const savingsRate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;
        return { income, expense, net, savingsRate };
    }, [monthTransactions]);

    // ─── Group Expense by Category ───
    const categoryData = useMemo(() => {
        if (stats.expense === 0) return [];
        const map = {};
        monthTransactions.forEach((t) => {
            if (t.type !== 'expense') return;
            const catId = t.categoryId || 'other';
            map[catId] = (map[catId] || 0) + t.amount;
        });

        const data = Object.entries(map).map(([catId, amount]) => {
            const catObj = categories.find((c) => c.id === catId) || { name: 'Lain-lain', color: '#64748B' };
            return {
                id: catId,
                name: catObj.name,
                color: catObj.color,
                amount,
                percentage: Math.round((amount / stats.expense) * 100),
            };
        });

        // Sort descending by amount
        return data.sort((a, b) => b.amount - a.amount);
    }, [monthTransactions, categories, stats.expense]);

    // ─── Calculate SVG Donut Chart Segments ───
    const donutSegments = useMemo(() => {
        const radius = 50;
        const circumference = 2 * Math.PI * radius; // 314.16
        let currentOffset = 0;

        return categoryData.map((d) => {
            const angle = (d.amount / stats.expense) * 360;
            const strokeLength = (d.amount / stats.expense) * circumference;
            const strokeOffset = circumference - strokeLength + currentOffset;
            currentOffset += strokeLength;

            return {
                ...d,
                strokeLength,
                strokeOffset,
                circumference,
            };
        });
    }, [categoryData, stats.expense]);

    // ─── Hovered Category Detail in Center ───
    const displayedCategory = useMemo(() => {
        if (hoveredCatId) {
            return categoryData.find((c) => c.id === hoveredCatId) || null;
        }
        // Fallback to top category if any
        return categoryData[0] || null;
    }, [hoveredCatId, categoryData]);

    // ─── Daily Spending Trend ───
    const dailyTrend = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyAmounts = Array(daysInMonth).fill(0);

        monthTransactions.forEach((t) => {
            if (t.type !== 'expense') return;
            const day = Number(t.date.slice(8, 10));
            if (day >= 1 && day <= daysInMonth) {
                dailyAmounts[day - 1] += t.amount;
            }
        });

        const maxAmount = Math.max(...dailyAmounts, 100000); // Avoid division by zero

        return dailyAmounts.map((amount, index) => ({
            day: index + 1,
            amount,
            heightPercent: Math.min(100, Math.round((amount / maxAmount) * 100)),
        }));
    }, [monthTransactions, selectedMonth]);

    // ─── AI Financial Advisor Recommendations ───
    const aiInsights = useMemo(() => {
        const insights = [];
        const { income, expense, net, savingsRate } = stats;

        // 1. Defisit check
        if (net < 0) {
            insights.push({
                type: 'danger',
                title: 'Defisit Anggaran Terdeteksi',
                desc: `Pengeluaran Anda bulan ini melebihi pemasukan sebesar ${fmtIDR(Math.abs(net))}. Disarankan untuk membatasi pengeluaran non-esensial segera.`,
            });
        } else if (savingsRate >= 25) {
            insights.push({
                type: 'success',
                title: 'Kesehatan Tabungan Sangat Baik',
                desc: `Luar biasa! Anda menghemat ${savingsRate}% dari pemasukan bulan ini. Pertahankan tingkat tabungan yang sehat ini.`,
            });
        } else if (income > 0 && savingsRate < 10) {
            insights.push({
                type: 'warning',
                title: 'Rasio Tabungan Rendah',
                desc: `Rasio menabung Anda hanya ${savingsRate}% bulan ini (di bawah rekomendasi 10%-20%). Cobalah menyisihkan dana tabungan di awal bulan sebelum berbelanja.`,
            });
        }

        // 2. Impulsive Category Check
        categoryData.forEach((c) => {
            if (c.percentage >= 35 && ['lifestyle', 'shopping', 'food'].includes(c.id)) {
                insights.push({
                    type: 'warning',
                    title: `Dominasi Pengeluaran Kategori: ${c.name}`,
                    desc: `Kategori ${c.name} memakan ${c.percentage}% dari total pengeluaran bulanan Anda. Coba evaluasi belanja bulanan Anda pada sektor ini.`,
                });
            }
        });

        // 3. General Budget Alerts from Store
        const budgetAlerts = getBudgetAlerts().filter((a) => a.level === 'over');
        if (budgetAlerts.length > 0) {
            insights.push({
                type: 'danger',
                title: 'Melebihi Batas Anggaran Kategori',
                desc: `Anda telah melampaui batas anggaran pada ${budgetAlerts.length} kategori (${budgetAlerts.map(a => a.name).join(', ')}).`,
            });
        }

        // Default if everything is fine and no specific alert
        if (insights.length === 0) {
            insights.push({
                type: 'success',
                title: 'Keuangan Bulan Ini Terpantau Stabil',
                desc: 'Arus kas Anda seimbang dan semua batas anggaran kategori masih terjaga dengan aman. Kerja bagus!',
            });
        }

        return insights;
    }, [stats, categoryData, getBudgetAlerts]);

    // ─── Export CSV (Excel) ───
    const exportCSV = () => {
        const headers = ['Tanggal', 'Tipe', 'Kategori', 'Nama Transaksi', 'Dompet', 'Nominal', 'Catatan'];
        const rows = monthTransactions.map(t => {
            const catName = categories.find(c => c.id === t.categoryId)?.name || '-';
            const wName = wallets.find(w => w.id === t.walletId)?.name || '-';
            return [
                t.date,
                t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer',
                catName,
                t.title,
                wName,
                t.amount,
                t.note || ''
            ];
        });
        
        // Build CSV String with BOM for Indonesian Excel compatibility
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Laporan_SakuPintar_${selectedMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ─── Export PDF (Print Engine) ───
    const exportPDF = () => {
        const printWindow = window.open('', '_blank');
        
        const categoryRows = categoryData.map(c => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">${c.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${fmtIDR(c.amount)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${c.percentage}%</td>
            </tr>
        `).join('');

        const transactionRows = monthTransactions.map(t => {
            const catName = categories.find(c => c.id === t.categoryId)?.name || '-';
            return `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">${t.date} ${t.time || ''}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">${t.title}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">${catName}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: ${t.type === 'income' ? '#0E6C4A' : '#E11D48'}; font-weight: bold;">
                        ${t.type === 'income' ? '+' : '-'}${fmtIDR(t.amount)}
                    </td>
                </tr>
            `;
        }).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Laporan Keuangan SakuPintar - ${formatMonthYear(selectedMonth + '-01')}</title>
                    <style>
                        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
                        h1 { color: #0E6C4A; margin-bottom: 5px; font-weight: 800; font-size: 28px; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0E6C4A; padding-bottom: 20px; margin-bottom: 30px; }
                        .grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
                        .card { padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; }
                        .card-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
                        .card-value { font-size: 18px; font-weight: bold; margin-top: 5px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
                        th { background-color: #f1f5f9; padding: 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; color: #475569; }
                        .section-title { font-size: 15px; font-weight: bold; color: #0E6C4A; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1>SakuPintar</h1>
                            <p style="margin: 0; font-size: 13px; color: #64748b;">Laporan Analisis Keuangan Bulanan</p>
                        </div>
                        <div style="text-align: right; font-size: 13px;">
                            <p style="margin: 0; font-weight: bold;">Bulan: ${formatMonthYear(selectedMonth + '-01')}</p>
                            <p style="margin: 0; font-size: 11px; color: #64748b; mt-1;">Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="card">
                            <div class="card-title">Total Pemasukan</div>
                            <div class="card-value" style="color: #0E6C4A;">${fmtIDR(stats.income)}</div>
                        </div>
                        <div class="card">
                            <div class="card-title">Total Pengeluaran</div>
                            <div class="card-value" style="color: #e11d48;">${fmtIDR(stats.expense)}</div>
                        </div>
                        <div class="card">
                            <div class="card-title">Arus Kas Bersih</div>
                            <div class="card-value" style="color: ${stats.net >= 0 ? '#0E6C4A' : '#e11d48'};">${stats.net >= 0 ? '+' : ''}${fmtIDR(stats.net)}</div>
                        </div>
                        <div class="card">
                            <div class="card-title">Rasio Tabungan</div>
                            <div class="card-value">${stats.savingsRate}%</div>
                        </div>
                    </div>

                    <div class="section-title">Ringkasan Pengeluaran Kategori</div>
                    <table>
                      <thead>
                          <tr>
                              <th>Kategori</th>
                              <th style="text-align: right;">Nominal</th>
                              <th style="text-align: right;">Persentase</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${categoryRows || '<tr><td colspan="3" style="text-align: center; padding: 15px; color: #64748b;">Tidak ada pengeluaran belanja.</td></tr>'}
                      </tbody>
                    </table>

                    <div class="section-title">Log Transaksi Bulanan</div>
                    <table>
                      <thead>
                          <tr>
                              <th>Tanggal</th>
                              <th>Nama Transaksi</th>
                              <th>Tipe</th>
                              <th>Kategori</th>
                              <th style="text-align: right;">Nominal</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${transactionRows || '<tr><td colspan="5" style="text-align: center; padding: 15px; color: #64748b;">Tidak ada riwayat transaksi.</td></tr>'}
                      </tbody>
                    </table>
                    
                    <div style="text-align: center; font-size: 10px; color: #94a3b8; margin-top: 50px;">
                        Dibuat secara otomatis oleh SakuPintar - Aplikasi Manajemen Keuangan Cerdas.
                    </div>
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    return (
        <AuthenticatedLayout>
            <div className="flex flex-col gap-8 pb-12">
                
                {/* ── Header ── */}
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-zinc-900 text-3xl font-bold leading-10">Analisis Laporan</h1>
                        <p className="text-neutral-700 text-sm mt-1">Evaluasi arus kas, alokasi pengeluaran, dan rasio tabungan Anda.</p>
                    </div>

                    {/* Filters & Actions */}
                    <div className="flex items-center flex-wrap gap-3">
                        {/* Month Filter */}
                        <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm">
                            <Calendar className="w-4 h-4 text-emerald-800" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer border-none p-0 pr-6 focus:ring-0"
                            >
                                {availableMonths.map((m) => (
                                    <option key={m} value={m}>
                                        {formatMonthYear(m + '-01')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Export PDF Button */}
                        <button
                            onClick={exportPDF}
                            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF
                        </button>

                        {/* Export Excel (CSV) Button */}
                        <button
                            onClick={exportCSV}
                            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-stone-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel (CSV)
                        </button>
                    </div>
                </div>

                {/* ── Cash Flow Bento Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Income */}
                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                        <div className="w-11 h-11 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center shrink-0">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-slate-500 text-xs font-semibold">Total Pemasukan</span>
                            <span className="block text-slate-800 font-bold text-lg mt-0.5 truncate">{fmtIDR(stats.income)}</span>
                        </div>
                    </div>

                    {/* Expenses */}
                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                        <div className="w-11 h-11 bg-rose-50 text-rose-800 rounded-xl flex items-center justify-center shrink-0">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-slate-500 text-xs font-semibold">Total Pengeluaran</span>
                            <span className="block text-slate-800 font-bold text-lg mt-0.5 truncate">{fmtIDR(stats.expense)}</span>
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${stats.net >= 0 ? 'bg-indigo-50 text-indigo-800' : 'bg-amber-50 text-amber-800'}`}>
                            <Info className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-slate-500 text-xs font-semibold">Sisa Arus Kas</span>
                            <span className={`block font-bold text-lg mt-0.5 truncate ${stats.net >= 0 ? 'text-indigo-800' : 'text-amber-800'}`}>
                                {stats.net >= 0 ? '+' : ''}{fmtIDR(stats.net)}
                            </span>
                        </div>
                    </div>

                    {/* Saving Rate */}
                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                        <div className="w-11 h-11 bg-teal-50 text-teal-800 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-slate-500 text-xs font-semibold">Tingkat Menabung</span>
                            <span className="block text-slate-800 font-bold text-lg mt-0.5">{stats.savingsRate}%</span>
                        </div>
                    </div>
                </div>

                {/* ── Donut Chart and Category Breakdown ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* SVG Donut Chart (Left: 5/12) */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col items-center justify-center min-h-[350px]">
                        <h3 className="text-slate-800 font-bold text-base mb-6 self-start">Alokasi Pengeluaran</h3>
                        
                        {stats.expense === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                Tidak ada pengeluaran tercatat di periode ini.
                            </div>
                        ) : (
                            <div className="relative w-60 h-60 flex items-center justify-center">
                                {/* SVG Arc */}
                                <svg width="220" height="220" viewBox="0 0 120 120" className="transform -rotate-90">
                                    {donutSegments.map((seg) => {
                                        const isHovered = hoveredCatId === seg.id;
                                        return (
                                            <circle
                                                key={seg.id}
                                                cx="60"
                                                cy="60"
                                                r="50"
                                                fill="transparent"
                                                stroke={seg.color}
                                                strokeWidth={isHovered ? '13' : '10'}
                                                strokeDasharray="314.16"
                                                strokeDashoffset={seg.strokeOffset}
                                                onMouseEnter={() => setHoveredCatId(seg.id)}
                                                onMouseLeave={() => setHoveredCatId(null)}
                                                className="transition-all duration-300 cursor-pointer"
                                                style={{ transformOrigin: 'center' }}
                                            />
                                        );
                                    })}
                                </svg>

                                {/* Middle Display Details */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
                                    {displayedCategory ? (
                                        <>
                                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 max-w-[130px] truncate">
                                                {displayedCategory.name}
                                            </span>
                                            <span className="text-slate-800 font-extrabold text-lg mt-0.5">
                                                {fmtIDR(displayedCategory.amount)}
                                            </span>
                                            <span className="text-emerald-700 font-bold text-xs mt-0.5">
                                                {displayedCategory.percentage}% dari total
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-slate-400 text-xs font-semibold">Total</span>
                                            <span className="text-slate-800 font-bold text-xl mt-0.5">
                                                {fmtIDR(stats.expense)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Category List (Right: 7/12) */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
                        <div className="space-y-4">
                            <h3 className="text-slate-800 font-bold text-base mb-2">Detail Pengeluaran per Kategori</h3>
                            
                            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                                {categoryData.length === 0 ? (
                                    <p className="text-slate-400 text-sm text-center py-10">Belum ada pengeluaran.</p>
                                ) : (
                                    categoryData.map((c) => (
                                        <div
                                            key={c.id}
                                            onMouseEnter={() => setHoveredCatId(c.id)}
                                            onMouseLeave={() => setHoveredCatId(null)}
                                            className={`p-3 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                                                hoveredCatId === c.id
                                                    ? 'border-emerald-300 bg-emerald-50/20'
                                                    : 'border-stone-100 hover:border-stone-200'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2 font-bold text-slate-700">
                                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                                                    {c.name}
                                                </div>
                                                <div className="font-bold text-slate-800">
                                                    {fmtIDR(c.amount)}
                                                    <span className="text-[10px] text-slate-400 font-normal ml-1.5">
                                                        ({c.percentage}%)
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Mini progress bar */}
                                            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ backgroundColor: c.color, width: `${c.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Daily Spending Trend (Bar Chart) ── */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-4">
                    <div>
                        <h3 className="text-slate-800 font-bold text-base">Tren Pengeluaran Harian</h3>
                        <p className="text-slate-500 text-xs mt-0.5">Analisis intensitas pengeluaran harian Anda di bulan ini.</p>
                    </div>

                    {stats.expense === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-sm">
                            Tidak ada pengeluaran untuk divisualisasikan.
                        </div>
                    ) : (
                        <div className="w-full pt-4">
                            {/* Bars Container */}
                            <div className="h-48 flex items-end justify-between gap-1 overflow-x-auto pb-2 pr-1 scrollbar-thin">
                                {dailyTrend.map((bar) => (
                                    <div key={bar.day} className="flex-1 min-w-[12px] flex flex-col items-center gap-2 group h-full justify-end">
                                        {/* Value Tooltip */}
                                        <div className="absolute mb-24 hidden group-hover:block bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg z-10 pointer-events-none">
                                            {fmtIDR(bar.amount)}
                                        </div>
                                        
                                        {/* Bar */}
                                        <div 
                                            className={`w-full rounded-t-sm transition-all duration-500 ${
                                                bar.amount > 0 
                                                    ? 'bg-emerald-700 hover:bg-emerald-500' 
                                                    : 'bg-stone-100'
                                            }`}
                                            style={{ height: `${bar.amount > 0 ? bar.heightPercent * 0.8 + 5 : 4}%` }} // Min 5% height if amount > 0, scale to 80% max
                                        />
                                        
                                        {/* Day label */}
                                        <span className="text-[9px] font-bold text-slate-400 select-none group-hover:text-slate-700">
                                            {bar.day}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── AI Insight Card ── */}
                <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden border border-emerald-900/30">
                    <div className="absolute right-0 top-0 w-64 h-full bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-emerald-900/40 p-2 rounded-xl border border-emerald-500/20 text-emerald-400">
                                <BrainCircuit className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-4">Analisis AI & Rekomendasi Cerdas</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">Rekomendasi keuangan dinamis SakuPintar</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                            {aiInsights.map((insight, idx) => (
                                <div 
                                    key={idx} 
                                    className={`p-4 rounded-2xl border text-xs flex flex-col gap-1 backdrop-blur-md ${
                                        insight.type === 'danger'
                                            ? 'border-red-900/40 bg-red-950/20 text-red-100'
                                            : insight.type === 'warning'
                                            ? 'border-amber-900/40 bg-amber-950/20 text-amber-100'
                                            : 'border-emerald-900/40 bg-emerald-950/20 text-emerald-100'
                                    }`}
                                >
                                    <span className="font-bold text-sm block">
                                        {insight.title}
                                    </span>
                                    <p className="text-slate-300 leading- relaxed mt-0.5">{insight.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
