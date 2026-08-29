import React, { useEffect, useState } from 'react';
import Modal from '../Components/UI/Modal';
import Input from '../Components/UI/Input';
import Button from '../Components/UI/Button';
import { useFinance } from '../Store/FinanceContext';
import { FREQ_LABELS, todayISO } from '../Utils/format';

export default function RecurringModal({ isOpen, onClose }) {
    const { categories, wallets, addRecurringRule } = useFinance();

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [categoryId, setCategoryId] = useState('');
    const [walletId, setWalletId] = useState('');
    const [frequency, setFrequency] = useState('monthly');
    const [startDate, setStartDate] = useState(todayISO());
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!isOpen) return;
        setTitle('');
        setAmount('');
        setType('expense');
        setCategoryId(categories.find((c) => c.type === 'expense')?.id || '');
        setWalletId(wallets[0]?.id || '');
        setFrequency('monthly');
        setStartDate(todayISO());
        setErrors({});
    }, [isOpen, categories, wallets]);

    const relevantCategories = categories.filter((c) => c.type === type);

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!title.trim()) errs.title = 'Nama wajib diisi';
        const amt = Number(amount);
        if (!amount || Number.isNaN(amt) || amt <= 0) errs.amount = 'Nominal harus lebih dari 0';
        if (!categoryId) errs.categoryId = 'Pilih kategori';
        if (!startDate) errs.startDate = 'Tanggal mulai wajib diisi';
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        addRecurringRule({
            title: title.trim(),
            amount: amt,
            type,
            categoryId,
            walletId,
            frequency,
            nextDate: startDate,
        });
        onClose();
    };

    const selectClass = "block w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white text-slate-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Aturan Transaksi Rutin">
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    Transaksi akan dicatat otomatis sesuai jadwal saat aplikasi dibuka.
                </p>

                <Input
                    label="Nama"
                    placeholder="Contoh: Tagihan Internet"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={errors.title}
                    required
                />
                <Input
                    label="Nominal (Rupiah)"
                    type="number"
                    min="1"
                    placeholder="Contoh: 350000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    error={errors.amount}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipe</label>
                        <select className={selectClass} value={type} onChange={(e) => { setType(e.target.value); setCategoryId(''); }}>
                            <option value="expense">Pengeluaran</option>
                            <option value="income">Pemasukan</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kategori</label>
                        <select className={selectClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                            <option value="">Pilih kategori...</option>
                            {(relevantCategories.length > 0 ? relevantCategories : categories).map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dompet</label>
                        <select className={selectClass} value={walletId} onChange={(e) => setWalletId(e.target.value)}>
                            {wallets.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Frekuensi</label>
                        <select className={selectClass} value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                            {Object.entries(FREQ_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <Input
                    label="Mulai Tanggal"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    error={errors.startDate}
                    required
                />

                <div className="flex gap-3 justify-end pt-2">
                    <Button type="button" variant="secondary" onClick={onClose} className="px-5 py-2.5">Batal</Button>
                    <Button type="submit" variant="primary" className="px-5 py-2.5 bg-emerald-600">Simpan Aturan</Button>
                </div>
            </form>
        </Modal>
    );
}
