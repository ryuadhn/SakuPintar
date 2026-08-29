import React, { useState, useMemo, useRef, useEffect } from 'react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import { useFinance } from '../Store/FinanceContext';
import { fmtIDR, currentMonthKey } from '../Utils/format';
import { BrainCircuit, Send, Bot, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AIAdvisor() {
    const { transactions, categories, savingsGoals, getBudgetAlerts, monthStats } = useFinance();
    const chatEndRef = useRef(null);

    // ─── Financial calculations ───
    const currentMonth = currentMonthKey();
    const stats = monthStats(currentMonth);
    const budgetAlerts = getBudgetAlerts();
    const overbudgetAlerts = budgetAlerts.filter(a => a.level === 'over');

    const savingRate = stats.income > 0 ? Math.round((stats.net / stats.income) * 100) : 0;

    // ─── AI Health Score Calculations ───
    const healthScoreData = useMemo(() => {
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
            score: finalScore,
            level,
            colorClass,
            barColor,
            deductions,
            additions
        };
    }, [stats, savingRate, overbudgetAlerts, savingsGoals]);

    // ─── Chatbot State ───
    const [messages, setMessages] = useState([
        {
            id: '1',
            sender: 'bot',
            text: 'Halo! Saya Asisten Keuangan AI SakuPintar. Saya telah menganalisis kondisi dompet, anggaran kategori, dan target tabungan Anda bulan ini. Silakan tanyakan hal-hal berikut untuk memulai:',
            timestamp: new Date()
        }
    ]);
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
                return <strong key={idx} className="font-extrabold text-slate-900">{part}</strong>;
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

    // ─── AI Response Logic ───
    const generateBotResponse = (text) => {
        const normalized = text.toLowerCase();
        
        // 1. Cashflow query
        if (normalized.includes('kondisi') || normalized.includes('cashflow') || normalized.includes('arus kas') || normalized.includes('keuangan')) {
            const statusText = stats.net >= 0 ? 'surplus' : 'defisit';
            return `Laporan Arus Kas Bulanan Anda:\n\n` +
                   `- **Total Pemasukan**: ${fmtIDR(stats.income)}\n` +
                   `- **Total Pengeluaran**: ${fmtIDR(stats.expense)}\n` +
                   `- **Sisa Saldo Bersih**: ${stats.net >= 0 ? '+' : ''}${fmtIDR(stats.net)} (${statusText})\n` +
                   `- **Tingkat Menabung**: ${savingRate}%\n\n` +
                   `Kondisi finansial Anda saat ini bernilai **${healthScoreData.score}/100** (${healthScoreData.level}). ${stats.net < 0 ? 'Batasi pengeluaran esensial Anda minggu ini untuk memulihkan arus kas.' : 'Pengelolaan anggaran Anda berjalan cukup baik.'}`;
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
                   `Rekomendasi:\n` +
                   `Untuk target yang mendekati tenggat waktu, Anda bisa menyisihkan setoran otomatis berkala sebesar nominal bulanan yang telah disarankan.`;
        }

        // 4. Saving advice / tips
        if (normalized.includes('tips') || normalized.includes('hemat') || normalized.includes('saran') || normalized.includes('cara')) {
            const worstCategory = topCategory ? topCategory.name : 'pengeluaran gaya hidup';
            return `Berikut adalah tips hemat yang disesuaikan khusus untuk Anda:\n\n` +
                   `1. **Evaluasi Pengeluaran Terbesar**: Pola transaksi menunjukkan biaya tinggi di sektor **${worstCategory}**. Cobalah menantang diri Anda dengan metode *No-Spend Week* khusus untuk sektor ini.\n` +
                   `2. **Aturan 50/30/20**: Alokasikan 50% pendapatan untuk kebutuhan dasar, 30% untuk keinginan, dan 20% langsung dimasukkan ke tabungan di awal bulan.\n` +
                   `3. **Gunakan Fitur Multi-Wallet**: Pisahkan saldo tunai harian dengan dana simpanan darurat di rekening digital agar dana tidak terpakai secara tidak sengaja.`;
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
        { label: 'Analisis Arus Kas', text: 'Bagaimana kondisi keuangan saya bulan ini?' },
        { label: 'Kategori Terboros', text: 'Kategori pengeluaran apa yang paling boros?' },
        { label: 'Cek Target Tabungan', text: 'Apakah target tabungan saya aman?' },
        { label: 'Tips Hemat Cerdas', text: 'Berikan tips hemat praktis untuk saya.' }
    ];

    return (
        <AuthenticatedLayout>
            <div className="flex flex-col gap-8 pb-12 h-[calc(100vh-120px)]">
                
                {/* ── Header ── */}
                <div>
                    <h1 className="text-zinc-900 text-3xl font-bold leading-10 flex items-center gap-3">
                        <BrainCircuit className="w-8 h-8 text-emerald-800" />
                        Tanya AI
                    </h1>
                    <p className="text-neutral-700 text-sm mt-1">Konsultasikan kondisi anggaran, tabungan, dan kelayakan finansial Anda bersama asisten cerdas.</p>
                </div>

                {/* ── Main Layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 items-stretch">
                    
                    {/* ── Left Panel: Health Score Summary (4/12) ── */}
                    <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-5 overflow-y-auto">
                        <div>
                            <h3 className="font-bold text-slate-800 text-base">Skor Kesehatan Finansial</h3>
                            <p className="text-slate-500 text-xs mt-0.5">Analisis kesehatan finansial berdasarkan pola transaksi riil.</p>
                        </div>

                        {/* Large Score Circle */}
                        <div className="flex flex-col items-center justify-center py-6 border-b border-stone-100">
                            <div className="relative w-36 h-36 flex items-center justify-center">
                                {/* SVG Background Circle */}
                                <svg width="144" height="144" viewBox="0 0 36 36" className="transform -rotate-90">
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
                                    <span className="text-slate-800 font-extrabold text-4xl leading-9">{healthScoreData.score}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Skor Total</span>
                                </div>
                            </div>
                            
                            <span className={`mt-5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${healthScoreData.colorClass}`}>
                                {healthScoreData.level}
                            </span>
                        </div>

                        {/* Analysis List */}
                        <div className="space-y-4 flex-1">
                            {/* Positif factors */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Faktor Positif</span>
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
                                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Poin Evaluasi</span>
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
                        </div>

                        {/* AI Smart Tip Widget */}
                        <div className="mt-auto pt-5 border-t border-stone-100 flex flex-col gap-2.5">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                                    AI Tip Hari Ini
                                </span>
                                <button 
                                    onClick={() => setCurrentTipIndex((prev) => (prev + 1) % smartTips.length)}
                                    className="text-[10px] font-bold text-slate-500 hover:text-emerald-800 transition-colors"
                                >
                                    Tip Lainnya &rarr;
                                </button>
                            </div>
                            <div className="p-3.5 bg-[#F7FAF5] border border-stone-200 rounded-2xl">
                                <h4 className="text-xs font-bold text-slate-800">{smartTips[currentTipIndex].title}</h4>
                                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                    {smartTips[currentTipIndex].desc}
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* ── Right Panel: Chat Interface (8/12) ── */}
                    <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col overflow-hidden h-[500px] lg:h-auto">
                        {/* Chat Messages */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                            {messages.map((msg) => {
                                const isBot = msg.sender === 'bot';
                                return (
                                    <div key={msg.id} className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                                            isBot ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-slate-800 border-slate-700 text-white'
                                        }`}>
                                            {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                        </div>
                                        <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm whitespace-pre-line leading-relaxed ${
                                            isBot ? 'bg-white text-slate-800 rounded-tl-sm border border-stone-100' : 'bg-emerald-800 text-white rounded-tr-sm'
                                        }`}>
                                            {formatMessageText(msg.text)}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100 bg-emerald-50 text-emerald-800 shadow-sm">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-white border border-stone-100 text-slate-400 p-4 rounded-2xl rounded-tl-sm text-sm shadow-sm flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Quick Action Suggesters */}
                        <div className="px-6 py-3 bg-white border-t border-stone-100 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
                            {quickPrompts.map((p, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(p.text)}
                                    disabled={isTyping}
                                    className="px-4 py-2 bg-slate-50 hover:bg-emerald-50/50 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 rounded-full text-xs font-semibold text-slate-600 transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {p.label}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            ))}
                        </div>

                        {/* Chat Input Bar */}
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="px-6 py-4 bg-white border-t border-stone-200 flex gap-3 items-center shrink-0"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isTyping}
                                placeholder="Ketik pesan Anda untuk berkonsultasi..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isTyping || !input.trim()}
                                className="w-12 h-12 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm disabled:bg-slate-200 disabled:text-slate-400 shrink-0"
                            >
                                <Send className="w-5.5 h-5.5" />
                            </button>
                        </form>
                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}
