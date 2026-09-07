import React, { useState, useMemo, useRef, useEffect } from 'react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import { useFinance } from '../Store/FinanceContext';
import { fmtIDR, currentMonthKey } from '../Utils/format';
import { Send, Bot, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AIAdvisor() {
    const { transactions, categories, budgets, savingsGoals, getBudgetAlerts, monthStats } = useFinance();
    const chatEndRef = useRef(null);

    // ─── Financial calculations ───
    const currentMonth = currentMonthKey();
    const stats = monthStats(currentMonth);
    const budgetAlerts = getBudgetAlerts();
    const overbudgetAlerts = budgetAlerts.filter(a => a.level === 'over');

    const currentMonthTransactionCount = useMemo(
        () => transactions.filter((transaction) => (
            transaction.date?.slice(0, 7) === currentMonth
            && (transaction.type === 'income' || transaction.type === 'expense')
            && Number(transaction.amount) > 0
        )).length,
        [transactions, currentMonth]
    );
    const hasBudgetData = Object.values(budgets || {}).some((amount) => Number(amount) > 0);
    const hasCashflowData = stats.income > 0 && stats.expense > 0;
    const hasSufficientData = currentMonthTransactionCount > 0 && hasCashflowData && hasBudgetData;
    const savingRate = stats.income > 0 ? Math.round((stats.net / stats.income) * 100) : null;

    // ─── AI Health Score Calculations ───
    const healthScoreData = useMemo(() => {
        if (!hasSufficientData) {
            return {
                isSufficient: false,
                score: null,
                level: 'Belum cukup data',
                colorClass: 'text-slate-700 bg-slate-50 border-slate-200',
                barColor: 'bg-slate-300',
                deductions: [],
                additions: [],
            };
        }

        let score = 100;
        const deductions = [];
        const additions = [];

        // 1. Cashflow check
        if (stats.net < 0) {
            const pct = Math.min(40, Math.round((Math.abs(stats.net) / (stats.income || 1)) * 50));
            score -= pct;
            deductions.push(`Arus kas negatif (defisit ${fmtIDR(Math.abs(stats.net))})`);
        } else if (stats.net > 0) {
            additions.push(`Arus kas surplus (+${fmtIDR(stats.net)})`);
        }

        // 2. Saving rate check
        if (savingRate >= 20) {
            score += 5; // Bonus for high saving rate
            additions.push(`Tingkat menabung sangat sehat (${savingRate}%)`);
        } else if (savingRate > 0 && savingRate < 10) {
            score -= 15;
            deductions.push(`Rasio tabungan di bawah ideal (${savingRate}%)`);
        } else if (stats.income > 0 && savingRate <= 0) {
            score -= 25;
            deductions.push('Belum menyisihkan dana tabungan bulan ini');
        }

        // 3. Overbudget check
        const overCount = overbudgetAlerts.length;
        if (overCount > 0) {
            const penalty = Math.min(30, overCount * 10);
            score -= penalty;
            deductions.push(`${overCount} kategori melebihi anggaran`);
        } else {
            additions.push('Batas anggaran semua kategori terjaga');
        }

        // 4. Savings Goals
        const activeGoals = savingsGoals.length;
        if (activeGoals > 0) {
            additions.push(`Memiliki ${activeGoals} target tabungan aktif`);
        }

        const finalScore = Math.max(10, Math.min(100, score));

        // Health Level Text
        let level = 'Cukup';
        let colorClass = 'text-amber-600 bg-amber-50 border-amber-200';
        let barColor = 'bg-amber-500';
        
        if (finalScore >= 80) {
            level = 'Sangat Sehat';
            colorClass = 'text-emerald-800 bg-emerald-50 border-emerald-200';
            barColor = 'bg-emerald-700';
        } else if (finalScore < 50) {
            level = 'Kritis';
            colorClass = 'text-rose-700 bg-rose-50 border-rose-200';
            barColor = 'bg-rose-600';
        }

        return {
            isSufficient: true,
            score: finalScore,
            level,
            colorClass,
            barColor,
            deductions,
            additions
        };
    }, [stats, savingRate, overbudgetAlerts, savingsGoals, hasSufficientData]);

    // ─── Chatbot State ───
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // ─── AI Smart Tips Data ───
    const smartTips = useMemo(() => [
        {
            title: "Aturan Alokasi 50/30/20",
            desc: "Alokasikan 50% untuk kebutuhan pokok, 30% untuk keinginan, dan minimal 20% langsung dimasukkan ke tabungan atau investasi di awal bulan."
        },
        {
            title: "Pentingnya Memiliki Dana Darurat",
            desc: "Usahakan memiliki dana cadangan sebesar 3 hingga 6 kali pengeluaran bulanan Anda untuk menghadapi situasi tidak terduga tanpa perlu berutang."
        },
        {
            title: "Metode Potong Saldo di Awal",
            desc: "Jangan menabung dari sisa uang belanja. Sebaliknya, potong 10% - 20% pemasukan Anda langsung saat gajian tiba untuk ditabung secara disiplin."
        },
        {
            title: "Batasi Belanja Impulsif (Aturan 24 Jam)",
            desc: "Gunakan aturan 24 jam sebelum membeli barang non-pokok. Tunggu satu hari untuk memikirkan kembali apakah barang tersebut benar-benar dibutuhkan."
        },
        {
            title: "Investasi Leher ke Atas Terlebih Dahulu",
            desc: "Sebelum menginvestasikan dana ke instrumen berisiko tinggi, investasikan waktu untuk mempelajari cara kerja instrumen tersebut terlebih dahulu."
        }
    ], []);

    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    // ─── Simple Markdown Bold/Italic Parser Helper ───
    const formatMessageText = (text) => {
        if (!text) return '';
        const parts = text.split('**');
        return parts.map((part, idx) => {
            if (idx % 2 === 1) {
                return <strong key={idx} className="font-semibold text-slate-900">{part}</strong>;
            }
            const subParts = part.split('*');
            if (subParts.length > 1) {
                return subParts.map((sub, sIdx) => {
                    if (sIdx % 2 === 1) {
                        return <em key={sIdx} className="italic text-slate-700">{sub}</em>;
                    }
                    return sub;
                });
            }
            return part;
        });
    };

    // ─── Extract All Expense Categories Breakdown ───
    const expensesBreakdown = useMemo(() => {
        const map = {};
        let totalExpense = 0;
        transactions
            .filter(t => t.date && t.date.slice(0, 7) === currentMonth && t.type === 'expense')
            .forEach(t => {
                const catId = t.categoryId || 'other';
                map[catId] = (map[catId] || 0) + t.amount;
                totalExpense += t.amount;
            });
        
        const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
        return sorted.map(([catId, amount]) => {
            const catObj = categories.find(c => c.id === catId) || { name: 'Lainnya' };
            const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
            return { name: catObj.name, amount, percentage };
        });
    }, [transactions, categories, currentMonth]);

    const topCategory = useMemo(() => {
        if (expensesBreakdown.length === 0) return null;
        return { name: expensesBreakdown[0].name, amount: expensesBreakdown[0].amount };
    }, [expensesBreakdown]);

    const savingRateLabel = savingRate === null ? 'belum dapat dihitung' : `${savingRate}%`;

    // ─── AI Response Logic ───
    const generateBotResponse = (text) => {
        const normalized = text.toLowerCase();
        
        // 1. Cashflow query
        if (normalized.includes('kondisi') || normalized.includes('cashflow') || normalized.includes('arus kas') || normalized.includes('keuangan')) {
            const statusText = stats.net > 0 ? 'surplus' : stats.net < 0 ? 'defisit' : 'netral';
            const healthSummary = healthScoreData.isSufficient
                ? `Skor kesehatan finansial saat ini **${healthScoreData.score}/100** (${healthScoreData.level}).`
                : 'Skor kesehatan finansial belum tersedia karena data transaksi dan anggaran belum cukup.';
            const nextStep = stats.net < 0 && hasCashflowData
                ? 'Tinjau pengeluaran yang paling besar sebelum menambah komitmen baru.'
                : !hasSufficientData
                ? 'Catat transaksi pemasukan, pengeluaran, dan anggaran agar analisis lebih lengkap.'
                : 'Gunakan ringkasan ini sebagai gambaran dari transaksi yang sudah tercatat.';
            return `Laporan Arus Kas Bulanan Anda:\n\n` +
                   `- **Total Pemasukan**: ${fmtIDR(stats.income)}\n` +
                   `- **Total Pengeluaran**: ${fmtIDR(stats.expense)}\n` +
                   `- **Sisa Saldo Bersih**: ${stats.net > 0 ? '+' : ''}${fmtIDR(stats.net)} (${statusText})\n` +
                   `- **Tingkat Menabung**: ${savingRateLabel}\n\n` +
                   `${healthSummary} ${nextStep}`;
        }

        // 2. Expense / top category query
        if (normalized.includes('boros') || normalized.includes('pengeluaran') || normalized.includes('kategori') || normalized.includes('habis')) {
            if (expensesBreakdown.length === 0) {
                return 'Anda belum mencatat pengeluaran apa pun bulan ini, sehingga belum ada kategori yang dapat dianalisis.';
            }

            const breakdownText = expensesBreakdown.map((item, idx) => {
                return `${idx + 1}. **${item.name}**: ${fmtIDR(item.amount)} (${item.percentage}%)`;
            }).join('\n');

            const topCat = expensesBreakdown[0];

            return `Analisis Pengeluaran per Kategori Bulan Ini:\n\n` +
                   `${breakdownText}\n\n` +
                   `Pengeluaran terbesar Anda adalah pada kategori **${topCat.name}** sebesar **${fmtIDR(topCat.amount)}** (${topCat.percentage}% dari total).\n\n` +
                   `Saran tindakan:\n` +
                   `- Evaluasi pengeluaran Anda pada kategori **${topCat.name}**.\n` +
                   `- Tetapkan batas anggaran di halaman Kategori untuk mengendalikan pengeluaran bulanan Anda.`;
        }

        // 3. Savings / target query
        if (normalized.includes('tabungan') || normalized.includes('target') || normalized.includes('aman') || normalized.includes('jepang') || normalized.includes('rumah')) {
            if (savingsGoals.length === 0) {
                return 'Anda belum menetapkan target tabungan. Anda bisa membuatnya di halaman "Target Tabungan" untuk mulai melacak tujuan finansial Anda secara otomatis.';
            }
            const activeGoalsText = savingsGoals.map(g => {
                const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
                return `- **${g.title}**: Progres ${pct}% (${fmtIDR(g.current)} dari target ${fmtIDR(g.target)})`;
            }).join('\n');

            return `Daftar Progres Target Tabungan Anda:\n\n${activeGoalsText}\n\n` +
                   `Ringkasan ini mengikuti saldo dan target yang tercatat. Tinjau tenggat dan setoran setiap target untuk menentukan langkah berikutnya.`;
        }

        // 4. Saving advice / tips
        if (normalized.includes('tips') || normalized.includes('hemat') || normalized.includes('saran') || normalized.includes('cara')) {
            const categoryAdvice = topCategory
                ? `Berdasarkan transaksi tercatat, pengeluaran terbesar berasal dari kategori **${topCategory.name}** sebesar **${fmtIDR(topCategory.amount)}**.`
                : 'Belum ada kategori pengeluaran yang dapat dianalisis dari transaksi tercatat.';
            return `Berikut beberapa langkah umum yang dapat dipertimbangkan:\n\n` +
                   `1. **Tinjau pengeluaran terbesar**: ${categoryAdvice}\n` +
                   `2. **Pisahkan kebutuhan dan keinginan** sebelum menetapkan batas pengeluaran bulan berikutnya.\n` +
                   `3. **Catat transaksi secara rutin** agar saran berikutnya lebih sesuai dengan pola keuangan Anda.`;
        }

        // 5. Default fallback
        return 'Saya tidak sepenuhnya memahami pertanyaan tersebut. Silakan pilih salah satu topik konsultasi di bawah ini atau tanyakan tentang kondisi kas, pengeluaran boros, anggaran, atau target tabungan Anda.';
    };

    const handleSend = (textToSend) => {
        const messageText = textToSend || input;
        if (!messageText.trim()) return;

        // Append User Message
        const userMsg = {
            id: Date.now().toString(),
            sender: 'user',
            text: messageText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Trigger Bot Response with Typing Effect
        setIsTyping(true);
        setTimeout(() => {
            const botReplyText = generateBotResponse(messageText);
            const botMsg = {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: botReplyText,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1200);
    };

    const quickPrompts = [
        { label: 'Analisis pengeluaran saya', text: 'Kategori pengeluaran apa yang paling besar?' },
        { label: 'Kondisi tabungan saya', text: 'Bagaimana kondisi tabungan saya?' },
        { label: 'Apa yang bisa saya hemat?', text: 'Apa yang bisa saya hemat?' },
        { label: 'Cek perkembangan target saya', text: 'Cek perkembangan target saya.' }
    ];

    return (
        <AuthenticatedLayout>
            <div className="app-page app-page-chat">
                
                {/* ── Header ── */}
                <div className="app-page-header">
                    <div>
                        <h1 className="app-page-title">Tanya AI</h1>
                        <p className="app-page-description">Konsultasikan kondisi anggaran, tabungan, dan kelayakan finansial Anda bersama asisten cerdas.</p>
                    </div>
                </div>

                {/* ── Main Layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 items-start">
                    
                    {/* ── Left Panel: Health Score Summary (4/12) ── */}
                    <div className="ui-card lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
                        <div>
                            <h3 className="ui-section-title">Skor Kesehatan Finansial</h3>
                            <p className="ui-section-description">Analisis kesehatan finansial berdasarkan pola transaksi riil.</p>
                        </div>

                        {/* Score or insufficient-data state */}
                        <div className="flex flex-col items-center justify-center py-5 border-b border-stone-100 text-center">
                            {healthScoreData.isSufficient ? (
                                <div className="relative w-28 h-28 flex items-center justify-center">
                                    <svg width="128" height="128" viewBox="0 0 36 36" className="transform -rotate-90" aria-hidden="true">
                                        <circle cx="18" cy="18" r="16" fill="transparent" stroke="#E2E8F0" strokeWidth="3" />
                                        <circle
                                            cx="18" cy="18" r="16"
                                            fill="transparent"
                                            stroke={healthScoreData.score >= 80 ? '#0E6C4A' : healthScoreData.score >= 50 ? '#D97706' : '#DC2626'}
                                            strokeWidth="3"
                                            strokeDasharray="100 100"
                                            strokeDashoffset={100 - healthScoreData.score}
                                            className="transition-all duration-1000"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-slate-800 font-semibold text-3xl leading-8">{healthScoreData.score}</span>
                                        <span className="text-[10px] text-slate-400 font-medium mt-1">Skor total</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-28 h-28 rounded-full border-[3px] border-slate-200 flex items-center justify-center">
                                    <span className="text-slate-500 font-semibold text-3xl leading-8">--</span>
                                </div>
                            )}

                            <span className={`ui-badge mt-3 ${healthScoreData.colorClass}`}>
                                {healthScoreData.level}
                            </span>
                            {!healthScoreData.isSufficient && (
                                <p className="max-w-xs text-xs text-slate-500 leading-relaxed mt-3">
                                    Tambahkan transaksi dan anggaran untuk mulai menghitung kondisi finansial Anda.
                                </p>
                            )}
                        </div>

                        {/* Analysis List */}
                        {healthScoreData.isSufficient && <div className="space-y-3 flex-1">
                            {/* Positif factors */}
                            <div className="space-y-2">
                                <span className="text-xs font-medium text-emerald-800">Faktor positif</span>
                                {healthScoreData.additions.length === 0 ? (
                                    <p className="text-xs text-slate-400">Belum ada faktor positif yang terdeteksi.</p>
                                ) : (
                                    healthScoreData.additions.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Critical factors */}
                            <div className="space-y-2 pt-2">
                                <span className="text-xs font-medium text-rose-700">Poin evaluasi</span>
                                {healthScoreData.deductions.length === 0 ? (
                                    <div className="flex items-start gap-2.5 text-xs text-slate-600">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Kondisi aman, tidak ada penalti finansial bulan ini.</span>
                                    </div>
                                ) : (
                                    healthScoreData.deductions.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>}

                        {/* AI Smart Tip Widget */}
                        <div className="mt-auto pt-4 border-t border-stone-100 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="ui-badge text-emerald-800 bg-emerald-50 border-emerald-100">
                                    Tips Keuangan
                                </span>
                                <button 
                                    onClick={() => setCurrentTipIndex((prev) => (prev + 1) % smartTips.length)}
                                    className="ui-button-compact inline-flex items-center text-slate-500 hover:text-emerald-800 transition-colors"
                                >
                                    Tip Lainnya &rarr;
                                </button>
                            </div>
                            <div className="ui-card-subtle p-3">
                                <h4 className="ui-section-title ui-section-title-compact">{smartTips[currentTipIndex].title}</h4>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    {smartTips[currentTipIndex].desc}
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* ── Right Panel: Chat Interface (8/12) ── */}
                    <div className="ui-card lg:col-span-8 p-0 flex flex-col overflow-hidden h-[500px] lg:h-[520px]">
                        {/* Chat Messages */}
                        <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50" aria-live="polite">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center px-5 py-8 text-center">
                                    <h2 className="ui-section-title text-base">Apa yang ingin Anda ketahui tentang keuangan Anda?</h2>
                                    <p className="max-w-lg text-sm text-slate-500 leading-relaxed mt-2">
                                        Saya dapat membantu membaca pola pengeluaran, tabungan, anggaran, dan target finansial berdasarkan data SakuPintar Anda.
                                    </p>
                                    {!hasSufficientData && (
                                        <p className="max-w-lg text-xs text-slate-400 leading-relaxed mt-2">
                                            Catat transaksi dan anggaran agar analisis kondisi finansial lebih akurat.
                                        </p>
                                    )}
                                    <div className="flex flex-wrap justify-center gap-2 max-w-2xl mt-5">
                                        {quickPrompts.map((p) => (
                                            <button
                                                key={p.label}
                                                onClick={() => handleSend(p.text)}
                                                disabled={isTyping}
                                                className="ui-button-compact bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 text-slate-600 inline-flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                                            >
                                                {p.label}
                                                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map((msg) => {
                                        const isBot = msg.sender === 'bot';
                                        return (
                                            <div key={msg.id} className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                                                    isBot ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-slate-800 border-slate-700 text-white'
                                                }`}>
                                                    {isBot ? <Bot className="w-4 h-4" aria-hidden="true" /> : <User className="w-4 h-4" aria-hidden="true" />}
                                                </div>
                                                <div className={`max-w-[78%] md:max-w-[68%] p-3 rounded-xl text-sm shadow-sm whitespace-pre-line leading-relaxed ${
                                                    isBot ? 'bg-white text-slate-800 rounded-tl-sm border border-stone-100' : 'bg-emerald-800 text-white rounded-tr-sm'
                                                }`}>
                                                    {formatMessageText(msg.text)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100 bg-emerald-50 text-emerald-800 shadow-sm">
                                        <Bot className="w-4 h-4" aria-hidden="true" />
                                    </div>
                                    <div className="bg-white border border-stone-100 text-slate-400 p-3 rounded-xl rounded-tl-sm text-sm shadow-sm flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Quick Action Suggesters */}
                        {messages.length > 0 && (
                            <div className="px-4 py-2.5 bg-white border-t border-stone-100 flex flex-wrap gap-2 shrink-0">
                                {quickPrompts.map((p) => (
                                    <button
                                        key={p.label}
                                        onClick={() => handleSend(p.text)}
                                        disabled={isTyping}
                                        className="ui-button-compact bg-slate-50 hover:bg-emerald-50/50 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 text-slate-600 transition-all inline-flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        {p.label}
                                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Chat Input Bar */}
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="px-4 py-3 bg-white border-t border-stone-200 flex gap-2 items-center shrink-0"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isTyping}
                                aria-label="Tulis pertanyaan ke asisten keuangan"
                                placeholder="Ketik pesan Anda untuk berkonsultasi..."
                                className="ui-control flex-1 bg-slate-50 px-3 py-2 text-sm disabled:opacity-50"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isTyping || !input.trim()}
                                className="ui-button ui-button-icon inline-flex items-center justify-center bg-emerald-800 hover:bg-emerald-700 text-white transition-colors disabled:bg-slate-200 disabled:text-slate-400 shrink-0"
                            >
                                <Send className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </form>
                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}
