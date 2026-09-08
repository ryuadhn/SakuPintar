import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useFinance } from '../../contexts/FinanceContext';
import { fmtIDR, currentMonthKey, formatMonthYear } from '../../utils/format';
import { Activity, AlertTriangle, BarChart3, BrainCircuit, Calendar, CheckCircle, Download, Info, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';

export default function Reports() {
    const { transactions, categories, budgets, wallets } = useFinance();

    // ─── State ───
    const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
    const [hoveredCatId, setHoveredCatId] = useState(null);
    const [selectedCatId, setSelectedCatId] = useState(null);

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
        let transactionCount = 0;
        monthTransactions.forEach((t) => {
            const amount = Number(t.amount) || 0;
            if (t.type === 'income') {
                income += amount;
                if (amount > 0) transactionCount += 1;
            } else if (t.type === 'expense') {
                expense += amount;
                if (amount > 0) transactionCount += 1;
            }
        });
        const net = income - expense;
        const savingsRate = income > 0 ? Math.round((net / income) * 100) : null;
        return { income, expense, net, savingsRate, transactionCount };
    }, [monthTransactions]);

    const hasFinancialData = stats.transactionCount > 0;
    const hasCompleteCashFlowData = stats.income > 0 && stats.expense > 0;
    const savingsRateLabel = stats.savingsRate === null
        ? (hasFinancialData ? '—' : '0%')
        : `${stats.savingsRate}%`;

    // ─── Group Expense by Category ───
    const categoryData = useMemo(() => {
        if (stats.expense === 0) return [];
        const map = {};
        monthTransactions.forEach((t) => {
            if (t.type !== 'expense') return;
            const catId = t.categoryId || 'other';
            map[catId] = (map[catId] || 0) + (Number(t.amount) || 0);
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
        const activeCatId = hoveredCatId || selectedCatId;
        if (activeCatId) {
            return categoryData.find((c) => c.id === activeCatId) || categoryData[0] || null;
        }
        return categoryData[0] || null;
    }, [hoveredCatId, selectedCatId, categoryData]);

    const selectedBudgetAlerts = useMemo(() => categoryData.flatMap((category) => {
        const limit = Number(budgets?.[category.id]) || 0;
        if (limit <= 0) return [];

        const percentage = Math.round((category.amount / limit) * 100);
        return percentage >= 100
            ? [{ name: category.name, limit, spent: category.amount, percentage }]
            : [];
    }), [categoryData, budgets]);

    // ─── Daily Spending Trend ───
    const dailyTrend = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyAmounts = Array(daysInMonth).fill(0);

        monthTransactions.forEach((t) => {
            if (t.type !== 'expense') return;
            const day = Number(t.date.slice(8, 10));
            if (day >= 1 && day <= daysInMonth) {
                dailyAmounts[day - 1] += Number(t.amount) || 0;
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
        const { net, savingsRate } = stats;

        if (!hasFinancialData) {
            return [{
                type: 'neutral',
                title: 'Belum cukup data untuk analisis',
                desc: 'Tambahkan beberapa transaksi agar Sakuta dapat memberikan insight berdasarkan aktivitas keuangan Anda.',
            }];
        }

        if (!hasCompleteCashFlowData) {
            insights.push({
                type: 'neutral',
                title: 'Data arus kas belum lengkap',
                desc: 'Insight arus kas yang lebih utuh membutuhkan transaksi pemasukan dan pengeluaran pada periode ini.',
            });
        } else if (net < 0) {
            insights.push({
                type: 'danger',
                title: 'Arus kas bulan ini defisit',
                desc: `Berdasarkan transaksi bulan ini, pengeluaran melebihi pemasukan sebesar ${fmtIDR(Math.abs(net))}.`,
            });
        } else if (net > 0 && savingsRate >= 25) {
            insights.push({
                type: 'success',
                title: 'Savings rate bulan ini cukup tinggi',
                desc: `Berdasarkan transaksi bulan ini, arus kas surplus dan sekitar ${savingsRate}% pemasukan tersisa setelah pengeluaran.`,
            });
        } else if (net > 0 && savingsRate < 10) {
            insights.push({
                type: 'warning',
                title: 'Savings rate bulan ini masih rendah',
                desc: `Sekitar ${savingsRate}% pemasukan tersisa setelah pengeluaran tercatat pada periode ini.`,
            });
        } else if (net === 0) {
            insights.push({
                type: 'neutral',
                title: 'Arus kas bulan ini seimbang',
                desc: 'Pemasukan dan pengeluaran yang tercatat memiliki nilai yang sama, sehingga belum ada surplus atau defisit.',
            });
        }

        // Category concentration is only shown when an expense category has real data.
        categoryData.forEach((c) => {
            if (c.percentage >= 35 && ['lifestyle', 'shopping', 'food'].includes(c.id)) {
                insights.push({
                    type: 'warning',
                    title: `${c.name} menjadi kategori terbesar`,
                    desc: `Pengeluaran pada kategori ini mencakup ${c.percentage}% dari total pengeluaran periode ini.`,
                });
            }
        });

        if (selectedBudgetAlerts.length > 0) {
            insights.push({
                type: 'danger',
                title: 'Ada kategori yang melewati anggaran',
                desc: `${selectedBudgetAlerts.length} kategori melewati batas: ${selectedBudgetAlerts.map(a => a.name).join(', ')}.`,
            });
        }

        if (insights.length === 0) {
            insights.push({
                type: 'neutral',
                title: 'Belum ada pola khusus yang perlu ditindaklanjuti',
                desc: 'Tidak ada kategori dominan atau batas anggaran yang terlampaui dari transaksi tercatat pada periode ini.',
            });
        }

        return insights;
    }, [stats, categoryData, selectedBudgetAlerts, hasFinancialData, hasCompleteCashFlowData]);

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
        link.setAttribute("download", `Laporan_Sakuta_${selectedMonth}.csv`);
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
                    <title>Laporan Keuangan Sakuta - ${formatMonthYear(selectedMonth + '-01')}</title>
                    <style>
                         body { font-family: 'Outfit', 'Inter', sans-serif; color: #18211c; padding: 32px; line-height: 1.5; }
                         h1 { color: #0E6C4A; margin-bottom: 5px; font-weight: 600; font-size: 24px; }
                         .header { display: flex; justify-content: space-between; border-bottom: 1px solid #c6d3ca; padding-bottom: 16px; margin-bottom: 24px; }
                         .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
                         .card { padding: 16px; border: 1px solid #dce6df; border-radius: 10px; background: #f3f7f4; }
                         .card-title { font-size: 10px; color: #526158; font-weight: 500; }
                         .card-value { font-size: 18px; font-weight: 600; margin-top: 5px; }
                         table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
                         th { background-color: #f3f7f4; padding: 10px; text-align: left; font-size: 11px; font-weight: 600; border-bottom: 1px solid #c6d3ca; color: #526158; }
                         .section-title { font-size: 15px; font-weight: 600; color: #0E6C4A; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #dce6df; padding-bottom: 5px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1>Sakuta</h1>
                            <p style="margin: 0; font-size: 13px; color: #64748b;">Laporan Analisis Keuangan Bulanan</p>
                        </div>
                        <div style="text-align: right; font-size: 13px;">
                            <p style="margin: 0; font-weight: 600;">Bulan: ${formatMonthYear(selectedMonth + '-01')}</p>
                            <p style="margin: 4px 0 0; font-size: 11px; color: #526158;">Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
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
                            <div class="card-value" style="color: ${stats.net > 0 ? '#0E6C4A' : stats.net < 0 ? '#e11d48' : '#526158'};">${stats.net > 0 ? '+' : ''}${fmtIDR(stats.net)}</div>
                        </div>
                        <div class="card">
                            <div class="card-title">Rasio Tabungan</div>
                            <div class="card-value">${savingsRateLabel}</div>
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
                        Dibuat secara otomatis oleh Sakuta - Rencanakan hari ini, capai bersama.
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
            <div className="app-page">
                
                {/* ── Header ── */}
                <div className="app-page-header">
                    <div className="min-w-0">
                        <h1 className="app-page-title">Analisis Laporan</h1>
                        <p className="app-page-description">Evaluasi arus kas, alokasi pengeluaran, dan rasio tabungan Anda.</p>
                    </div>

                    {/* Filters & Actions */}
                    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:flex-wrap">
                        {/* Month Filter */}
                        <div className="ui-filter-shell col-span-2 min-w-0 sm:col-span-1">
                            <Calendar aria-hidden="true" className="w-4 h-4 text-emerald-800" />
                            <select
                                aria-label="Pilih bulan laporan"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="ui-control min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 cursor-pointer border-none p-0 pr-6 focus:ring-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 focus-visible:outline-offset-2 sm:flex-none"
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
                            type="button"
                            onClick={exportPDF}
                            className="reports-mobile-touch ui-button flex w-full items-center justify-center gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800 sm:w-auto sm:justify-start"
                        >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            PDF
                        </button>

                        {/* Export Excel (CSV) Button */}
                        <button
                            type="button"
                            onClick={exportCSV}
                            className="reports-mobile-touch ui-button flex w-full items-center justify-center gap-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 sm:w-auto sm:justify-start"
                        >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            Excel (CSV)
                        </button>
                    </div>
                </div>

                {/* ── Cash Flow Bento Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Income */}
                    <div className="reports-stat-card reports-stat-income ui-stat-card flex items-center gap-3">
                        <div className="ui-tone-icon ui-tone-positive w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                            <TrendingUp aria-hidden="true" className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-slate-500 text-xs font-medium">Total Pemasukan</span>
                            <span className="block text-slate-800 font-semibold text-base mt-0.5 truncate">{fmtIDR(stats.income)}</span>
                        </div>
                    </div>

                    {/* Expenses */}
                    <div className="reports-stat-card reports-stat-expense ui-stat-card flex items-center gap-3">
                        <div className="ui-tone-icon ui-tone-danger w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                            <TrendingDown aria-hidden="true" className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-slate-500 text-xs font-medium">Total Pengeluaran</span>
                            <span className="block text-slate-800 font-semibold text-base mt-0.5 truncate">{fmtIDR(stats.expense)}</span>
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div className="reports-stat-card reports-stat-net ui-stat-card flex items-center gap-3">
                        <div className={`ui-tone-icon w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stats.net > 0 ? 'ui-tone-positive' : stats.net < 0 ? 'ui-tone-danger' : 'ui-tone-neutral'}`}>
                            <Activity aria-hidden="true" className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-slate-500 text-xs font-medium">Sisa Arus Kas</span>
                            <span className={`block font-semibold text-base mt-0.5 truncate ${stats.net > 0 ? 'ui-tone-positive-text' : stats.net < 0 ? 'ui-tone-danger-text' : 'text-slate-700'}`}>
                                {stats.net > 0 ? '+' : ''}{fmtIDR(stats.net)}
                            </span>
                        </div>
                    </div>

                    {/* Saving Rate */}
                    <div className="reports-stat-card reports-stat-savings ui-stat-card flex items-center gap-3">
                        <div className="ui-tone-icon ui-tone-info w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                            <PiggyBank aria-hidden="true" className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-slate-500 text-xs font-medium">Tingkat Menabung</span>
                            <span className="block text-slate-800 font-semibold text-base mt-0.5">{savingsRateLabel}</span>
                        </div>
                    </div>
                </div>

                {/* ── Donut Chart and Category Breakdown ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    
                    {/* SVG Donut Chart (Left: 5/12) */}
                    <div className="ui-card flex min-h-[300px] flex-col items-center justify-center lg:col-span-5">
                        <h3 className="ui-section-title mb-4 w-full self-start">Alokasi Pengeluaran</h3>
                        
                        {stats.expense === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-400">
                                <BarChart3 className="h-8 w-8 text-slate-300" aria-hidden="true" />
                                Belum ada pengeluaran tercatat pada periode ini.
                            </div>
                        ) : (
                            <div className="relative w-52 h-52 flex items-center justify-center">
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
                                            <span className="text-[10px] font-medium text-slate-400 max-w-[130px] truncate">
                                                {displayedCategory.name}
                                            </span>
                                    <span className="text-slate-800 font-semibold text-base mt-0.5">
                                                {fmtIDR(displayedCategory.amount)}
                                            </span>
                                    <span className="text-emerald-700 font-medium text-xs mt-0.5">
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
                    <div className="ui-card lg:col-span-7 flex flex-col justify-between">
                        <div className="space-y-4">
                            <h3 className="ui-section-title mb-2">Detail Pengeluaran per Kategori</h3>
                            
                            <div className="reports-category-list max-h-[300px] space-y-3.5 overflow-y-auto pr-1">
                                {categoryData.length === 0 ? (
                                    <div className="ui-empty flex flex-col items-center gap-2 py-6 text-center">
                                        <BarChart3 className="h-7 w-7 text-slate-300" aria-hidden="true" />
                                        <p>Belum ada pengeluaran tercatat pada periode ini.</p>
                                    </div>
                                ) : (
                                    categoryData.map((c) => {
                                        const isSelected = selectedCatId === c.id;
                                        const isHovered = hoveredCatId === c.id;
                                        return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setSelectedCatId(c.id)}
                                            onMouseEnter={() => setHoveredCatId(c.id)}
                                            onMouseLeave={() => setHoveredCatId(null)}
                                            onFocus={() => setSelectedCatId(c.id)}
                                            aria-pressed={selectedCatId === c.id}
                                            className={`w-full min-h-[44px] rounded-xl border p-3 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 focus-visible:outline-offset-2 ${
                                                isSelected
                                                    ? 'border-emerald-300 bg-emerald-50/30'
                                                    : isHovered
                                                        ? 'border-emerald-200 bg-emerald-50/10'
                                                        : 'border-stone-100 hover:border-stone-200'
                                            }`}
                                        >
                                            <span className="flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-2 font-medium text-slate-700">
                                                    <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                                                    <span>{c.name}</span>
                                                </span>
                                                <span className="font-medium text-slate-800">
                                                    {fmtIDR(c.amount)}
                                                    <span className="text-[10px] text-slate-400 font-normal ml-1.5">
                                                        ({c.percentage}%)
                                                    </span>
                                                </span>
                                            </span>
                                            
                                            {/* Mini progress bar */}
                                            <span className="mt-1.5 block h-2 w-full overflow-hidden rounded-full bg-stone-100">
                                                <span
                                                    className="block h-full rounded-full transition-all duration-500"
                                                    style={{ backgroundColor: c.color, width: `${c.percentage}%` }}
                                                />
                                            </span>
                                        </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Daily Spending Trend (Bar Chart) ── */}
                <div className="ui-card flex flex-col gap-3">
                    <div>
                        <h3 className="ui-section-title">Tren Pengeluaran Harian</h3>
                        <p className="ui-section-description">Analisis intensitas pengeluaran harian Anda di bulan ini.</p>
                    </div>

                    {stats.expense === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-400">
                            <Activity className="h-8 w-8 text-slate-300" aria-hidden="true" />
                            Belum ada pengeluaran untuk divisualisasikan pada periode ini.
                        </div>
                    ) : (
                        <div className="w-full pt-4">
                            {/* Bars Container */}
                            <div className="flex h-48 touch-pan-x items-end justify-between gap-1 overflow-x-auto pb-2 pr-1 scrollbar-thin">
                                {dailyTrend.map((bar) => (
                                    <div key={bar.day} className="group flex h-full min-w-[1.25rem] flex-1 flex-col items-center justify-end gap-2 sm:min-w-[12px]">
                                        {/* Value Tooltip */}
                                        <div className="ui-tooltip absolute mb-24 hidden group-hover:block bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10 pointer-events-none">
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
                <div className="ui-card p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                        <div className="ui-tone-icon ui-tone-ai w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                            <BrainCircuit aria-hidden="true" className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="ui-section-title">Insight Laporan</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Ringkasan berdasarkan transaksi pada periode terpilih.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {aiInsights.map((insight, idx) => (
                            (() => {
                                const InsightIcon = insight.type === 'danger'
                                    ? AlertTriangle
                                    : insight.type === 'success'
                                        ? CheckCircle
                                        : insight.type === 'warning'
                                            ? AlertTriangle
                                            : Info;
                                return (
                            <div
                                key={idx}
                                className={`rounded-xl border p-3 text-xs flex flex-col gap-1 ${
                                     insight.type === 'danger'
                                         ? 'ui-tone-danger'
                                         : insight.type === 'warning'
                                         ? 'ui-tone-warning'
                                         : insight.type === 'success'
                                         ? 'ui-tone-positive'
                                         : 'ui-tone-neutral'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    <InsightIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                                    <div className="min-w-0">
                                        <span className="text-sm font-semibold">{insight.title}</span>
                                        <p className="mt-1 leading-relaxed text-slate-600">{insight.desc}</p>
                                    </div>
                                </div>
                            </div>
                                );
                            })()
                        ))}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
