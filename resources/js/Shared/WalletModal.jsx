import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../Components/UI/Modal';
import Input from '../Components/UI/Input';
import Button from '../Components/UI/Button';
import { useFinance } from '../Store/FinanceContext';

const WALLET_COLORS = ['#0E6C4A', '#2563EB', '#B45309', '#9333EA', '#E11D48', '#475569', '#111827'];

export default function WalletModal({ isOpen, onClose, editing = null }) {
    const { addWallet, updateWallet } = useFinance();
    const [name, setName] = useState('');
    const [color, setColor] = useState(WALLET_COLORS[0]);
    const [initialBalance, setInitialBalance] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!isOpen) return;
        setErrors({});
        setName(editing?.name || '');
        setColor(editing?.color || WALLET_COLORS[0]);
        setInitialBalance(editing ? String(editing.initialBalance || 0) : '0');
    }, [isOpen, editing]);

    const title = useMemo(() => (editing ? 'Edit Dompet' : 'Tambah Dompet'), [editing]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const nextErrors = {};
        const balance = Number(initialBalance);

        if (!name.trim()) nextErrors.name = 'Nama dompet wajib diisi';
        if (Number.isNaN(balance) || balance < 0) nextErrors.initialBalance = 'Saldo awal tidak boleh negatif';

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        const payload = { name, color, initialBalance: balance };
        if (editing) updateWallet(editing.id, payload);
        else addWallet(payload);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <Input
                    label="Nama Dompet"
                    placeholder="Contoh: Mandiri, DANA, Kas Rumah"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    required
                />

                <Input
                    label="Saldo Awal"
                    type="number"
                    min="0"
                    placeholder="Contoh: 500000"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    error={errors.initialBalance}
                    required
                />

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Warna Dompet</label>
                    <div className="grid grid-cols-7 gap-2">
                        {WALLET_COLORS.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setColor(item)}
                                className={`h-10 rounded-xl border transition-all ${color === item ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200'}`}
                                style={{ backgroundColor: item }}
                                title={item}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose} className="px-5 py-2.5">
                        Batal
                    </Button>
                    <Button type="submit" variant="primary" className="px-5 py-2.5 bg-emerald-700">
                        {editing ? 'Simpan Perubahan' : 'Simpan Dompet'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
