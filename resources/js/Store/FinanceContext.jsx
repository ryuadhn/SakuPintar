import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { useAuth } from './AuthContext';
import { advanceISO, currentMonthKey, daysAgoISO, dayOfMonthISO, FREQ_LABELS, monthKeyOf, recurringTransactionId, todayISO, uid } from '../Utils/format';

const STORAGE_KEY = 'sakupintar_finance_v1';
const RECURRING_METADATA_KEY = 'sakupintar_recurring_metadata_v1';

const CATEGORY_LABELS = {
    food: 'Makanan & Minuman',
    transport: 'Transportasi',
    lifestyle: 'Hiburan',
};

const seedCategories = [
    { id: 'food',      name: CATEGORY_LABELS.food,      type: 'expense', color: '#B45309', badge: 'bg-amber-50 text-amber-700 border border-amber-100' },
    { id: 'transport', name: CATEGORY_LABELS.transport, type: 'expense', color: '#2563EB', badge: 'bg-blue-50 text-blue-700 border border-blue-100' },
    { id: 'lifestyle', name: CATEGORY_LABELS.lifestyle, type: 'expense', color: '#9333EA', badge: 'bg-purple-50 text-purple-700 border border-purple-100' },
    { id: 'shopping',  name: 'Belanja',         type: 'expense', color: '#E11D48', badge: 'bg-rose-50 text-rose-700 border border-rose-100' },
    { id: 'bills',     name: 'Tagihan',         type: 'expense', color: '#57534E', badge: 'bg-stone-100 text-stone-700 border border-stone-200' },
    { id: 'health',    name: 'Kesehatan',       type: 'expense', color: '#059669', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
    { id: 'salary',    name: 'Gaji',            type: 'income',  color: '#0E6C4A', badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    { id: 'bonus',     name: 'Bonus & Proyek',  type: 'income',  color: '#0F766E', badge: 'bg-teal-50 text-teal-700 border border-teal-100' },
    { id: 'other-inc', name: 'Pemasukan Lain',  type: 'income',  color: '#475569', badge: 'bg-slate-100 text-slate-700 border border-slate-200' },
];

const seedWallets = [
    { id: 'personal', name: 'Kartu Personal', color: '#0E6C4A', initialBalance: 85000000 },
    { id: 'bca',      name: 'BCA Digital',   color: '#565E74', initialBalance: 12450000 },
    { id: 'cash',     name: 'Tunai',         color: '#B45309', initialBalance: 750000 },
];

const buildSeedTransactions = () => {
    const d = daysAgoISO;
    return [
        { id: uid(), date: d(1),  time: '14:30', title: 'Starbucks Reserve',          note: 'Kopi & snack sore',        categoryId: 'food',      walletId: 'personal', amount: 125000,   type: 'expense' },
        { id: uid(), date: d(2),  time: '19:45', title: 'Haidilao Hotpot',            note: 'Makan malam keluarga',     categoryId: 'food',      walletId: 'personal', amount: 850000,   type: 'expense' },
        { id: uid(), date: d(3),  time: '08:10', title: 'Shell Gatot Subroto',        note: 'Bensin V-Power',           categoryId: 'transport', walletId: 'personal', amount: 450000,   type: 'expense' },
        { id: uid(), date: d(4),  time: '20:05', title: 'Belanja Bulanan Indomaret',  note: 'Kebutuhan rumah',          categoryId: 'shopping',  walletId: 'cash',     amount: 320000,   type: 'expense' },
        { id: uid(), date: d(5),  time: '10:00', title: 'Konsultasi Dokter Gigi',     note: 'Scaling + tambal',         categoryId: 'health',    walletId: 'bca',      amount: 600000,   type: 'expense' },
        { id: uid(), date: d(6),  time: '12:00', title: 'Top Up Dompet Utama',        note: 'Persiapan gajian',         fromWalletId: 'bca', toWalletId: 'personal', amount: 2000000, type: 'transfer' },
        { id: uid(), date: d(7),  time: '09:15', title: 'Proyek Freelance Website',   note: 'Inbound dari Client XYZ',  categoryId: 'bonus',     walletId: 'bca',      amount: 4500000,  type: 'income' },
        { id: uid(), date: d(8),  time: '18:40', title: 'Tagihan Listrik PLN',        note: 'Token bulanan',            categoryId: 'bills',     walletId: 'bca',      amount: 480000,   type: 'expense' },
        { id: uid(), date: d(9),  time: '07:55', title: 'Bensin Ojek Online',         note: 'Top up driver',            categoryId: 'transport', walletId: 'cash',     amount: 80000,    type: 'expense' },
        { id: uid(), date: d(11), time: '13:20', title: 'Baju & Sepatu Sneakers',     note: 'Diskon akhir pekan',       categoryId: 'shopping',  walletId: 'personal', amount: 780000,   type: 'expense' },
        { id: uid(), date: d(13), time: '16:00', title: 'Vitamin & Suplemen',         note: 'Restock bulanan',          categoryId: 'health',    walletId: 'cash',     amount: 185000,   type: 'expense' },
        { id: uid(), date: d(15), time: '21:10', title: 'Nonton Bioskop',             note: 'Weekend movie night',      categoryId: 'lifestyle', walletId: 'personal', amount: 250000,   type: 'expense' },
    ];
};

const buildSeedSavingsGoals = () => [
    { 
        id: uid(), 
        title: 'Rumah Impian', 
        iconKey: 'home', 
        deadlineISO: '2026-12-01', 
        current: 125000000, 
        target: 500000000, 
        monthly: 8500000,
        history: [
            { id: uid(), date: '2026-07-15', amount: 125000000, note: 'Pindahan Tabungan Lama' }
        ]
    },
    { 
        id: uid(), 
        title: 'Liburan ke Jepang', 
        iconKey: 'plane', 
        deadlineISO: '2027-06-01', 
        current: 20500000, 
        target: 25000000, 
        monthly: 1500000,
        history: [
            { id: uid(), date: '2026-08-01', amount: 10000000, note: 'Setoran Awal' },
            { id: uid(), date: '2026-08-10', amount: 5000000, note: 'Bonus Proyek' },
            { id: uid(), date: '2026-08-15', amount: 5500000, note: 'Setoran Bulanan Agustus' }
        ]
    },
    { 
        id: uid(), 
        title: 'Dana Pendidikan', 
        iconKey: 'gradcap', 
        deadlineISO: '2028-07-01', 
        current: 45000000, 
        target: 300000000, 
        monthly: 4000000,
        history: [
            { id: uid(), date: '2026-07-20', amount: 30000000, note: 'Setoran Awal' },
            { id: uid(), date: '2026-08-10', amount: 15000000, note: 'Setoran Bulanan Agustus' }
        ]
    },
    { 
        id: uid(), 
        title: 'Dana Pensiun', 
        iconKey: 'piggy', 
        deadlineISO: '2045-05-01', 
        current: 720000000, 
        target: 1500000000, 
        monthly: 10000000,
        history: [
            { id: uid(), date: '2026-01-10', amount: 500000000, note: 'Saldo Awal Rekening Pensiun' },
            { id: uid(), date: '2026-06-15', amount: 220000000, note: 'Setoran Rutin Semester 1' }
        ]
    },
    { 
        id: uid(), 
        title: 'Laptop Baru untuk Kerja', 
        iconKey: 'laptop', 
        deadlineISO: '2026-08-01', 
        current: 25000000, 
        target: 25000000, 
        monthly: 2500000,
        history: [
            { id: uid(), date: '2026-08-01', amount: 25000000, note: 'Tabungan Terpenuhi' }
        ]
    },
];

const seedBudgets = {
    food: 2500000,
    transport: 1200000,
    lifestyle: 300000,
    shopping: 1500000,
    bills: 1500000,
    health: 1000000,
};

const buildSeedRules = () => [
    { id: uid(), title: 'Gaji Bulanan',        type: 'income',  categoryId: 'salary',    walletId: 'bca',      amount: 12500000, frequency: 'monthly', nextDate: dayOfMonthISO(1), active: true },
    { id: uid(), title: 'Langganan Streaming', type: 'expense', categoryId: 'lifestyle', walletId: 'personal', amount: 186000,   frequency: 'monthly', nextDate: dayOfMonthISO(28), active: true },
    { id: uid(), title: 'Internet & Wifi',     type: 'expense', categoryId: 'bills',     walletId: 'personal', amount: 350000,   frequency: 'monthly', nextDate: dayOfMonthISO(3), active: true },
];

const seedState = () => ({
    wallets: seedWallets.map((w) => ({ ...w })),
    categories: seedCategories.map((c) => ({ ...c })),
    transactions: buildSeedTransactions(),
    budgets: { ...seedBudgets },
    recurringRules: buildSeedRules(),
    reminders: [],
    savingsGoals: buildSeedSavingsGoals(),
    invitations: [
        {
            id: 'mock-inv-1',
            goalId: 'mock-goal-1',
            inviterName: 'Kekasih',
            inviterEmail: 'pasangan@sakupintar.id',
            inviteeEmail: 'demo@sakupintar.id',
            goalTitle: 'Dana Pernikahan Bersama',
            status: 'pending'
        }
    ]
});

const isValidState = (s) =>
    s && Array.isArray(s.wallets) && Array.isArray(s.categories) &&
    Array.isArray(s.transactions) && Array.isArray(s.recurringRules) &&
    typeof s.budgets === 'object';

const readRecurringMetadata = (userId) => {
    if (!userId) return {};
    try {
        const raw = localStorage.getItem(RECURRING_METADATA_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed[userId] || {};
    } catch (error) {
        console.warn('SakuPintar: gagal membaca metadata aturan rutin.', error);
        return {};
    }
};

const writeRecurringMetadata = (userId, ruleId, anchorDay) => {
    if (!userId || !ruleId || !Number.isInteger(anchorDay)) return;
    try {
        const raw = localStorage.getItem(RECURRING_METADATA_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        parsed[userId] = { ...(parsed[userId] || {}), [ruleId]: anchorDay };
        localStorage.setItem(RECURRING_METADATA_KEY, JSON.stringify(parsed));
    } catch (error) {
        console.warn('SakuPintar: gagal menyimpan metadata aturan rutin.', error);
    }
};

const removeRecurringMetadata = (userId, ruleId) => {
    if (!userId || !ruleId) return;
    try {
        const raw = localStorage.getItem(RECURRING_METADATA_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        if (!parsed[userId]) return;
        delete parsed[userId][ruleId];
        localStorage.setItem(RECURRING_METADATA_KEY, JSON.stringify(parsed));
    } catch (error) {
        console.warn('SakuPintar: gagal menghapus metadata aturan rutin.', error);
    }
};

const emptyFinanceState = () => ({
    wallets: [],
    categories: seedCategories.map((category) => ({ ...category })),
    transactions: [],
    budgets: {},
    recurringRules: [],
    reminders: [],
    savingsGoals: [],
    invitations: [],
});

const processRecurring = (state) => {
    const today = todayISO();
    let changed = false;
    const txns = [...state.transactions];
    const transactionIds = new Set(txns.map((transaction) => transaction.id));
    const generatedTransactions = [];
    const updatedRules = [];
    const rules = state.recurringRules.map((rule) => {
        if (!rule.active || !rule.nextDate) return rule;
        let next = rule.nextDate;
        let guard = 0;
        let generatedCount = 0;
        const parsedAnchorDay = Number(rule.anchorDay);
        const anchorDay = Number.isInteger(parsedAnchorDay) && parsedAnchorDay >= 1 && parsedAnchorDay <= 31
            ? parsedAnchorDay
            : Number(rule.nextDate.split('-')[2]);
        while (next <= today && guard < 400) {
            const transaction = {
                id: recurringTransactionId(rule.id, next),
                date: next,
                time: '08:00',
                title: rule.title,
                note: `Otomatis \u2022 ${FREQ_LABELS[rule.frequency] || 'Rutin'}`,
                categoryId: rule.categoryId,
                walletId: rule.walletId,
                amount: rule.amount,
                type: rule.type,
                auto: true,
            };
            generatedCount += 1;
            if (!transactionIds.has(transaction.id)) {
                txns.push(transaction);
                transactionIds.add(transaction.id);
                generatedTransactions.push(transaction);
            }
            next = advanceISO(next, rule.frequency, anchorDay);
            guard++;
        }
        if (generatedCount === 0) return rule;
        changed = true;
        updatedRules.push({ id: rule.id, previousNextDate: rule.nextDate, nextDate: next });
        return { ...rule, nextDate: next, anchorDay };
    });
    return {
        state: changed ? { ...state, transactions: txns, recurringRules: rules } : state,
        generatedTransactions,
        updatedRules,
    };
};

const persistRecurringChanges = async (userId, { generatedTransactions, updatedRules }) => {
    if (generatedTransactions.length > 0) {
        const transactionResponses = await Promise.all(generatedTransactions.map((transaction) => (
            supabase.from('transactions').insert([{
                id: transaction.id,
                user_id: userId,
                title: transaction.title,
                amount: Number(transaction.amount),
                type: transaction.type,
                category_id: transaction.categoryId,
                wallet_id: transaction.walletId,
                date: transaction.date,
                time: transaction.time,
                note: transaction.note,
            }])
        )));
        const transactionError = transactionResponses.find((response) => response.error)?.error;
        if (transactionError) throw transactionError;
    }

    if (updatedRules.length > 0) {
        const ruleResponses = await Promise.all(updatedRules.map((rule) => (
            supabase.from('recurring_rules')
                .update({ next_date: rule.nextDate })
                .eq('id', rule.id)
                .eq('user_id', userId)
                .select('id')
        )));
        const ruleError = ruleResponses.find((response) => response.error)?.error;
        if (ruleError) throw ruleError;
        const missingRule = ruleResponses.find((response) => !response.data || response.data.length === 0);
        if (missingRule) throw new Error('Aturan rutin tidak ditemukan.');
    }
};

const rollbackPersistedRecurringChanges = async (userId, { generatedTransactions, updatedRules }) => {
    if (generatedTransactions.length > 0) {
        const responses = await Promise.all(generatedTransactions.map((transaction) => (
            supabase.from('transactions')
                .delete()
                .eq('id', transaction.id)
                .eq('user_id', userId)
        )));
        const rollbackError = responses.find((response) => response.error)?.error;
        if (rollbackError) throw rollbackError;
    }

    if (updatedRules.length === 0) return;
    const responses = await Promise.all(updatedRules.map((rule) => (
        supabase.from('recurring_rules')
            .update({ next_date: rule.previousNextDate })
            .eq('id', rule.id)
            .eq('user_id', userId)
    )));
    const rollbackError = responses.find((response) => response.error)?.error;
    if (rollbackError) throw rollbackError;
};

const nextRecurringDateFromToday = (nextDate, frequency, anchorDay) => {
    const today = todayISO();
    let next = nextDate;
    let guard = 0;
    const parsedAnchorDay = Number(anchorDay);
    const stableAnchorDay = Number.isInteger(parsedAnchorDay) && parsedAnchorDay >= 1 && parsedAnchorDay <= 31
        ? parsedAnchorDay
        : Number(nextDate.split('-')[2]);
    while (next < today && guard < 400) {
        next = advanceISO(next, frequency, stableAnchorDay);
        guard += 1;
    }
    return next < today ? today : next;
};

const loadInitialState = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (isValidState(parsed)) {
                return {
                    ...parsed,
                    categories: parsed.categories.map((category) => ({
                        ...category,
                        name: CATEGORY_LABELS[category.id] || category.name,
                    })),
                    wallets: parsed.wallets.map((wallet) => ({
                        ...wallet,
                        name: wallet.id === 'personal' ? 'Kartu Personal' : wallet.name,
                    })),
                    savingsGoals: (Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : buildSeedSavingsGoals()).map((g) => ({
                        ...g,
                        history: Array.isArray(g.history) ? g.history : (g.current > 0 ? [{ id: uid(), date: todayISO(), amount: g.current, note: 'Saldo Awal' }] : [])
                    })),
                    reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
                    invitations: Array.isArray(parsed.invitations) ? parsed.invitations : seedState().invitations
                };
            }
        }
    } catch (e) {
        console.warn('SakuPintar: gagal membaca data tersimpan.', e);
    }
    return seedState();
};

export function FinanceProvider({ children }) {
    const [state, setState] = useState(loadInitialState);
    const { user } = useAuth();
    const { wallets, categories, transactions, budgets, recurringRules, reminders = [], savingsGoals, invitations = [] } = state;
    const [syncAttempt, setSyncAttempt] = useState(0);
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncError, setSyncError] = useState('');
    const [calendarOperation, setCalendarOperation] = useState(null);
    const [calendarError, setCalendarError] = useState('');

    const retrySync = useCallback(() => setSyncAttempt((attempt) => attempt + 1), []);
    const clearCalendarError = useCallback(() => setCalendarError(''), []);

    // ─── LocalStorage Fallback Backup ───
    useEffect(() => {
        if (isSupabaseConfigured && user) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('SakuPintar: gagal menyimpan data.', e);
        }
    }, [state, user]);

    // ─── Supabase Data Sync Loader ───
    useEffect(() => {
        let cancelled = false;

        if (!isSupabaseConfigured || !user) {
            setSyncLoading(false);
            setSyncError('');
            setState(loadInitialState());
            return () => {
                cancelled = true;
            };
        }

        setState(emptyFinanceState());

        const fetchSupabaseData = async () => {
            const userId = user.id;
            const recurringMetadata = readRecurringMetadata(userId);
            setSyncLoading(true);
            setSyncError('');

            try {
                const responses = await Promise.all([
                    supabase.from('wallets').select('*').eq('user_id', userId),
                    supabase.from('transactions').select('*').eq('user_id', userId),
                    supabase.from('category_budgets').select('*').eq('user_id', userId),
                    supabase.from('savings_goals').select('*').eq('user_id', userId),
                    supabase.from('recurring_rules').select('*').eq('user_id', userId),
                    supabase.from('reminders').select('*').eq('user_id', userId),
                    supabase.from('savings_goal_invitations').select('*').eq('invitee_email', user.email.toLowerCase())
                ]);

                const responseError = responses.find((response) => response.error)?.error;
                if (responseError) throw responseError;
                if (cancelled) return;

                const [walletsResponse, txnsResponse, budgetsResponse, savingsResponse, rulesResponse, remindersResponse, invitationsResponse] = responses;
                const walletsData = walletsResponse.data;
                const txnsData = txnsResponse.data;
                const budgetsData = budgetsResponse.data;
                const savingsData = savingsResponse.data;
                const rulesData = rulesResponse.data;
                const remindersData = remindersResponse.data;
                const invsData = invitationsResponse.data;

                const budgetsObj = {};
                if (budgetsData) {
                    budgetsData.forEach((b) => {
                        budgetsObj[b.category_id] = Number(b.limit_amount);
                    });
                }

                const remoteState = {
                    wallets: walletsData && walletsData.length > 0
                        ? walletsData.map(w => ({ id: w.id, name: w.name, color: w.color, initialBalance: Number(w.balance) }))
                        : seedWallets.map(w => ({ ...w })),
                    categories: seedCategories.map(c => ({ ...c })),
                    transactions: txnsData ? txnsData.map(t => ({
                        id: t.id,
                        title: t.title,
                        amount: Number(t.amount),
                        type: t.type,
                        categoryId: t.category_id,
                        walletId: t.wallet_id,
                        fromWalletId: t.from_wallet_id,
                        toWalletId: t.to_wallet_id,
                        date: t.date,
                        time: t.time,
                        note: t.note,
                        auto: t.auto,
                    })) : [],
                    budgets: Object.keys(budgetsObj).length > 0 ? budgetsObj : { ...seedBudgets },
                    recurringRules: rulesData ? rulesData.map(r => ({
                        id: r.id,
                        title: r.title,
                        amount: Number(r.amount),
                        type: r.type,
                        categoryId: r.category_id,
                        walletId: r.wallet_id,
                        frequency: r.frequency,
                        nextDate: r.next_date,
                        active: r.active,
                        anchorDay: Number(recurringMetadata[r.id] || r.anchor_day) || Number(r.next_date?.split('-')[2]) || undefined,
                    })) : [],
                    reminders: remindersData ? remindersData.map(r => ({
                        id: r.id,
                        title: r.title,
                        date: r.date,
                        time: r.time,
                        type: r.type,
                        notes: r.notes,
                        isCompleted: r.is_completed,
                        amount: r.amount === null || r.amount === undefined ? null : Number(r.amount),
                        createdAt: r.created_at,
                        updatedAt: r.updated_at
                    })) : [],
                    savingsGoals: savingsData ? savingsData.map(g => ({
                        id: g.id,
                        title: g.title,
                        target: Number(g.target),
                        current: Number(g.current),
                        deadlineISO: g.deadline_iso,
                        history: g.history || [],
                        isShared: g.is_shared,
                        partnerEmail: g.partner_email
                    })) : [],
                    invitations: invsData ? invsData.map(inv => ({
                        id: inv.id,
                        goalId: inv.goal_id,
                        inviterName: inv.inviter_name,
                        inviterEmail: inv.inviter_email,
                        inviteeEmail: inv.invitee_email,
                        goalTitle: inv.goal_title,
                        status: inv.status
                    })) : []
                };
                const processed = processRecurring(remoteState);
                if (cancelled) return;
                setState(processed.state);
                try {
                    await persistRecurringChanges(userId, processed);
                    if (cancelled) return;
                } catch (error) {
                    try {
                        await rollbackPersistedRecurringChanges(userId, processed);
                    } catch (rollbackError) {
                        console.error('SakuPintar: gagal membatalkan transaksi rutin yang tersimpan.', rollbackError);
                    }
                    if (cancelled) return;
                    setState(remoteState);
                    throw error;
                }
            } catch (error) {
                if (cancelled) return;
                console.error('SakuPintar: gagal memuat data dari Supabase.', error);
                setSyncError('Data kalender tidak dapat dimuat. Periksa koneksi Anda lalu coba lagi.');
            } finally {
                if (!cancelled) setSyncLoading(false);
            }
        };

        fetchSupabaseData();
        return () => {
            cancelled = true;
        };
    }, [user, syncAttempt]);

    // Process recurring transactions
    useEffect(() => {
        if (isSupabaseConfigured && user) return;
        setState((s) => processRecurring(s).state);
    }, [user]);

    const categoryById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
    const walletById = useMemo(() => Object.fromEntries(wallets.map((w) => [w.id, w])), [wallets]);

    const sortedTransactions = useMemo(
        () => [...transactions].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
        [transactions]
    );

    const addTransaction = useCallback(async (data) => {
        const newId = uid();
        setState((s) => ({ ...s, transactions: [{ ...data, id: newId }, ...s.transactions] }));
        
        if (isSupabaseConfigured && user) {
            await supabase.from('transactions').insert([{
                id: newId,
                user_id: user.id,
                title: data.title,
                amount: Number(data.amount),
                type: data.type,
                category_id: data.categoryId,
                wallet_id: data.walletId,
                date: data.date,
                time: data.time,
                note: data.note
            }]);
        }
    }, [user]);

    const updateTransaction = useCallback(async (id, data) => {
        setState((s) => ({ ...s, transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...data } : t)) }));
        
        if (isSupabaseConfigured && user) {
            await supabase.from('transactions').update({
                title: data.title,
                amount: data.amount ? Number(data.amount) : undefined,
                type: data.type,
                category_id: data.categoryId,
                wallet_id: data.walletId,
                from_wallet_id: data.fromWalletId,
                to_wallet_id: data.toWalletId,
                date: data.date,
                time: data.time,
                note: data.note
            }).eq('id', id);
        }
    }, [user]);

    const deleteTransaction = useCallback(async (id) => {
        setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));
        
        if (isSupabaseConfigured && user) {
            await supabase.from('transactions').delete().eq('id', id);
        }
    }, [user]);

    const addTransfer = useCallback(async ({ fromWalletId, toWalletId, amount, title, date, time, note }) => {
        const newId = uid();
        const newTx = {
            id: newId,
            type: 'transfer',
            title: title || 'Transfer Antar Dompet',
            note: note || '',
            fromWalletId,
            toWalletId,
            amount,
            date,
            time,
        };
        setState((s) => ({ ...s, transactions: [newTx, ...s.transactions] }));
        
        if (isSupabaseConfigured && user) {
            await supabase.from('transactions').insert([{
                id: newId,
                user_id: user.id,
                type: 'transfer',
                title: title || 'Transfer Antar Dompet',
                note: note || '',
                from_wallet_id: fromWalletId,
                to_wallet_id: toWalletId,
                amount: Number(amount),
                date,
                time,
            }]);
        }
    }, [user]);

    const addWallet = useCallback(async ({ name, color, initialBalance }) => {
        const newId = uid();
        const wallet = {
            id: newId,
            name: name.trim(),
            color,
            initialBalance: Number(initialBalance) || 0,
        };
        setState((s) => ({ ...s, wallets: [...s.wallets, wallet] }));
        
        if (isSupabaseConfigured && user) {
            await supabase.from('wallets').insert([{
                id: newId,
                user_id: user.id,
                name: wallet.name,
                color: wallet.color,
                balance: wallet.initialBalance
            }]);
        }
    }, [user]);

    const updateWallet = useCallback(async (id, data) => {
        setState((s) => ({
            ...s,
            wallets: s.wallets.map((w) => (
                w.id === id
                    ? {
                        ...w,
                        name: data.name?.trim() || w.name,
                        color: data.color || w.color,
                        initialBalance: Number(data.initialBalance) || 0,
                    }
                    : w
            )),
        }));
        
        if (isSupabaseConfigured && user) {
            await supabase.from('wallets').update({
                name: data.name?.trim(),
                color: data.color,
                balance: data.initialBalance ? Number(data.initialBalance) : undefined
            }).eq('id', id);
        }
    }, [user]);

    const deleteWallet = useCallback(async (id) => {
        setState((s) => ({
            ...s,
            wallets: s.wallets.filter((w) => w.id !== id),
        }));
        
        if (isSupabaseConfigured && user) {
            await supabase.from('wallets').delete().eq('id', id);
        }
    }, [user]);

    const addCategory = useCallback(({ name, type, budget }) => {
        const palette = ['#B45309', '#2563EB', '#9333EA', '#E11D48', '#059669', '#0F766E', '#475569'];
        const badgePalette = [
            'bg-amber-50 text-amber-700 border border-amber-100',
            'bg-blue-50 text-blue-700 border border-blue-100',
            'bg-purple-50 text-purple-700 border border-purple-100',
            'bg-rose-50 text-rose-700 border border-rose-100',
            'bg-emerald-50 text-emerald-700 border border-emerald-100',
            'bg-teal-50 text-teal-700 border border-teal-100',
            'bg-slate-100 text-slate-700 border border-slate-200',
        ];
        const idx = Math.floor(Math.random() * palette.length);
        const cat = { id: uid(), name, type: type || 'expense', color: palette[idx], badge: badgePalette[idx] };
        setState((s) => ({
            ...s,
            categories: [...s.categories, cat],
            budgets: budget && cat.type === 'expense' ? { ...s.budgets, [cat.id]: Number(budget) } : s.budgets,
        }));
    }, []);

    const updateCategory = useCallback((id, data) => {
        setState((s) => {
            const budgetsNext = { ...s.budgets };
            if (data.budget === null || data.budget === '' || data.budget === undefined) delete budgetsNext[id];
            else budgetsNext[id] = Number(data.budget);
            return {
                ...s,
                budgets: budgetsNext,
                categories: s.categories.map((c) => (c.id === id ? { ...c, name: data.name ?? c.name } : c)),
            };
        });
    }, []);

    const deleteCategory = useCallback((id) => {
        setState((s) => {
            const budgetsNext = { ...s.budgets };
            delete budgetsNext[id];
            return {
                ...s,
                budgets: budgetsNext,
                categories: s.categories.filter((c) => c.id !== id),
                recurringRules: s.recurringRules.filter((r) => r.categoryId !== id),
            };
        });
    }, []);

    const setBudget = useCallback(async (categoryId, limit) => {
        setState((s) => {
            const budgetsNext = { ...s.budgets };
            if (!limit) delete budgetsNext[categoryId];
            else budgetsNext[categoryId] = Number(limit);
            return { ...s, budgets: budgetsNext };
        });

        if (isSupabaseConfigured && user) {
            if (!limit) {
                await supabase.from('category_budgets').delete().eq('user_id', user.id).eq('category_id', categoryId);
            } else {
                await supabase.from('category_budgets').upsert([{
                    user_id: user.id,
                    category_id: categoryId,
                    limit_amount: Number(limit),
                    month_key: currentMonthKey()
                }], { onConflict: 'user_id,category_id,month_key' });
            }
        }
    }, [user]);

    const addRecurringRule = useCallback(async (data) => {
        const newId = uid();
        const anchorDay = data.frequency === 'monthly' ? Number(data.nextDate.split('-')[2]) : undefined;
        const rule = {
            ...data,
            id: newId,
            active: true,
            anchorDay,
        };
        setCalendarError('');
        setState((s) => ({ ...s, recurringRules: [...s.recurringRules, rule] }));

        if (!isSupabaseConfigured || !user) return true;

        writeRecurringMetadata(user.id, newId, anchorDay);
        setCalendarOperation('recurring-add');
        try {
            const { error } = await supabase.from('recurring_rules').insert([{
                id: newId,
                user_id: user.id,
                title: data.title,
                amount: Number(data.amount),
                type: data.type,
                category_id: data.categoryId,
                wallet_id: data.walletId,
                frequency: data.frequency,
                next_date: data.nextDate,
                active: true
            }]);
            if (error) throw error;
            return true;
        } catch (error) {
            let persistedRule = null;
            try {
                const response = await supabase.from('recurring_rules')
                    .select('id')
                    .eq('id', newId)
                    .eq('user_id', user.id)
                    .maybeSingle();
                persistedRule = response.data;
            } catch (lookupError) {
                console.error('SakuPintar: gagal memverifikasi aturan rutin.', lookupError);
            }
            if (persistedRule) return true;
            console.error('SakuPintar: gagal menyimpan aturan rutin.', error);
            removeRecurringMetadata(user.id, newId);
            setState((s) => ({ ...s, recurringRules: s.recurringRules.filter((r) => r.id !== newId) }));
            setCalendarError('Aturan rutin gagal disimpan. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            setCalendarOperation(null);
        }
    }, [user]);

    const toggleRecurringRule = useCallback(async (id) => {
        const previousRule = recurringRules.find((rule) => rule.id === id);
        if (!previousRule) return false;
        const activeNext = !previousRule.active;
        const parsedAnchorDay = Number(previousRule.anchorDay);
        const anchorDay = previousRule.frequency === 'monthly'
            ? Number.isInteger(parsedAnchorDay) && parsedAnchorDay >= 1 && parsedAnchorDay <= 31
                ? parsedAnchorDay
                : Number(previousRule.nextDate?.split('-')[2])
            : previousRule.anchorDay;
        const nextDate = activeNext && previousRule.nextDate
            ? nextRecurringDateFromToday(previousRule.nextDate, previousRule.frequency, anchorDay)
            : previousRule.nextDate;

        setCalendarError('');
        setState((s) => ({
            ...s,
            recurringRules: s.recurringRules.map((rule) => (
                rule.id === id ? { ...rule, active: activeNext, nextDate, anchorDay } : rule
            )),
        }));

        if (!isSupabaseConfigured || !user) return true;

        writeRecurringMetadata(user.id, id, anchorDay);
        setCalendarOperation('recurring-toggle');
        try {
            const { data: updatedRules, error } = await supabase.from('recurring_rules')
                .update({ active: activeNext, next_date: nextDate })
                .eq('id', id)
                .eq('user_id', user.id)
                .select('id');
            if (error) throw error;
            if (!updatedRules || updatedRules.length === 0) throw new Error('Aturan rutin tidak ditemukan.');
            return true;
        } catch (error) {
            console.error('SakuPintar: gagal mengubah status aturan rutin.', error);
            setState((s) => ({
                    ...s,
                    recurringRules: s.recurringRules.map((rule) => (
                    rule.id === id ? previousRule : rule
                )),
            }));
            setCalendarError('Status aturan rutin gagal disimpan. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            setCalendarOperation(null);
        }
    }, [user, recurringRules]);

    const deleteRecurringRule = useCallback(async (id) => {
        const previousIndex = recurringRules.findIndex((rule) => rule.id === id);
        const previousRule = previousIndex >= 0 ? recurringRules[previousIndex] : null;
        if (!previousRule) return false;

        setCalendarError('');
        setState((s) => ({ ...s, recurringRules: s.recurringRules.filter((r) => r.id !== id) }));

        if (!isSupabaseConfigured || !user) return true;

        setCalendarOperation('recurring-delete');
        try {
            const { data, error } = await supabase.from('recurring_rules')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id)
                .select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Aturan rutin tidak ditemukan.');
            removeRecurringMetadata(user.id, id);
            return true;
        } catch (error) {
            console.error('SakuPintar: gagal menghapus aturan rutin.', error);
            setState((s) => {
                if (s.recurringRules.some((rule) => rule.id === id)) return s;
                const rules = [...s.recurringRules];
                rules.splice(Math.min(previousIndex, rules.length), 0, previousRule);
                return { ...s, recurringRules: rules };
            });
            setCalendarError('Aturan rutin gagal dihapus. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            setCalendarOperation(null);
        }
    }, [user, recurringRules]);

    const addReminder = useCallback(async (data) => {
        const newId = uid();
        const reminder = {
            id: newId,
            title: String(data.title || '').trim(),
            date: data.date,
            time: data.time || null,
            type: data.type,
            notes: data.notes ? String(data.notes).trim() : null,
            isCompleted: false,
            amount: data.type === 'finance' && data.amount !== '' && data.amount !== null && data.amount !== undefined
                ? Number(data.amount)
                : null,
        };

        setCalendarError('');
        setState((s) => ({ ...s, reminders: [reminder, ...(s.reminders || [])] }));

        if (!isSupabaseConfigured || !user) return true;

        setCalendarOperation('reminder-add');
        try {
            const { error } = await supabase.from('reminders').insert([{
                id: newId,
                user_id: user.id,
                title: reminder.title,
                date: reminder.date,
                time: reminder.time,
                type: reminder.type,
                notes: reminder.notes,
                is_completed: false,
                amount: reminder.amount,
            }]);
            if (error) throw error;
            return true;
        } catch (error) {
            let persistedReminder = null;
            try {
                const response = await supabase.from('reminders')
                    .select('id')
                    .eq('id', newId)
                    .eq('user_id', user.id)
                    .maybeSingle();
                persistedReminder = response.data;
            } catch (lookupError) {
                console.error('SakuPintar: gagal memverifikasi pengingat.', lookupError);
            }
            if (persistedReminder) return true;
            console.error('SakuPintar: gagal menyimpan pengingat.', error);
            setState((s) => ({ ...s, reminders: (s.reminders || []).filter((item) => item.id !== newId) }));
            setCalendarError('Pengingat gagal disimpan. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            setCalendarOperation(null);
        }
    }, [user]);

    const updateReminder = useCallback(async (id, data) => {
        const previousReminder = reminders.find((reminder) => reminder.id === id);
        if (!previousReminder) return false;
        const changes = {
            title: String(data.title || '').trim(),
            date: data.date,
            time: data.time || null,
            type: data.type,
            notes: data.notes ? String(data.notes).trim() : null,
            amount: data.type === 'finance' && data.amount !== '' && data.amount !== null && data.amount !== undefined
                ? Number(data.amount)
                : null,
        };
        const completionChange = data.isCompleted === undefined ? {} : { isCompleted: data.isCompleted };

        setCalendarError('');
        setState((s) => ({
            ...s,
            reminders: (s.reminders || []).map((r) => (
                r.id === id ? { ...r, ...changes, ...completionChange } : r
            )),
        }));

        if (!isSupabaseConfigured || !user) return true;

        setCalendarOperation('reminder-update');
        try {
            const { data: updatedReminders, error } = await supabase.from('reminders').update({
                title: changes.title,
                date: changes.date,
                time: changes.time,
                type: changes.type,
                notes: changes.notes,
                amount: changes.amount,
                ...(data.isCompleted === undefined ? {} : { is_completed: data.isCompleted }),
            }).eq('id', id).eq('user_id', user.id).select('id');
            if (error) throw error;
            if (!updatedReminders || updatedReminders.length === 0) throw new Error('Pengingat tidak ditemukan.');
            return true;
        } catch (error) {
            console.error('SakuPintar: gagal memperbarui pengingat.', error);
            setState((s) => ({
                ...s,
                reminders: (s.reminders || []).map((reminder) => (
                    reminder.id === id ? previousReminder : reminder
                )),
            }));
            setCalendarError('Pengingat gagal diperbarui. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            setCalendarOperation(null);
        }
    }, [user, reminders]);

    const toggleReminder = useCallback(async (id) => {
        const previousReminder = reminders.find((reminder) => reminder.id === id);
        if (!previousReminder) return false;
        const isCompletedNext = !previousReminder.isCompleted;

        setCalendarError('');
        setState((s) => ({
            ...s,
            reminders: (s.reminders || []).map((reminder) => (
                reminder.id === id ? { ...reminder, isCompleted: isCompletedNext } : reminder
            )),
        }));

        if (!isSupabaseConfigured || !user) return true;

        setCalendarOperation('reminder-toggle');
        try {
            const { data: updatedReminders, error } = await supabase.from('reminders')
                .update({ is_completed: isCompletedNext })
                .eq('id', id)
                .eq('user_id', user.id)
                .select('id');
            if (error) throw error;
            if (!updatedReminders || updatedReminders.length === 0) throw new Error('Pengingat tidak ditemukan.');
            return true;
        } catch (error) {
            console.error('SakuPintar: gagal mengubah status pengingat.', error);
            setState((s) => ({
                ...s,
                reminders: (s.reminders || []).map((reminder) => (
                    reminder.id === id ? previousReminder : reminder
                )),
            }));
            setCalendarError('Status pengingat gagal disimpan. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            setCalendarOperation(null);
        }
    }, [user, reminders]);

    const deleteReminder = useCallback(async (id) => {
        const previousIndex = reminders.findIndex((reminder) => reminder.id === id);
        const previousReminder = previousIndex >= 0 ? reminders[previousIndex] : null;
        if (!previousReminder) return false;

        setCalendarError('');
        setState((s) => ({ ...s, reminders: (s.reminders || []).filter((r) => r.id !== id) }));

        if (!isSupabaseConfigured || !user) return true;

        setCalendarOperation('reminder-delete');
        try {
            const { data: deletedReminders, error } = await supabase.from('reminders')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id)
                .select('id');
            if (error) throw error;
            if (!deletedReminders || deletedReminders.length === 0) throw new Error('Pengingat tidak ditemukan.');
            return true;
        } catch (error) {
            console.error('SakuPintar: gagal menghapus pengingat.', error);
            setState((s) => {
                if ((s.reminders || []).some((reminder) => reminder.id === id)) return s;
                const nextReminders = [...(s.reminders || [])];
                nextReminders.splice(Math.min(previousIndex, nextReminders.length), 0, previousReminder);
                return { ...s, reminders: nextReminders };
            });
            setCalendarError('Pengingat gagal dihapus. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            setCalendarOperation(null);
        }
    }, [user, reminders]);

    const addSavingsGoal = useCallback(async (data) => {
        const newId = uid();
        const history = data.current > 0 ? [{ id: uid(), date: todayISO(), amount: data.current, note: 'Saldo Awal' }] : [];
        const goal = { ...data, id: newId, history };
        setState((s) => ({ ...s, savingsGoals: [...s.savingsGoals, goal] }));

        if (isSupabaseConfigured && user) {
            await supabase.from('savings_goals').insert([{
                id: newId,
                user_id: user.id,
                title: data.title,
                target: Number(data.target),
                current: Number(data.current),
                deadline_iso: data.deadlineISO,
                history: history
            }]);
        }
    }, [user]);

    const deleteSavingsGoal = useCallback(async (id) => {
        setState((s) => ({ ...s, savingsGoals: s.savingsGoals.filter((g) => g.id !== id) }));

        if (isSupabaseConfigured && user) {
            await supabase.from('savings_goals').delete().eq('id', id);
        }
    }, [user]);

    const addSavingsGoalDeposit = useCallback(async (goalId, deposit) => {
        let goalNext = null;
        setState((s) => {
            const goals = s.savingsGoals.map((g) => {
                if (g.id !== goalId) return g;
                const newDeposit = { ...deposit, id: uid() };
                const history = [newDeposit, ...(g.history || [])];
                const current = g.current + deposit.amount;
                goalNext = { ...g, current, history };
                return goalNext;
            });
            return { ...s, savingsGoals: goals };
        });

        if (isSupabaseConfigured && user && goalNext) {
            await supabase.from('savings_goals').update({
                current: goalNext.current,
                history: goalNext.history
            }).eq('id', goalId);
        }
    }, [user]);

    const deleteSavingsGoalDeposit = useCallback(async (goalId, depositId) => {
        let goalNext = null;
        setState((s) => {
            const goals = s.savingsGoals.map((g) => {
                if (g.id !== goalId) return g;
                const history = (g.history || []).filter((d) => d.id !== depositId);
                const dep = (g.history || []).find((d) => d.id === depositId);
                const current = dep ? Math.max(0, g.current - dep.amount) : g.current;
                goalNext = { ...g, current, history };
                return goalNext;
            });
            return { ...s, savingsGoals: goals };
        });

        if (isSupabaseConfigured && user && goalNext) {
            await supabase.from('savings_goals').update({
                current: goalNext.current,
                history: goalNext.history
            }).eq('id', goalId);
        }
    }, [user]);

    const updateSavingsGoalSharing = useCallback(async (goalId, partnerEmail) => {
        const isShared = !!partnerEmail;
        
        // If stopping collaboration
        if (!isShared) {
            setState((s) => ({
                ...s,
                savingsGoals: s.savingsGoals.map((g) => (g.id === goalId ? { ...g, isShared: false, partnerEmail: null } : g))
            }));
            
            if (isSupabaseConfigured && user) {
                await supabase.from('savings_goals').update({ is_shared: false, partner_email: null }).eq('id', goalId);
                await supabase.from('savings_goal_invitations').delete().eq('goal_id', goalId);
            }
            return;
        }

        // Send an invitation
        const newInv = {
            id: uid(),
            goalId,
            inviterName: user ? user.name : 'Pasangan',
            inviterEmail: user ? user.email : 'pasangan@email.com',
            inviteeEmail: partnerEmail.trim().toLowerCase(),
            goalTitle: savingsGoals.find(g => g.id === goalId)?.title || 'Target Bersama',
            status: 'pending'
        };

        setState(s => ({
            ...s,
            invitations: [...(s.invitations || []), newInv]
        }));

        if (isSupabaseConfigured && user) {
            await supabase.from('savings_goal_invitations').insert([{
                id: newInv.id,
                goal_id: newInv.goalId,
                inviter_name: newInv.inviterName,
                inviter_email: newInv.inviterEmail,
                invitee_email: newInv.inviteeEmail,
                goal_title: newInv.goalTitle,
                status: 'pending'
            }]);
        }
    }, [user, savingsGoals]);

    const acceptSavingsGoalInvitation = useCallback(async (invitationId) => {
        let invitation = null;
        
        setState(s => {
            invitation = (s.invitations || []).find(inv => inv.id === invitationId);
            if (!invitation) return s;

            // Remove/accept the invitation in the local list
            const invitationsNext = (s.invitations || []).map(inv => 
                inv.id === invitationId ? { ...inv, status: 'accepted' } : inv
            );

            // In local storage, duplicate the shared goal into the invitee's list!
            const alreadyExists = s.savingsGoals.some(g => g.id === invitation.goalId);
            if (alreadyExists) return { ...s, invitations: invitationsNext };

            // Create a mock local shared goal
            const newGoal = {
                id: invitation.goalId,
                title: invitation.goalTitle,
                target: 100000000, // mock target values
                current: 25000000,
                deadlineISO: todayISO(),
                history: [
                    { id: uid(), date: todayISO(), amount: 25000000, note: 'Saldo Awal Mulai Bersama', senderName: invitation.inviterName }
                ],
                isShared: true,
                partnerEmail: invitation.inviterEmail
            };

            return {
                ...s,
                invitations: invitationsNext,
                savingsGoals: [...s.savingsGoals, newGoal]
            };
        });

        if (isSupabaseConfigured && user) {
            await supabase.from('savings_goal_invitations').update({ status: 'accepted' }).eq('id', invitationId);
            // Insert partner link in collaborators table
            const { data: inv } = await supabase.from('savings_goal_invitations').select('*').eq('id', invitationId).single();
            if (inv) {
                await supabase.from('savings_goal_collaborators').insert([{
                    savings_goal_id: inv.goal_id,
                    user_id: user.id
                }]);
            }
        }
    }, [user]);

    const rejectSavingsGoalInvitation = useCallback(async (invitationId) => {
        setState(s => ({
            ...s,
            invitations: (s.invitations || []).filter(inv => inv.id !== invitationId)
        }));

        if (isSupabaseConfigured && user) {
            await supabase.from('savings_goal_invitations').delete().eq('id', invitationId);
        }
    }, [user]);

    const resetData = useCallback(async () => {
        setCalendarError('');
        if (isSupabaseConfigured && user) {
            const userId = user.id;
            try {
                const responses = await Promise.all([
                    supabase.from('transactions').delete().eq('user_id', userId),
                    supabase.from('wallets').delete().eq('user_id', userId),
                    supabase.from('category_budgets').delete().eq('user_id', userId),
                    supabase.from('savings_goals').delete().eq('user_id', userId),
                    supabase.from('recurring_rules').delete().eq('user_id', userId),
                    supabase.from('reminders').delete().eq('user_id', userId),
                    supabase.from('savings_goal_invitations').delete().or(`inviter_email.eq.${user.email},invitee_email.eq.${user.email}`),
                ]);
                const responseError = responses.find((response) => response.error)?.error;
                if (responseError) throw responseError;
            } catch (error) {
                console.error('SakuPintar: gagal mereset data.', error);
                setCalendarError('Data belum berhasil direset. Periksa koneksi Anda lalu coba lagi.');
                return false;
            }
        }

        localStorage.removeItem(STORAGE_KEY);
        setState(seedState());
        return true;
    }, [user]);

    const getWalletBalance = useCallback((walletId) => {
        const w = walletById[walletId];
        if (!w) return 0;
        let bal = Number(w.initialBalance) || 0;
        for (const t of transactions) {
            if (t.type === 'income' && t.walletId === walletId) bal += t.amount;
            else if (t.type === 'expense' && t.walletId === walletId) bal -= t.amount;
            else if (t.type === 'transfer') {
                if (t.fromWalletId === walletId) bal -= t.amount;
                if (t.toWalletId === walletId) bal += t.amount;
            }
        }
        return bal;
    }, [transactions, walletById]);

    const totalBalance = useMemo(
        () => wallets.reduce((sum, w) => sum + getWalletBalance(w.id), 0),
        [wallets, getWalletBalance]
    );

    const monthStats = useCallback((mk = currentMonthKey()) => {
        let income = 0;
        let expense = 0;
        for (const t of transactions) {
            if (monthKeyOf(t.date) !== mk) continue;
            if (t.type === 'income') income += t.amount;
            else if (t.type === 'expense') expense += t.amount;
        }
        return { income, expense, net: income - expense };
    }, [transactions]);

    const getCategoryMonthSpend = useCallback((categoryId, mk = currentMonthKey()) =>
        transactions
            .filter((t) => t.type === 'expense' && t.categoryId === categoryId && monthKeyOf(t.date) === mk)
            .reduce((sum, t) => sum + t.amount, 0)
    , [transactions]);

    const getCategoryMonthCount = useCallback((categoryId, mk = currentMonthKey()) =>
        transactions.filter((t) => t.categoryId === categoryId && monthKeyOf(t.date) === mk).length
    , [transactions]);

    const getBudgetAlerts = useCallback(() => {
        const alerts = [];
        for (const cat of categories) {
            const limit = budgets[cat.id];
            if (!limit || cat.type !== 'expense') continue;
            const spent = getCategoryMonthSpend(cat.id);
            const pct = Math.round((spent / limit) * 100);
            if (pct >= 80) alerts.push({ categoryId: cat.id, name: cat.name, spent, limit, pct, level: pct >= 100 ? 'over' : 'warning' });
        }
        return alerts.sort((a, b) => b.pct - a.pct);
    }, [categories, budgets, getCategoryMonthSpend]);

    const calendarBusy = Boolean(calendarOperation);

    const value = useMemo(() => ({
        wallets,
        categories,
        transactions: sortedTransactions,
        budgets,
        recurringRules,
        reminders,
        savingsGoals,
        invitations,
        categoryById,
        walletById,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addTransfer,
        addWallet,
        updateWallet,
        deleteWallet,
        addCategory,
        updateCategory,
        deleteCategory,
        setBudget,
        addRecurringRule,
        toggleRecurringRule,
        deleteRecurringRule,
        addReminder,
        updateReminder,
        toggleReminder,
        deleteReminder,
        addSavingsGoal,
        deleteSavingsGoal,
        addSavingsGoalDeposit,
        deleteSavingsGoalDeposit,
        updateSavingsGoalSharing,
        acceptSavingsGoalInvitation,
        rejectSavingsGoalInvitation,
        resetData,
        getWalletBalance,
        totalBalance,
        monthStats,
        getCategoryMonthSpend,
        getCategoryMonthCount,
        getBudgetAlerts,
        syncLoading,
        syncError,
        retrySync,
        calendarBusy,
        calendarError,
        clearCalendarError,
    }), [
        wallets, categories, sortedTransactions, budgets, recurringRules, reminders, savingsGoals, invitations, categoryById, walletById,
        addTransaction, updateTransaction, deleteTransaction, addTransfer,
        addWallet, updateWallet, deleteWallet,
        addCategory, updateCategory, deleteCategory, setBudget,
        addRecurringRule, toggleRecurringRule, deleteRecurringRule,
        addReminder, updateReminder, toggleReminder, deleteReminder,
        addSavingsGoal, deleteSavingsGoal, addSavingsGoalDeposit, deleteSavingsGoalDeposit,
        updateSavingsGoalSharing, acceptSavingsGoalInvitation, rejectSavingsGoalInvitation, resetData,
        getWalletBalance, totalBalance, monthStats, getCategoryMonthSpend, getCategoryMonthCount, getBudgetAlerts,
        syncLoading, syncError, retrySync, calendarBusy, calendarError, clearCalendarError,
    ]);

    return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

const FinanceContext = createContext(null);

export function useFinance() {
    const ctx = useContext(FinanceContext);
    if (!ctx) throw new Error('useFinance harus dipakai di dalam FinanceProvider');
    return ctx;
}
