import React, { useEffect, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useFinance } from '../../../contexts/FinanceContext';
import { CATEGORY_ICON_OPTIONS, DEFAULT_CATEGORY_ICON_KEY, getCategoryIconKey } from '../categoryIconOptions';
import { Check } from 'lucide-react';

export default function CategoryModal({ isOpen, onClose, editing = null }) {
    const { addCategory, updateCategory, deleteCategory } = useFinance();

    const [name, setName] = useState('');
    const [type, setType] = useState('expense');
    const [budget, setBudget] = useState('');
    const [iconKey, setIconKey] = useState(DEFAULT_CATEGORY_ICON_KEY.expense);
    const [errors, setErrors] = useState({});
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setErrors({});
        setConfirmDelete(false);
        if (editing) {
            setName(editing.name);
            setType(editing.type);
            setBudget(editing.budget ? String(editing.budget) : '');
            setIconKey(getCategoryIconKey(editing));
        } else {
            setName('');
            setType('expense');
            setBudget('');
            setIconKey(DEFAULT_CATEGORY_ICON_KEY.expense);
        }
    }, [isOpen, editing]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!name.trim()) errs.name = 'Nama kategori wajib diisi';
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        if (editing) {
            updateCategory(editing.id, { name: name.trim(), iconKey, budget: budget || null });
        } else {
            addCategory({ name: name.trim(), type, iconKey, budget: type === 'expense' && budget ? Number(budget) : null });
        }
        onClose();
    };

    const handleDelete = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        deleteCategory(editing.id);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Kelola Kategori' : 'Tambah Kategori'}>
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <Input
                    label="Nama Kategori"
                    placeholder="Contoh: Pendidikan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    required
                />

                <fieldset>
                    <legend className="ui-field-label mb-2 block">Pilih Ikon</legend>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label="Pilihan ikon kategori">
                        {CATEGORY_ICON_OPTIONS.map(({ key, label, Icon }) => {
                            const isSelected = iconKey === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    aria-label={`Pilih ikon ${label}`}
                                    aria-pressed={isSelected}
                                    title={label}
                                    onClick={() => setIconKey(key)}
                                    className={`relative flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${isSelected
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-700'}`}
                                >
                                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isSelected ? 'bg-emerald-100' : 'bg-slate-50'}`}>
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                    <span className="max-w-full truncate text-[10px] font-medium leading-tight">{label}</span>
                                    {isSelected && (
                                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 text-white">
                                            <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </fieldset>

                {!editing && (
                    <div>
                         <label htmlFor="category-type" className="ui-field-label block mb-1.5">Tipe</label>
                        <select
                             id="category-type"
                             className="ui-control block w-full bg-white px-3 py-2.5"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="expense">Pengeluaran</option>
                            <option value="income">Pemasukan</option>
                        </select>
                    </div>
                )}

                {type === 'expense' && (
                    <Input
                        label="Anggaran Bulanan (Opsional)"
                        type="number"
                        min="0"
                        placeholder="Contoh: 1000000"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                    />
                )}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                    {editing && editing.deletable !== false && (
                        <Button
                            type="button"
                            variant="outline"
                            className={`w-full px-5 py-2.5 sm:mr-auto sm:w-auto ${confirmDelete
                                ? '!border-rose-500 !bg-rose-600 !text-white hover:!bg-rose-700'
                                : '!border-rose-300 !text-rose-600 hover:!bg-rose-50'}`}
                            onClick={handleDelete}
                        >
                            {confirmDelete ? 'Yakin Hapus?' : 'Hapus'}
                        </Button>
                    )}
                    <Button type="button" variant="secondary" onClick={onClose} className="w-full px-5 py-2.5 sm:w-auto">Batal</Button>
                    <Button type="submit" variant="primary" className="w-full bg-emerald-600 px-5 py-2.5 sm:w-auto">
                        {editing ? 'Simpan' : 'Tambah Kategori'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
