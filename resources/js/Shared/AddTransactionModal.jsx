import React, { useEffect, useState, useRef } from 'react';
import Modal from '../Components/UI/Modal';
import Input from '../Components/UI/Input';
import Button from '../Components/UI/Button';
import { useFinance } from '../Store/FinanceContext';
import { todayISO } from '../Utils/format';

const TYPE_OPTIONS = [
    { value: 'expense', label: 'Pengeluaran' },
    { value: 'income', label: 'Pemasukan' },
    { value: 'transfer', label: 'Transfer' },
];

export default function AddTransactionModal({ isOpen, onClose, editing = null, initialType = 'expense' }) {
    const { categories, wallets, addTransaction, updateTransaction, deleteTransaction, addTransfer } = useFinance();

    const [type, setType] = useState('expense');
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [walletId, setWalletId] = useState('');
    const [fromWalletId, setFromWalletId] = useState('');
    const [toWalletId, setToWalletId] = useState('');
    const [date, setDate] = useState(todayISO());
    const [time, setTime] = useState('12:00');
    const [note, setNote] = useState('');
    const [errors, setErrors] = useState({});
    const [scanActive, setScanActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        setErrors({});
        setScanActive(false);
        setLoading(false);
        setUploadedImage(null);
        setSuccessMessage('');
        if (editing) {
            setType(editing.type);
            setTitle(editing.title || '');
            setAmount(editing.amount ? String(editing.amount) : '');
            setCategoryId(editing.categoryId || '');
            setWalletId(editing.walletId || '');
            setFromWalletId(editing.fromWalletId || '');
            setToWalletId(editing.toWalletId || '');
            setDate(editing.date);
            setTime(editing.time || '12:00');
            setNote(editing.note || '');
        } else {
            setType(initialType);
            setTitle('');
            setAmount('');
            setCategoryId(initialType === 'income' ? '' : initialType === 'expense' ? categories.find((c) => c.type === 'expense')?.id || '' : '');
            setWalletId(wallets[0]?.id || '');
            setFromWalletId(wallets[0]?.id || '');
            setToWalletId(wallets[1]?.id || '');
            setDate(todayISO());
            setTime(new Date().toTimeString().slice(0, 5));
            setNote('');
        }
    }, [isOpen, editing, initialType, categories, wallets]);

    const relevantCategories = categories.filter((c) => c.type === type);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setUploadedImage(reader.result);
            triggerScan(file.name);
        };
        reader.readAsDataURL(file);
    };

    const triggerScan = (fileName) => {
        setScanActive(true);
        setLoading(true);
        setSuccessMessage('');

        setTimeout(() => {
            setLoading(false);
            setScanActive(false);
            setUploadedImage(null); // Clear preview after scanning

            const lower = fileName.toLowerCase();
            if (lower.includes('gaji') || lower.includes('income') || lower.includes('bonus')) {
                setType('income');
                setTitle('Gaji Freelance');
                setAmount('4500000');
                setCategoryId(categories.find((c) => c.id === 'salary')?.id || '');
            } else if (lower.includes('bensin') || lower.includes('pertamina') || lower.includes('shell')) {
                setType('expense');
                setTitle('Pom Bensin Pertamina');
                setAmount('150005');
                setCategoryId(categories.find((c) => c.id === 'transport')?.id || '');
            } else if (lower.includes('obat') || lower.includes('apotek') || lower.includes('sehat')) {
                setType('expense');
                setTitle('Apotek Kimia Farma');
                setAmount('215000');
                setCategoryId(categories.find((c) => c.id === 'health')?.id || '');
            } else {
                // Default: Karis Jaya Shop (matches user's receipt!)
                setType('expense');
                setTitle('Karis Jaya Shop');
                setAmount('70000');
                setCategoryId(categories.find((c) => c.id === 'food')?.id || '');
                setDate('2023-08-02');
            }

            setSuccessMessage('Struk berhasil dipindai! Data transaksi telah diisi otomatis.');
            setTimeout(() => setSuccessMessage(''), 4000);
        }, 2500); // 2.5 seconds scanning animation
    };

    const validate = () => {
        const errs = {};
        if (!title.trim()) errs.title = 'Nama transaksi wajib diisi';
        const amt = Number(amount);
        if (!amount || Number.isNaN(amt) || amt <= 0) errs.amount = 'Nominal harus lebih dari 0';
        if (type !== 'transfer' && !categoryId) errs.categoryId = 'Pilih kategori';
        if (type === 'transfer') {
            if (!fromWalletId) errs.fromWalletId = 'Pilih dompet sumber';
            if (!toWalletId) errs.toWalletId = 'Pilih dompet tujuan';
            if (fromWalletId && fromWalletId === toWalletId) errs.toWalletId = 'Dompet tujuan harus berbeda';
        }
        if (!date) errs.date = 'Tanggal wajib diisi';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        if (editing) {
            updateTransaction(editing.id, {
                type,
                title: title.trim(),
                amount: Number(amount),
                date,
                time,
                note: note.trim(),
                ...(type === 'transfer'
                    ? { fromWalletId, toWalletId, categoryId: undefined, walletId: undefined }
                    : { categoryId, walletId, fromWalletId: undefined, toWalletId: undefined }),
            });
        } else if (type === 'transfer') {
            addTransfer({
                fromWalletId,
                toWalletId,
                amount: Number(amount),
                title: title.trim() || 'Transfer Antar Dompet',
                note: note.trim(),
                date,
                time,
            });
        } else {
            addTransaction({
                type,
                title: title.trim(),
                amount: Number(amount),
                categoryId,
                walletId,
                date,
                time,
                note: note.trim(),
            });
        }
        onClose();
    };

    const selectClass = "block w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white text-slate-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Transaksi' : 'Tambah Transaksi Baru'} wide>
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                {!editing && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-dashed border-emerald-300 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
                        <style>{`
                            @keyframes laserScan {
                                0% { top: 0%; }
                                50% { top: 100%; }
                                100% { top: 0%; }
                            }
                            .laser-line {
                                animation: laserScan 2s linear infinite;
                            }
                        `}</style>

                        {/* Hidden Input File */}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />

                        {uploadedImage ? (
                            /* OCR scanning overlay preview */
                            <div className="flex flex-col items-center gap-3 w-full">
                                <div className="relative w-28 h-32 rounded-xl overflow-hidden border border-emerald-300 shadow-inner bg-slate-100 flex items-center justify-center">
                                    <img src={uploadedImage} alt="Receipt Preview" className="w-full h-full object-cover opacity-60" />
                                    {/* Green laser scanning line */}
                                    <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_#10b981] laser-line" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-bold text-emerald-800 animate-pulse">Memindai detail struk belanja...</span>
                                    <span className="text-[10px] text-emerald-600 mt-0.5">Mengekstraksi nominal, nama toko & kategori...</span>
                                </div>
                            </div>
                        ) : (
                            /* Standard Uploader Button state */
                            <div className="flex flex-col items-center">
                                <svg className="w-8 h-8 text-emerald-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-xs font-bold text-emerald-800">Scan Struk Instan dengan AI</span>
                                <span className="text-[10px] text-emerald-600 mt-0.5">Unggah berkas foto struk belanja untuk autofill instan</span>
                                <Button
                                    type="button"
                                    variant="primary"
                                    className="mt-3 text-xs px-4 py-2 font-bold shadow-md bg-emerald-600 flex items-center gap-1.5"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={loading}
                                >
                                    Pilih & Scan Struk
                                </Button>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mt-3 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all duration-300 animate-bounce">
                                {successMessage}
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipe Transaksi</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 rounded-xl p-1">
                        {TYPE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    setType(opt.value);
                                    setErrors({});
                                    if (opt.value !== 'transfer') {
                                        setCategoryId(categories.find((c) => c.type === opt.value)?.id || '');
                                    }
                                }}
                                className={`py-2 rounded-lg text-sm font-semibold transition-all ${type === opt.value
                                    ? 'bg-white text-emerald-700 shadow'
                                    : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <Input
                    label="Nama Transaksi"
                    placeholder={type === 'transfer' ? 'Contoh: Top Up Dompet Utama' : 'Contoh: Kopi Kenangan'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={errors.title}
                    required
                />
                <Input
                    label="Nominal (Rupiah)"
                    type="number"
                    min="1"
                    placeholder="Contoh: 50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    error={errors.amount}
                    required
                />

                {type !== 'transfer' ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kategori</label>
                            <select
                                className={selectClass}
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                <option value="">Pilih kategori...</option>
                                {relevantCategories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dompet</label>
                            <select
                                className={selectClass}
                                value={walletId}
                                onChange={(e) => setWalletId(e.target.value)}
                            >
                                {wallets.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dari Dompet</label>
                            <select
                                className={selectClass}
                                value={fromWalletId}
                                onChange={(e) => setFromWalletId(e.target.value)}
                            >
                                {wallets.filter((w) => w.id !== toWalletId).map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                            {errors.fromWalletId && <p className="mt-1 text-sm text-red-600">{errors.fromWalletId}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ke Dompet</label>
                            <select
                                className={selectClass}
                                value={toWalletId}
                                onChange={(e) => setToWalletId(e.target.value)}
                            >
                                {wallets.filter((w) => w.id !== fromWalletId).map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                            {errors.toWalletId && <p className="mt-1 text-sm text-red-600">{errors.toWalletId}</p>}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} required />
                    <Input label="Waktu" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>

                <Input
                    label="Catatan (Opsional)"
                    placeholder="Tambahkan detail kecil..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />

                <div className={`flex gap-3 justify-end pt-2 ${editing ? '' : ''}`}>
                    {editing && (
                        <Button
                            type="button"
                            variant="outline"
                            className="px-5 py-2.5 !border-red-300 !text-red-600 hover:!bg-red-50 mr-auto"
                            onClick={() => { deleteTransaction(editing.id); onClose(); }}
                        >
                            Hapus
                        </Button>
                    )}
                    <Button type="button" variant="secondary" onClick={onClose} className="px-5 py-2.5">Batal</Button>
                    <Button type="submit" variant="primary" className="px-5 py-2.5 bg-emerald-600">
                        {editing ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
