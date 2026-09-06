export const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

export const fmtIDR = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const pad = (n) => String(n).padStart(2, '0');

export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toISODate(new Date());

export const currentMonthKey = () => todayISO().slice(0, 7);

export const daysAgoISO = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return toISODate(d);
};

export const dayOfMonthISO = (day) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), Math.min(day, 28));
    return toISODate(d);
};

const hashRecurringIdPart = (value, seed) => {
    let hash = seed;
    for (let index = 0; index < value.length; index += 1) {
        hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
};

export const recurringTransactionId = (ruleId, date) => {
    const input = `${ruleId}:${date}`;
    const hex = [2166136261, 2246822519, 3266489917, 668265263]
        .map((seed) => hashRecurringIdPart(input, seed))
        .join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

export const formatDateID = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} ${MONTHS_ID[m - 1]} ${y}`;
};

export const formatMonthYear = (iso) => {
    if (!iso) return '';
    const [y, m] = iso.split('-').map(Number);
    return `${MONTHS_ID[m - 1]} ${y}`;
};

export const monthsUntil = (iso) => {
    if (!iso) return 0;
    const [y, m] = iso.split('-').map(Number);
    const now = new Date();
    return Math.max(0, (y - now.getFullYear()) * 12 + (m - 1) - now.getMonth());
};

export const addYearsISO = (n) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + n);
    return toISODate(d);
};

export const monthKeyOf = (iso) => (iso || '').slice(0, 7);

export const advanceISO = (iso, frequency, anchorDay = null) => {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (frequency === 'daily') date.setDate(date.getDate() + 1);
    else if (frequency === 'weekly') date.setDate(date.getDate() + 7);
    else {
        const nextMonth = date.getMonth() + 1;
        const lastDayOfNextMonth = new Date(date.getFullYear(), nextMonth + 1, 0).getDate();
        const scheduledDay = Number.isInteger(anchorDay) ? anchorDay : date.getDate();
        return toISODate(new Date(
            date.getFullYear(),
            nextMonth,
            Math.min(scheduledDay, lastDayOfNextMonth),
        ));
    }
    return toISODate(date);
};

export const FREQ_LABELS = { daily: 'Setiap Hari', weekly: 'Mingguan', monthly: 'Bulanan' };

export const uid = () =>
    (window.crypto && window.crypto.randomUUID)
        ? window.crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
