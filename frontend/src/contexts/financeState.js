export const CATEGORY_LABELS = {
    food: 'Makanan & Minuman',
    transport: 'Transportasi',
    lifestyle: 'Hiburan',
};

export const DEFAULT_CATEGORIES = [
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

const cloneDefaultCategories = () => DEFAULT_CATEGORIES.map((category) => ({ ...category }));

export const createFreshFinanceState = () => ({
    wallets: [],
    categories: cloneDefaultCategories(),
    transactions: [],
    budgets: {},
    recurringRules: [],
    reminders: [],
    savingsGoals: [],
    invitations: [],
});

export const normalizeFinanceState = (parsed) => {
    const fallback = createFreshFinanceState();
    return {
        wallets: Array.isArray(parsed?.wallets) ? parsed.wallets.map((wallet) => ({
            ...wallet,
            name: wallet.id === 'personal' ? 'Kartu Personal' : wallet.name,
        })) : fallback.wallets,
        categories: Array.isArray(parsed?.categories) ? parsed.categories.map((category) => ({
            ...category,
            name: CATEGORY_LABELS[category.id] || category.name,
        })) : fallback.categories,
        transactions: Array.isArray(parsed?.transactions) ? parsed.transactions : fallback.transactions,
        budgets: parsed?.budgets && typeof parsed.budgets === 'object' && !Array.isArray(parsed.budgets)
            ? parsed.budgets
            : fallback.budgets,
        recurringRules: Array.isArray(parsed?.recurringRules) ? parsed.recurringRules : fallback.recurringRules,
        reminders: Array.isArray(parsed?.reminders) ? parsed.reminders : fallback.reminders,
        savingsGoals: Array.isArray(parsed?.savingsGoals) ? parsed.savingsGoals : fallback.savingsGoals,
        invitations: Array.isArray(parsed?.invitations) ? parsed.invitations : fallback.invitations,
    };
};
