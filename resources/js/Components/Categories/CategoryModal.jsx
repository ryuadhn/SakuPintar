import React, { useEffect, useState } from 'react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { useFinance } from '../../Store/FinanceContext';

export default function CategoryModal({ isOpen, onClose, editing = null }) {
    const { addCategory, updateCategory, deleteCategory } = useFinance();

    const [name, setName] = useState('');
    const [type, setType] = useState('expense');
    const [budget, setBudget] = useState('');
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
        } else {
            setName('');
            setType('expense');
            setBudget('');
        }
    }, [isOpen, editing]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!name.trim()) errs.name = 'Nama kategori wajib diisi';
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        if (editing) {
            updateCategory(editing.id, { name: name.trim(), budget: budget || null });
        } else {
            addCategory({ name: name.trim(), type, budget: type === 'expense' && budget ? Number(budget) : null });
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

                {!editing && (
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipe</label>
                        <select
                            className="block w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none"
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

                <div className="flex gap-3 justify-end pt-2 items-center">
                    {editing && editing.deletable !== false && (
                        <Button
                            type="button"
                            variant="outline"
                            className={`px-5 py-2.5 mr-auto ${confirmDelete
                                ? '!border-red-500 !bg-red-600 !text-white hover:!bg-red-700'
                                : '!border-red-300 !text-red-600 hover:!bg-red-50'}`}
                            onClick={handleDelete}
                        >
                            {confirmDelete ? 'Yakin Hapus?' : 'Hapus'}
                        </Button>
                    )}
                    <Button type="button" variant="secondary" onClick={onClose} className="px-5 py-2.5">Batal</Button>
                    <Button type="submit" variant="primary" className="px-5 py-2.5 bg-emerald-600">
                        {editing ? 'Simpan' : 'Tambah Kategori'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
