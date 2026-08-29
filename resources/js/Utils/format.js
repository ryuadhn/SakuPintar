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

export const advanceISO = (iso, frequency) => {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (frequency === 'daily') date.setDate(date.getDate() + 1);
    else if (frequency === 'weekly') date.setDate(date.getDate() + 7);
    else date.setMonth(date.getMonth() + 1);
    return toISODate(date);
};

export const FREQ_LABELS = { daily: 'Setiap Hari', weekly: 'Mingguan', monthly: 'Bulanan' };

export const uid = () =>
    (window.crypto && window.crypto.randomUUID)
        ? window.crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
