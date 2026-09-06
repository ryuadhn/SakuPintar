import React, { useEffect, useRef, useState } from 'react';
import Modal from '../Components/UI/Modal';
import Input from '../Components/UI/Input';
import Button from '../Components/UI/Button';
import { useFinance } from '../Store/FinanceContext';
import { FREQ_LABELS, todayISO } from '../Utils/format';

export default function RecurringModal({ isOpen, onClose }) {
    const {
        categories,
        wallets,
        addRecurringRule,
        calendarBusy,
        syncLoading,
        calendarError,
        clearCalendarError,
    } = useFinance();

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [categoryId, setCategoryId] = useState('');
    const [walletId, setWalletId] = useState('');
    const [frequency, setFrequency] = useState('monthly');
    const [startDate, setStartDate] = useState(todayISO());
    const [errors, setErrors] = useState({});
    const formRef = useRef(null);
    const formBusy = calendarBusy || syncLoading;

    useEffect(() => {
        if (!isOpen) return;
        clearCalendarError();
        setTitle('');
        setAmount('');
        setType('expense');
        setCategoryId(categories.find((c) => c.type === 'expense')?.id || '');
        setWalletId(wallets[0]?.id || '');
        setFrequency('monthly');
        setStartDate(todayISO());
        setErrors({});
    }, [isOpen, categories, wallets, clearCalendarError]);

    const relevantCategories = categories.filter((c) => c.type === type);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!title.trim()) errs.title = 'Nama wajib diisi';
        const amt = Number(amount);
        if (!amount || Number.isNaN(amt) || amt <= 0) errs.amount = 'Nominal harus lebih dari 0';
        if (!categoryId) errs.categoryId = 'Pilih kategori';
        if (!startDate) errs.startDate = 'Tanggal mulai wajib diisi';
        setErrors(errs);
        if (Object.keys(errs).length > 0) {
            window.setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0);
            return;
        }

        const saved = await addRecurringRule({
            title: title.trim(),
            amount: amt,
            type,
            categoryId,
            walletId,
            frequency,
            nextDate: startDate,
        });
        if (saved) onClose();
    };

    const selectClass = "block min-h-[44px] w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-emerald-500";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Aturan Transaksi Rutin">
            <form ref={formRef} className="space-y-4" onSubmit={handleSubmit} noValidate>
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    Transaksi akan dicatat otomatis sesuai jadwal saat aplikasi dibuka.
                </p>

                {calendarError && (
                    <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold leading-relaxed text-rose-800">
                        {calendarError}
                    </p>
                )}

                <Input
                    label="Nama"
                    id="recurring-title"
                    data-autofocus="true"
                    placeholder="Contoh: Tagihan Internet"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={formBusy}
                    error={errors.title}
                    required
                />
                <Input
                    label="Nominal (Rupiah)"
                    id="recurring-amount"
                    type="number"
                    min="1"
                    placeholder="Contoh: 350000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={formBusy}
                    error={errors.amount}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="recurring-type" className="block text-sm font-semibold text-slate-700 mb-1.5">Tipe</label>
                        <select id="recurring-type" className={selectClass} value={type} onChange={(e) => { setType(e.target.value); setCategoryId(''); }} disabled={formBusy}>
                            <option value="expense">Pengeluaran</option>
                            <option value="income">Pemasukan</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="recurring-category" className="block text-sm font-semibold text-slate-700 mb-1.5">Kategori</label>
                        <select
                            id="recurring-category"
                            className={selectClass}
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            disabled={formBusy}
                            aria-invalid={errors.categoryId ? 'true' : undefined}
                            aria-describedby={errors.categoryId ? 'recurring-category-error' : undefined}
                            required
                        >
                            <option value="">Pilih kategori...</option>
                            {(relevantCategories.length > 0 ? relevantCategories : categories).map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.categoryId && <p id="recurring-category-error" role="alert" className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="recurring-wallet" className="block text-sm font-semibold text-slate-700 mb-1.5">Dompet</label>
                        <select id="recurring-wallet" className={selectClass} value={walletId} onChange={(e) => setWalletId(e.target.value)} disabled={formBusy}>
                            {wallets.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="recurring-frequency" className="block text-sm font-semibold text-slate-700 mb-1.5">Frekuensi</label>
                        <select id="recurring-frequency" className={selectClass} value={frequency} onChange={(e) => setFrequency(e.target.value)} disabled={formBusy}>
                            {Object.entries(FREQ_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <Input
                    label="Mulai Tanggal"
                    id="recurring-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={formBusy}
                    error={errors.startDate}
                    required
                />

                <div className="flex gap-3 justify-end pt-2">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={formBusy} className="px-5 py-2.5 disabled:pointer-events-none disabled:opacity-60">Batal</Button>
                    <Button type="submit" variant="primary" disabled={formBusy} className="px-5 py-2.5 bg-emerald-600 disabled:pointer-events-none disabled:opacity-60">
                        {syncLoading ? 'Memuat...' : calendarBusy ? 'Menyimpan...' : 'Simpan Aturan'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
