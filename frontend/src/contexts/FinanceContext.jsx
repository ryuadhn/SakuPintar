import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../store/supabaseClient';
import { useAuth } from './AuthContext';
import { DEFAULT_CATEGORIES, createFreshFinanceState, normalizeFinanceState } from './financeState';
import { advanceISO, currentMonthKey, FREQ_LABELS, monthKeyOf, recurringTransactionId, todayISO, uid } from '../utils/format';

const STORAGE_KEY = 'sakupintar_finance_v1';
const RECURRING_METADATA_KEY = 'sakupintar_recurring_metadata_v1';
const CATEGORY_STORAGE_KEY = 'sakupintar_categories_v1';
const REMINDER_PRIORITIES = new Set(['low', 'medium', 'high']);

const financeStorageKey = (userId) => `${STORAGE_KEY}_${userId}`;
const categoryStorageKey = (userId) => `${CATEGORY_STORAGE_KEY}_${userId}`;

const readStoredCategories = (userId) => {
    if (!userId) return null;
    try {
        const raw = localStorage.getItem(categoryStorageKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        console.warn('Sakuta: gagal membaca kategori tersimpan.', error);
        return null;
    }
};

const writeStoredCategories = (userId, categories) => {
    if (!userId) return;
    try {
        localStorage.setItem(categoryStorageKey(userId), JSON.stringify(categories));
    } catch (error) {
        console.warn('Sakuta: gagal menyimpan kategori.', error);
    }
};

const normalizeReminderPriority = (priority) => (
    REMINDER_PRIORITIES.has(priority) ? priority : null
);

const readRecurringMetadata = (userId) => {
    if (!userId) return {};
    try {
        const raw = localStorage.getItem(RECURRING_METADATA_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed[userId] || {};
    } catch (error) {
        console.warn('Sakuta: gagal membaca metadata aturan rutin.', error);
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
        console.warn('Sakuta: gagal menyimpan metadata aturan rutin.', error);
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
        console.warn('Sakuta: gagal menghapus metadata aturan rutin.', error);
    }
};

const clearRecurringMetadata = (userId) => {
    if (!userId) return;
    try {
        const raw = localStorage.getItem(RECURRING_METADATA_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        delete parsed[userId];
        localStorage.setItem(RECURRING_METADATA_KEY, JSON.stringify(parsed));
    } catch (error) {
        console.error('Sakuta: gagal menghapus metadata aturan rutin.', error);
        throw error;
    }
};

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

const updateSavingsGoalForUser = async (goalId, userId, changes) => {
    const ownedResponse = await supabase.from('savings_goals')
        .update(changes)
        .eq('id', goalId)
        .eq('user_id', userId)
        .select('id');
    if (ownedResponse.error) throw ownedResponse.error;
    if (ownedResponse.data && ownedResponse.data.length > 0) return ownedResponse.data;

    // Shared goals are authorized by an active membership scoped to this user.
    const membershipResponse = await supabase.from('savings_goal_collaborators')
        .select('savings_goal_id')
        .eq('savings_goal_id', goalId)
        .eq('user_id', userId)
        .maybeSingle();
    if (membershipResponse.error) throw membershipResponse.error;
    if (!membershipResponse.data) throw new Error('Target tabungan tidak ditemukan atau tidak dapat diakses.');

    const sharedResponse = await supabase.from('savings_goals')
        .update(changes)
        .eq('id', goalId)
        .select('id');
    if (sharedResponse.error) throw sharedResponse.error;
    return sharedResponse.data;
};

const loadInitialState = (userId) => {
    if (!userId) return createFreshFinanceState();
    try {
        // Never reuse the pre-user-scoped finance cache from older builds.
        localStorage.removeItem(STORAGE_KEY);
        const raw = localStorage.getItem(financeStorageKey(userId));
        if (raw) {
            return normalizeFinanceState(JSON.parse(raw));
        }
    } catch (e) {
        console.warn('Sakuta: gagal membaca data tersimpan.', e);
    }
    return createFreshFinanceState();
};

export function FinanceProvider({ children }) {
    const [state, setState] = useState(createFreshFinanceState);
    const { user } = useAuth();
    const [stateUserId, setStateUserId] = useState(null);
    const [syncAttempt, setSyncAttempt] = useState(0);
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncError, setSyncError] = useState('');
    const [calendarOperation, setCalendarOperation] = useState(null);
    const [calendarError, setCalendarError] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetBusy, setResetBusy] = useState(false);
    const syncRequestRef = useRef(0);
    const operationEpochRef = useRef(0);
    const activeUserIdRef = useRef(null);
    const resetBusyRef = useRef(false);
    const resetRecoveryUserIdRef = useRef(null);
    const pendingMutationsRef = useRef(new Set());
    activeUserIdRef.current = user?.id || null;
    const activeUserEmail = user?.email?.trim().toLowerCase() || '';
    const captureOperation = () => ({ userId: user?.id || null, epoch: operationEpochRef.current });
    const operationIsCurrent = (operation) => (
        operation.epoch === operationEpochRef.current && operation.userId === activeUserIdRef.current
    );
    const runRemoteMutation = (callback, allowDuringReset = false) => {
        if (resetBusyRef.current && !allowDuringReset) return false;
        if (!isSupabaseConfigured || !user) return callback();
        const token = { promise: null };
        pendingMutationsRef.current.add(token);
        const promise = Promise.resolve().then(callback);
        token.promise = promise;
        promise.then(
            () => pendingMutationsRef.current.delete(token),
            () => pendingMutationsRef.current.delete(token),
        );
        return promise;
    };
    const waitForRemoteMutations = async () => {
        while (pendingMutationsRef.current.size > 0) {
            await Promise.allSettled(
                [...pendingMutationsRef.current].map(({ promise }) => promise)
            );
        }
    };

    const visibleState = useMemo(
        () => (user && stateUserId === user.id ? state : createFreshFinanceState()),
        [state, stateUserId, user]
    );
    const { wallets, categories, transactions, budgets, recurringRules, reminders = [], savingsGoals, invitations = [] } = visibleState;

    const retrySync = useCallback(() => setSyncAttempt((attempt) => attempt + 1), []);
    const clearCalendarError = useCallback(() => setCalendarError(''), []);
    const clearResetError = useCallback(() => setResetError(''), []);

    useEffect(() => {
        setResetError('');
    }, [user?.id]);

    // ─── LocalStorage Fallback Backup ───
    useEffect(() => {
        if (isSupabaseConfigured || !user || stateUserId !== user.id) return;
        try {
            localStorage.setItem(financeStorageKey(user.id), JSON.stringify(state));
        } catch (e) {
            console.warn('Sakuta: gagal menyimpan data.', e);
        }
    }, [state, stateUserId, user]);

    // ─── Supabase Data Sync Loader ───
    useEffect(() => {
        if (resetRecoveryUserIdRef.current !== null
            && resetRecoveryUserIdRef.current !== (user?.id || null)) {
            resetRecoveryUserIdRef.current = null;
            resetBusyRef.current = false;
            setResetBusy(false);
        }

        const requestId = syncRequestRef.current + 1;
        syncRequestRef.current = requestId;
        operationEpochRef.current += 1;
        let cancelled = false;
        const isStale = () => cancelled || requestId !== syncRequestRef.current;

        setStateUserId(null);
        setState(createFreshFinanceState());
        setSyncError('');
        setCalendarOperation(null);
        setCalendarError('');

        if (!user) {
            setSyncLoading(false);
            return () => {
                cancelled = true;
            };
        }

        if (!isSupabaseConfigured) {
            try {
                const localState = processRecurring(loadInitialState(user.id)).state;
                if (!isStale()) {
                    setState(localState);
                    setStateUserId(user.id);
                }
            } catch (error) {
                console.error('Sakuta: gagal memuat data lokal.', error);
                setSyncError('Data lokal tidak dapat dimuat. Coba lagi.');
            } finally {
                if (!isStale()) setSyncLoading(false);
            }
            return () => {
                cancelled = true;
            };
        }

        const fetchSupabaseData = async () => {
            const userId = user.id;
            const recurringMetadata = readRecurringMetadata(userId);
            let syncSucceeded = false;
            setSyncLoading(true);

            try {
                const responses = await Promise.all([
                    supabase.from('wallets').select('*').eq('user_id', userId),
                    supabase.from('transactions').select('*').eq('user_id', userId),
                    supabase.from('category_budgets').select('*').eq('user_id', userId),
                    supabase.from('savings_goals').select('*').eq('user_id', userId),
                    supabase.from('recurring_rules').select('*').eq('user_id', userId),
                    supabase.from('reminders').select('*').eq('user_id', userId),
                    supabase.from('savings_goal_invitations').select('*').eq('invitee_email', activeUserEmail),
                    supabase.from('savings_goal_collaborators').select('savings_goal_id').eq('user_id', userId)
                ]);

                const responseError = responses.find((response) => response.error)?.error;
                if (responseError) throw responseError;
                if (isStale()) return;

                const [walletsResponse, txnsResponse, budgetsResponse, savingsResponse, rulesResponse, remindersResponse, invitationsResponse, collaboratorsResponse] = responses;
                const walletsData = Array.isArray(walletsResponse.data) ? walletsResponse.data : [];
                const txnsData = Array.isArray(txnsResponse.data) ? txnsResponse.data : [];
                const budgetsData = Array.isArray(budgetsResponse.data) ? budgetsResponse.data : [];
                const savingsData = Array.isArray(savingsResponse.data) ? savingsResponse.data : [];
                const rulesData = Array.isArray(rulesResponse.data) ? rulesResponse.data : [];
                const remindersData = Array.isArray(remindersResponse.data) ? remindersResponse.data : [];
                const invsData = Array.isArray(invitationsResponse.data) ? invitationsResponse.data : [];
                const collaboratorGoalIds = (collaboratorsResponse.data || []).map((item) => item.savings_goal_id);
                let sharedSavingsData = [];
                if (collaboratorGoalIds.length > 0) {
                    const sharedGoalsResponse = await supabase.from('savings_goals')
                        .select('*')
                        .in('id', collaboratorGoalIds);
                    if (sharedGoalsResponse.error) throw sharedGoalsResponse.error;
                    sharedSavingsData = sharedGoalsResponse.data || [];
                }
                const storedCategories = readStoredCategories(userId);

                const budgetsObj = {};
                budgetsData.forEach((b) => {
                    budgetsObj[b.category_id] = Number(b.limit_amount);
                });

                const remoteState = {
                    wallets: walletsData.map(w => ({ id: w.id, name: w.name, color: w.color, initialBalance: Number(w.balance) })),
                    categories: storedCategories ?? DEFAULT_CATEGORIES.map((category) => ({ ...category })),
                    transactions: txnsData.map(t => ({
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
                    })),
                    budgets: budgetsObj,
                    recurringRules: rulesData.map(r => ({
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
                    })),
                    reminders: remindersData.map(r => ({
                        id: r.id,
                        title: r.title,
                        date: r.date,
                        time: r.time,
                        type: r.type,
                        notes: r.notes,
                        priority: normalizeReminderPriority(r.priority),
                        isCompleted: Boolean(r.is_completed),
                        amount: r.amount === null || r.amount === undefined ? null : Number(r.amount),
                        createdAt: r.created_at,
                        updatedAt: r.updated_at
                    })),
                    savingsGoals: [...savingsData, ...sharedSavingsData]
                        .filter((goal, index, allGoals) => allGoals.findIndex((item) => item.id === goal.id) === index)
                        .map(g => ({
                        id: g.id,
                        title: g.title,
                        target: Number(g.target),
                        current: Number(g.current),
                        deadlineISO: g.deadline_iso,
                        history: g.history || [],
                        isShared: g.is_shared,
                        partnerEmail: g.partner_email
                    })),
                    invitations: invsData.map(inv => ({
                        id: inv.id,
                        goalId: inv.goal_id,
                        inviterName: inv.inviter_name,
                        inviterEmail: inv.inviter_email,
                        inviteeEmail: inv.invitee_email,
                        goalTitle: inv.goal_title,
                        status: inv.status
                    }))
                };
                const processed = processRecurring(remoteState);
                if (isStale()) return;
                setState(processed.state);
                setStateUserId(userId);
                try {
                    await runRemoteMutation(() => persistRecurringChanges(userId, processed), true);
                    if (isStale()) return;
                } catch (error) {
                    try {
                        await rollbackPersistedRecurringChanges(userId, processed);
                    } catch (rollbackError) {
                        console.error('Sakuta: gagal membatalkan transaksi rutin yang tersimpan.', rollbackError);
                    }
                    if (isStale()) return;
                    setState(remoteState);
                    setStateUserId(userId);
                    throw error;
                }
                syncSucceeded = true;
            } catch (error) {
                if (isStale()) return;
                console.error('Sakuta: gagal memuat data dari Supabase.', error);
                setSyncError('Data kalender dan tugas tidak dapat dimuat. Periksa koneksi Anda lalu coba lagi.');
                if (resetRecoveryUserIdRef.current === userId) {
                    setResetError('Pemulihan data setelah reset gagal. Periksa koneksi Anda lalu coba sinkronisasi lagi.');
                }
            } finally {
                if (!isStale()) setSyncLoading(false);
                if (!isStale() && syncSucceeded && resetRecoveryUserIdRef.current === userId) {
                    resetRecoveryUserIdRef.current = null;
                    resetBusyRef.current = false;
                    setResetBusy(false);
                }
            }
        };

        fetchSupabaseData();
        return () => {
            cancelled = true;
        };
    }, [user, syncAttempt]);

    const categoryById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
    const walletById = useMemo(() => Object.fromEntries(wallets.map((w) => [w.id, w])), [wallets]);

    const sortedTransactions = useMemo(
        () => [...transactions].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
        [transactions]
    );

    const addTransaction = useCallback((data) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const newId = uid();
        const transaction = { ...data, id: newId };
        setState((s) => ({ ...s, transactions: [transaction, ...s.transactions] }));

        if (!isSupabaseConfigured || !user) return true;

        try {
            const { error } = await supabase.from('transactions').insert([{
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
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Sakuta: gagal menyimpan transaksi.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== newId) }));
            setSyncError('Transaksi gagal disimpan. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user]);

    const updateTransaction = useCallback((id, data) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const previousTransaction = transactions.find((transaction) => transaction.id === id);
        if (!previousTransaction) return false;
        setState((s) => ({ ...s, transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...data } : t)) }));

        if (!isSupabaseConfigured || !user) return true;

        try {
            const { data: updatedTransactions, error } = await supabase.from('transactions').update({
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
            }).eq('id', id).eq('user_id', user.id).select('id');
            if (error) throw error;
            if (!updatedTransactions || updatedTransactions.length === 0) throw new Error('Transaksi tidak ditemukan atau tidak dapat diakses.');
            return true;
        } catch (error) {
            console.error('Sakuta: gagal memperbarui transaksi.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({
                ...s,
                transactions: s.transactions.map((transaction) => (
                    transaction.id === id ? previousTransaction : transaction
                )),
            }));
            setSyncError('Transaksi gagal diperbarui. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user, transactions]);

    const deleteTransaction = useCallback((id) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const previousTransaction = transactions.find((transaction) => transaction.id === id);
        if (!previousTransaction) return false;
        setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));

        if (!isSupabaseConfigured || !user) return true;

        try {
            const { data: deletedTransactions, error } = await supabase.from('transactions')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id)
                .select('id');
            if (error) throw error;
            if (!deletedTransactions || deletedTransactions.length === 0) throw new Error('Transaksi tidak ditemukan atau tidak dapat diakses.');
            return true;
        } catch (error) {
            console.error('Sakuta: gagal menghapus transaksi.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({ ...s, transactions: [...s.transactions, previousTransaction] }));
            setSyncError('Transaksi gagal dihapus. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user, transactions]);

    const addTransfer = useCallback(({ fromWalletId, toWalletId, amount, title, date, time, note }) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
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

        if (!isSupabaseConfigured || !user) return true;

        try {
            const { error } = await supabase.from('transactions').insert([{
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
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Sakuta: gagal menyimpan transfer.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({ ...s, transactions: s.transactions.filter((transaction) => transaction.id !== newId) }));
            setSyncError('Transfer gagal disimpan. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user]);

    const addWallet = useCallback(({ name, color, initialBalance }) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const newId = uid();
        const wallet = {
            id: newId,
            name: name.trim(),
            color,
            initialBalance: Number(initialBalance) || 0,
        };
        setState((s) => ({ ...s, wallets: [...s.wallets, wallet] }));

        if (!isSupabaseConfigured || !user) return true;

        try {
            const { error } = await supabase.from('wallets').insert([{
                id: newId,
                user_id: user.id,
                name: wallet.name,
                color: wallet.color,
                balance: wallet.initialBalance
            }]);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Sakuta: gagal menyimpan dompet.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({ ...s, wallets: s.wallets.filter((item) => item.id !== newId) }));
            setSyncError('Dompet gagal disimpan. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user]);

    const updateWallet = useCallback((id, data) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const previousWallet = wallets.find((wallet) => wallet.id === id);
        if (!previousWallet) return false;
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

        if (!isSupabaseConfigured || !user) return true;

        try {
            const { data: updatedWallets, error } = await supabase.from('wallets').update({
                name: data.name?.trim(),
                color: data.color,
                balance: data.initialBalance ? Number(data.initialBalance) : undefined
            }).eq('id', id).eq('user_id', user.id).select('id');
            if (error) throw error;
            if (!updatedWallets || updatedWallets.length === 0) throw new Error('Dompet tidak ditemukan atau tidak dapat diakses.');
            return true;
        } catch (error) {
            console.error('Sakuta: gagal memperbarui dompet.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({
                ...s,
                wallets: s.wallets.map((wallet) => wallet.id === id ? previousWallet : wallet),
            }));
            setSyncError('Dompet gagal diperbarui. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user, wallets]);

    const deleteWallet = useCallback((id) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const previousWallet = wallets.find((wallet) => wallet.id === id);
        if (!previousWallet) return false;
        setState((s) => ({
            ...s,
            wallets: s.wallets.filter((w) => w.id !== id),
        }));

        if (!isSupabaseConfigured || !user) return true;

        try {
            const { data: deletedWallets, error } = await supabase.from('wallets')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id)
                .select('id');
            if (error) throw error;
            if (!deletedWallets || deletedWallets.length === 0) throw new Error('Dompet tidak ditemukan atau tidak dapat diakses.');
            return true;
        } catch (error) {
            console.error('Sakuta: gagal menghapus dompet.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({ ...s, wallets: [...s.wallets, previousWallet] }));
            setSyncError('Dompet gagal dihapus. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user, wallets]);

    const addCategory = useCallback(({ name, type, iconKey, budget }) => {
        if (resetBusyRef.current) return false;
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
        const categoryType = type || 'expense';
        const cat = {
            id: uid(),
            name,
            type: categoryType,
            iconKey: iconKey || (categoryType === 'income' ? 'income' : 'wallet'),
            color: palette[idx],
            badge: badgePalette[idx],
        };
        const nextCategories = [...categories, cat];
        if (isSupabaseConfigured && user) writeStoredCategories(user.id, nextCategories);
        setState((s) => ({
            ...s,
            categories: [...s.categories, cat],
            budgets: budget && cat.type === 'expense' ? { ...s.budgets, [cat.id]: Number(budget) } : s.budgets,
        }));
    }, [user, categories]);

    const updateCategory = useCallback((id, data) => {
        if (resetBusyRef.current) return false;
        const nextCategories = categories.map((category) => (category.id === id ? {
            ...category,
            name: data.name ?? category.name,
            iconKey: data.iconKey ?? category.iconKey,
        } : category));
        if (isSupabaseConfigured && user) writeStoredCategories(user.id, nextCategories);
        setState((s) => {
            const budgetsNext = { ...s.budgets };
            if (data.budget === null || data.budget === '' || data.budget === undefined) delete budgetsNext[id];
            else budgetsNext[id] = Number(data.budget);
            return {
                ...s,
                budgets: budgetsNext,
                categories: nextCategories,
            };
        });
    }, [user, categories]);

    const deleteCategory = useCallback((id) => {
        if (resetBusyRef.current) return false;
        const nextCategories = categories.filter((category) => category.id !== id);
        if (isSupabaseConfigured && user) writeStoredCategories(user.id, nextCategories);
        setState((s) => {
            const budgetsNext = { ...s.budgets };
            delete budgetsNext[id];
            return {
                ...s,
                budgets: budgetsNext,
                categories: nextCategories,
                recurringRules: s.recurringRules.filter((r) => r.categoryId !== id),
            };
        });
    }, [user, categories]);

    const setBudget = useCallback((categoryId, limit) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const previousBudget = budgets[categoryId];
        setState((s) => {
            const budgetsNext = { ...s.budgets };
            if (!limit) delete budgetsNext[categoryId];
            else budgetsNext[categoryId] = Number(limit);
            return { ...s, budgets: budgetsNext };
        });

        if (!isSupabaseConfigured || !user) return true;

        try {
            if (!limit) {
                const { error } = await supabase.from('category_budgets')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('category_id', categoryId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('category_budgets').upsert([{
                    user_id: user.id,
                    category_id: categoryId,
                    limit_amount: Number(limit),
                    month_key: currentMonthKey()
                }], { onConflict: 'user_id,category_id,month_key' });
                if (error) throw error;
            }
            return true;
        } catch (error) {
            console.error('Sakuta: gagal menyimpan anggaran kategori.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => {
                const budgetsNext = { ...s.budgets };
                if (previousBudget === undefined) delete budgetsNext[categoryId];
                else budgetsNext[categoryId] = previousBudget;
                return { ...s, budgets: budgetsNext };
            });
            setSyncError('Anggaran gagal disimpan. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user, budgets]);

    const addRecurringRule = useCallback((data) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
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
            if (!operationIsCurrent(operation)) return false;
            let persistedRule = null;
            try {
                        const response = await supabase.from('recurring_rules')
                            .select('id')
                            .eq('id', newId)
                            .eq('user_id', user.id)
                            .maybeSingle();
                persistedRule = response.data;
                if (!operationIsCurrent(operation)) return false;
            } catch (lookupError) {
                console.error('Sakuta: gagal memverifikasi aturan rutin.', lookupError);
            }
            if (persistedRule) return true;
            console.error('Sakuta: gagal menyimpan aturan rutin.', error);
            removeRecurringMetadata(user.id, newId);
            setState((s) => ({ ...s, recurringRules: s.recurringRules.filter((r) => r.id !== newId) }));
            setCalendarError('Aturan rutin gagal disimpan. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            if (operationIsCurrent(operation)) setCalendarOperation(null);
        }
        });
    }, [user]);

    const toggleRecurringRule = useCallback((id) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
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
            console.error('Sakuta: gagal mengubah status aturan rutin.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({
                    ...s,
                    recurringRules: s.recurringRules.map((rule) => (
                    rule.id === id ? previousRule : rule
                )),
            }));
            setCalendarError('Status aturan rutin gagal disimpan. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            if (operationIsCurrent(operation)) setCalendarOperation(null);
        }
        });
    }, [user, recurringRules]);

    const deleteRecurringRule = useCallback((id) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
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
            console.error('Sakuta: gagal menghapus aturan rutin.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => {
                if (s.recurringRules.some((rule) => rule.id === id)) return s;
                const rules = [...s.recurringRules];
                rules.splice(Math.min(previousIndex, rules.length), 0, previousRule);
                return { ...s, recurringRules: rules };
            });
            setCalendarError('Aturan rutin gagal dihapus. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            if (operationIsCurrent(operation)) setCalendarOperation(null);
        }
        });
    }, [user, recurringRules]);

    const addReminder = useCallback((data) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const newId = uid();
        const reminder = {
            id: newId,
            title: String(data.title || '').trim(),
            date: data.date,
            time: data.time || null,
            type: data.type,
            notes: data.notes ? String(data.notes).trim() : null,
            priority: data.type === 'task' ? normalizeReminderPriority(data.priority) : null,
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
                priority: reminder.priority,
                is_completed: false,
                amount: reminder.amount,
            }]);
            if (error) throw error;
            return true;
        } catch (error) {
            if (!operationIsCurrent(operation)) return false;
            let persistedReminder = null;
            try {
                const response = await supabase.from('reminders')
                    .select('id')
                    .eq('id', newId)
                    .eq('user_id', user.id)
                    .maybeSingle();
                persistedReminder = response.data;
                if (!operationIsCurrent(operation)) return false;
            } catch (lookupError) {
                console.error('Sakuta: gagal memverifikasi pengingat.', lookupError);
            }
            if (persistedReminder) return true;
                console.error('Sakuta: gagal menyimpan pengingat.', error);
            setState((s) => ({ ...s, reminders: (s.reminders || []).filter((item) => item.id !== newId) }));
            setCalendarError('Pengingat gagal disimpan. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            if (operationIsCurrent(operation)) setCalendarOperation(null);
        }
        });
    }, [user]);

    const updateReminder = useCallback((id, data) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const previousReminder = reminders.find((reminder) => reminder.id === id);
        if (!previousReminder) return false;
        const changes = {
            title: String(data.title || '').trim(),
            date: data.date,
            time: data.time || null,
            type: data.type,
            notes: data.notes ? String(data.notes).trim() : null,
            priority: data.type === 'task' ? normalizeReminderPriority(data.priority) : null,
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
                priority: changes.priority,
                amount: changes.amount,
                ...(data.isCompleted === undefined ? {} : { is_completed: data.isCompleted }),
            }).eq('id', id).eq('user_id', user.id).select('id');
            if (error) throw error;
            if (!updatedReminders || updatedReminders.length === 0) throw new Error('Pengingat tidak ditemukan.');
            return true;
        } catch (error) {
            console.error('Sakuta: gagal memperbarui pengingat.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({
                ...s,
                reminders: (s.reminders || []).map((reminder) => (
                    reminder.id === id ? previousReminder : reminder
                )),
            }));
            setCalendarError('Pengingat gagal diperbarui. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            if (operationIsCurrent(operation)) setCalendarOperation(null);
        }
        });
    }, [user, reminders]);

    const toggleReminder = useCallback((id) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
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
            console.error('Sakuta: gagal mengubah status pengingat.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({
                ...s,
                reminders: (s.reminders || []).map((reminder) => (
                    reminder.id === id ? previousReminder : reminder
                )),
            }));
            setCalendarError('Status pengingat gagal disimpan. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            if (operationIsCurrent(operation)) setCalendarOperation(null);
        }
        });
    }, [user, reminders]);

    const deleteReminder = useCallback((id) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
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
            console.error('Sakuta: gagal menghapus pengingat.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => {
                if ((s.reminders || []).some((reminder) => reminder.id === id)) return s;
                const nextReminders = [...(s.reminders || [])];
                nextReminders.splice(Math.min(previousIndex, nextReminders.length), 0, previousReminder);
                return { ...s, reminders: nextReminders };
            });
            setCalendarError('Pengingat gagal dihapus. Periksa koneksi Anda lalu coba lagi.');
            return false;
        } finally {
            if (operationIsCurrent(operation)) setCalendarOperation(null);
        }
        });
    }, [user, reminders]);

    const addSavingsGoal = useCallback((data) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const newId = uid();
        const history = data.current > 0 ? [{ id: uid(), date: todayISO(), amount: data.current, note: 'Saldo Awal' }] : [];
        const goal = { ...data, id: newId, history };
        setState((s) => ({ ...s, savingsGoals: [...s.savingsGoals, goal] }));

        if (!isSupabaseConfigured || !user) return true;

        try {
            const { error } = await supabase.from('savings_goals').insert([{
                id: newId,
                user_id: user.id,
                title: data.title,
                target: Number(data.target),
                current: Number(data.current),
                deadline_iso: data.deadlineISO,
                history: history
            }]);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Sakuta: gagal menyimpan target tabungan.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({ ...s, savingsGoals: s.savingsGoals.filter((item) => item.id !== newId) }));
            setSyncError('Target tabungan gagal disimpan. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user]);

    const deleteSavingsGoal = useCallback((id) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const previousGoal = savingsGoals.find((goal) => goal.id === id);
        if (!previousGoal) return false;
        setState((s) => ({ ...s, savingsGoals: s.savingsGoals.filter((g) => g.id !== id) }));

        if (!isSupabaseConfigured || !user) return true;

        try {
            const { data: deletedGoals, error } = await supabase.from('savings_goals')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id)
                .select('id');
            if (error) throw error;
            if (!deletedGoals || deletedGoals.length === 0) throw new Error('Target tabungan tidak ditemukan atau tidak dapat diakses.');
            return true;
        } catch (error) {
            console.error('Sakuta: gagal menghapus target tabungan.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({ ...s, savingsGoals: [...s.savingsGoals, previousGoal] }));
            setSyncError('Target tabungan gagal dihapus. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user, savingsGoals]);

    const addSavingsGoalDeposit = useCallback((goalId, deposit) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const previousGoal = savingsGoals.find((goal) => goal.id === goalId);
        if (!previousGoal) return false;
        const newDeposit = { ...deposit, id: uid() };
        const goalNext = {
            ...previousGoal,
            current: previousGoal.current + deposit.amount,
            history: [newDeposit, ...(previousGoal.history || [])],
        };

        setState((s) => ({
            ...s,
            savingsGoals: s.savingsGoals.map((goal) => goal.id === goalId ? goalNext : goal),
        }));

        if (!isSupabaseConfigured || !user) return true;

        try {
            const updatedGoals = await updateSavingsGoalForUser(goalId, user.id, {
                current: goalNext.current,
                history: goalNext.history
            });
            if (!updatedGoals || updatedGoals.length === 0) throw new Error('Target tabungan tidak ditemukan atau tidak dapat diakses.');
            return true;
        } catch (error) {
            console.error('Sakuta: gagal menyimpan setoran target tabungan.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({
                ...s,
                savingsGoals: s.savingsGoals.map((goal) => goal.id === goalId ? previousGoal : goal),
            }));
            setSyncError('Setoran target tabungan gagal disimpan. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user, savingsGoals]);

    const deleteSavingsGoalDeposit = useCallback((goalId, depositId) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const previousGoal = savingsGoals.find((goal) => goal.id === goalId);
        if (!previousGoal) return false;
        const depositToDelete = (previousGoal.history || []).find((deposit) => deposit.id === depositId);
        if (!depositToDelete) return false;
        const goalNext = {
            ...previousGoal,
            current: Math.max(0, previousGoal.current - depositToDelete.amount),
            history: (previousGoal.history || []).filter((deposit) => deposit.id !== depositId),
        };

        setState((s) => ({
            ...s,
            savingsGoals: s.savingsGoals.map((goal) => goal.id === goalId ? goalNext : goal),
        }));

        if (!isSupabaseConfigured || !user) return true;

        try {
            const updatedGoals = await updateSavingsGoalForUser(goalId, user.id, {
                current: goalNext.current,
                history: goalNext.history
            });
            if (!updatedGoals || updatedGoals.length === 0) throw new Error('Target tabungan tidak ditemukan atau tidak dapat diakses.');
            return true;
        } catch (error) {
            console.error('Sakuta: gagal menghapus setoran target tabungan.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({
                ...s,
                savingsGoals: s.savingsGoals.map((goal) => goal.id === goalId ? previousGoal : goal),
            }));
            setSyncError('Setoran target tabungan gagal dihapus. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user, savingsGoals]);

    const updateSavingsGoalSharing = useCallback((goalId, partnerEmail) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const isShared = !!partnerEmail;
        const previousGoal = savingsGoals.find((goal) => goal.id === goalId);
        if (!previousGoal) return false;

        // If stopping collaboration
        if (!isShared) {
            setState((s) => ({
                ...s,
                savingsGoals: s.savingsGoals.map((g) => (g.id === goalId ? { ...g, isShared: false, partnerEmail: null } : g))
            }));

            if (!isSupabaseConfigured || !user) return true;

            try {
                const { error } = await supabase.rpc('stop_savings_goal_sharing', {
                    p_goal_id: goalId,
                });
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Sakuta: gagal menghentikan kolaborasi target tabungan.', error);
                if (!operationIsCurrent(operation)) return false;
                setState((s) => ({
                    ...s,
                    savingsGoals: s.savingsGoals.map((goal) => goal.id === goalId ? {
                        ...goal,
                        isShared: previousGoal?.isShared,
                        partnerEmail: previousGoal?.partnerEmail,
                    } : goal),
                }));
                setSyncError('Kolaborasi target gagal diperbarui. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
                return false;
            }
        }

        // Send an invitation
        const newInv = {
            id: uid(),
            goalId,
            inviterName: user ? user.name : 'Pasangan',
            inviterEmail: activeUserEmail || 'pasangan@email.com',
            inviteeEmail: partnerEmail.trim().toLowerCase(),
            goalTitle: savingsGoals.find(g => g.id === goalId)?.title || 'Target Bersama',
            status: 'pending'
        };
        let goalSharingUpdated = false;

        setState((s) => ({
            ...s,
            savingsGoals: s.savingsGoals.map((goal) => (
                goal.id === goalId
                    ? { ...goal, isShared: true, partnerEmail: newInv.inviteeEmail }
                    : goal
            )),
            invitations: [...(s.invitations || []), newInv]
        }));

        if (!isSupabaseConfigured || !user) return true;

        try {
            const { data: updatedGoals, error: goalError } = await supabase.from('savings_goals')
                .update({ is_shared: true, partner_email: newInv.inviteeEmail })
                .eq('id', goalId)
                .eq('user_id', user.id)
                .select('id');
            if (goalError) throw goalError;
            if (!updatedGoals || updatedGoals.length === 0) throw new Error('Target tabungan tidak ditemukan atau tidak dapat diakses.');
            goalSharingUpdated = true;

            const { error } = await supabase.from('savings_goal_invitations').insert([{
                id: newInv.id,
                goal_id: newInv.goalId,
                inviter_name: newInv.inviterName,
                inviter_email: newInv.inviterEmail,
                invitee_email: newInv.inviteeEmail,
                goal_title: newInv.goalTitle,
                status: 'pending'
            }]);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Sakuta: gagal mengirim undangan kolaborasi.', error);
            if (goalSharingUpdated) {
                try {
                    const { error: goalRollbackError } = await supabase.from('savings_goals')
                        .update({ is_shared: Boolean(previousGoal.isShared), partner_email: previousGoal.partnerEmail || null })
                        .eq('id', goalId)
                        .eq('user_id', user.id);
                    if (goalRollbackError) throw goalRollbackError;
                } catch (rollbackError) {
                    console.error('Sakuta: gagal membatalkan status berbagi target tabungan.', rollbackError);
                }
            }
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({
                ...s,
                savingsGoals: s.savingsGoals.map((goal) => goal.id === goalId ? previousGoal : goal),
                invitations: (s.invitations || []).filter((inv) => inv.id !== newInv.id),
            }));
            setSyncError('Undangan kolaborasi gagal dikirim. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user, savingsGoals]);

    const acceptSavingsGoalInvitation = useCallback((invitationId) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const invitation = invitations.find((inv) => inv.id === invitationId);
        if (!invitation) return false;
        const alreadyExists = savingsGoals.some((goal) => goal.id === invitation.goalId);

        setState((s) => ({
            ...s,
            invitations: (s.invitations || []).map((inv) => (
                inv.id === invitationId ? { ...inv, status: 'accepted' } : inv
            )),
        }));

        if (!isSupabaseConfigured || !user) return true;

        let invitationAcceptedRemotely = false;
        let collaboratorInserted = false;
        try {
            const { data: updatedInvitations, error: invitationUpdateError } = await supabase.from('savings_goal_invitations')
                .update({ status: 'accepted' })
                .eq('id', invitationId)
                .eq('invitee_email', activeUserEmail)
                .select('id');
            if (invitationUpdateError) throw invitationUpdateError;
            if (!updatedInvitations || updatedInvitations.length === 0) throw new Error('Undangan kolaborasi tidak ditemukan atau tidak dapat diakses.');
            invitationAcceptedRemotely = true;

            const { data: inv, error: invitationReadError } = await supabase.from('savings_goal_invitations')
                .select('*')
                .eq('id', invitationId)
                .eq('invitee_email', activeUserEmail)
                .single();
            if (invitationReadError) throw invitationReadError;
            if (!inv) throw new Error('Undangan kolaborasi tidak ditemukan.');

            const { error: collaboratorError } = await supabase.from('savings_goal_collaborators').insert([{
                savings_goal_id: inv.goal_id,
                user_id: user.id
            }]);
            if (collaboratorError) throw collaboratorError;
            collaboratorInserted = true;

            const { data: sharedGoal, error: sharedGoalError } = await supabase.from('savings_goals')
                .select('*')
                .eq('id', inv.goal_id)
                .maybeSingle();
            if (sharedGoalError) throw sharedGoalError;
            if (!sharedGoal) throw new Error('Target kolaborasi tidak ditemukan.');

            const acceptedGoal = {
                id: sharedGoal.id,
                title: sharedGoal.title,
                target: Number(sharedGoal.target),
                current: Number(sharedGoal.current),
                deadlineISO: sharedGoal.deadline_iso,
                history: sharedGoal.history || [],
                isShared: true,
                partnerEmail: sharedGoal.partner_email || invitation.inviterEmail,
            };
            if (!operationIsCurrent(operation)) throw new Error('Sesi pengguna berubah saat menerima undangan.');
            setState((s) => ({
                ...s,
                savingsGoals: alreadyExists
                    ? s.savingsGoals.map((goal) => goal.id === acceptedGoal.id ? acceptedGoal : goal)
                    : [...s.savingsGoals, acceptedGoal],
            }));
            return true;
        } catch (error) {
            console.error('Sakuta: gagal menerima undangan kolaborasi.', error);
            try {
                if (collaboratorInserted) {
                    const { error: collaboratorRollbackError } = await supabase.from('savings_goal_collaborators')
                        .delete()
                        .eq('savings_goal_id', invitation.goalId)
                        .eq('user_id', user.id);
                    if (collaboratorRollbackError) throw collaboratorRollbackError;
                }
                if (invitationAcceptedRemotely) {
                    const { error: invitationRollbackError } = await supabase.from('savings_goal_invitations')
                        .update({ status: 'pending' })
                        .eq('id', invitationId)
                        .eq('invitee_email', activeUserEmail);
                    if (invitationRollbackError) throw invitationRollbackError;
                }
            } catch (rollbackError) {
                console.error('Sakuta: gagal membatalkan penerimaan undangan kolaborasi.', rollbackError);
            }
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({
                ...s,
                invitations: (s.invitations || []).map((inv) => inv.id === invitationId ? invitation : inv),
                savingsGoals: alreadyExists
                    ? s.savingsGoals
                    : s.savingsGoals.filter((goal) => goal.id !== invitation.goalId),
            }));
            setSyncError('Undangan kolaborasi gagal diterima. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user, invitations, savingsGoals]);

    const rejectSavingsGoalInvitation = useCallback((invitationId) => {
        if (resetBusyRef.current) return false;
        return runRemoteMutation(async () => {
            const operation = captureOperation();
        const invitation = invitations.find((inv) => inv.id === invitationId);
        if (!invitation) return false;
        setState((s) => ({
            ...s,
            invitations: (s.invitations || []).filter(inv => inv.id !== invitationId)
        }));

        if (!isSupabaseConfigured || !user) return true;

        try {
            const { data: deletedInvitations, error } = await supabase.from('savings_goal_invitations')
                .delete()
                .eq('id', invitationId)
                .eq('invitee_email', activeUserEmail)
                .select('id');
            if (error) throw error;
            if (!deletedInvitations || deletedInvitations.length === 0) throw new Error('Undangan kolaborasi tidak ditemukan atau tidak dapat diakses.');
            return true;
        } catch (error) {
            console.error('Sakuta: gagal menolak undangan kolaborasi.', error);
            if (!operationIsCurrent(operation)) return false;
            setState((s) => ({ ...s, invitations: [...(s.invitations || []), invitation] }));
            setSyncError('Undangan kolaborasi gagal ditolak. Periksa koneksi dan izin Supabase Anda lalu coba lagi.');
            return false;
        }
        });
    }, [user, invitations]);

    const resetData = useCallback(async () => {
        if (resetBusyRef.current) return false;
        resetBusyRef.current = true;
        setResetBusy(true);
        let recoveryRequired = false;
        setCalendarError('');
        setCalendarOperation(null);
        setResetError('');
        syncRequestRef.current += 1;
        operationEpochRef.current += 1;
        const resetUserId = user?.id || null;
        const resetEpoch = operationEpochRef.current;
        setState(createFreshFinanceState());
        setStateUserId(null);

        try {
            if (isSupabaseConfigured && user) {
                await waitForRemoteMutations();
                const { error } = await supabase.rpc('reset_user_finance_data', {
                    p_user_id: user.id,
                    p_email: activeUserEmail,
                });
                if (error) throw error;
            }

            if (user) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(financeStorageKey(user.id));
                localStorage.removeItem(categoryStorageKey(user.id));
                clearRecurringMetadata(user.id);
            }
        } catch (error) {
            console.error('Sakuta: gagal mereset data.', error);
            if (
                activeUserIdRef.current === resetUserId
                && operationEpochRef.current === resetEpoch
            ) {
                setResetError('Data belum berhasil direset. Periksa koneksi Anda lalu coba lagi.');
            }
            if (isSupabaseConfigured && resetUserId && activeUserIdRef.current === resetUserId) {
                recoveryRequired = true;
                resetRecoveryUserIdRef.current = resetUserId;
                setSyncAttempt((attempt) => attempt + 1);
            }
            return false;
        } finally {
            if (!recoveryRequired) {
                resetBusyRef.current = false;
                setResetBusy(false);
            }
        }

        if (activeUserIdRef.current !== resetUserId || operationEpochRef.current !== resetEpoch) return true;
        setState(createFreshFinanceState());
        setStateUserId(resetUserId);
        setSyncLoading(false);
        setSyncError('');
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
        resetBusy,
        resetError,
        clearResetError,
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
        syncLoading, syncError, retrySync, resetBusy, resetError, clearResetError, calendarBusy, calendarError, clearCalendarError,
    ]);

    return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

const FinanceContext = createContext(null);

export function useFinance() {
    const ctx = useContext(FinanceContext);
    if (!ctx) throw new Error('useFinance harus dipakai di dalam FinanceProvider');
    return ctx;
}
