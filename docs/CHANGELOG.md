# 📋 CHANGELOG — Sakuta

> Dokumentasi seluruh pembaruan yang telah diimplementasikan.
> Terakhir diperbarui: Agustus 2026

---

## Update Terbaru - Perapian UI, Chart Data Asli, dan CRUD Dompet

**File baru:**
- `frontend/src/features/wallets/components/WalletModal.jsx` - form tambah/edit dompet

**File diubah:**
- `frontend/src/features/wallets/MultiWallet.jsx`
- `frontend/src/features/dashboard/Dashboard.jsx`
- `frontend/src/features/dashboard/components/ExpenseChart.jsx`
- `frontend/src/features/dashboard/components/QuickAllocation.jsx`
- `frontend/src/layouts/AuthenticatedLayout.jsx`
- `frontend/src/features/categories/Categories.jsx`
- `frontend/src/features/auth/Login.jsx`
- `frontend/src/features/savings/SavingsGoals.jsx`
- `frontend/src/contexts/FinanceContext.jsx`

**Perubahan:**
- Memperbaiki overflow di header halaman transaksi: tombol aksi kini responsif dan tidak terpotong di layar sedang.
- Memperbaiki kartu ringkasan saldo/pemasukan/pengeluaran agar tidak memakai posisi absolut dan tidak keluar dari kartu.
- Menyeragamkan beberapa teks UI ke Bahasa Indonesia: Dompet, Target Tabungan, Kategori, Kelola Kategori, Ekspor Data, Insight Pintar, dan label login.
- Chart "Tren Pengeluaran Bulanan" di Dashboard kini dihitung dari transaksi asli 6 bulan terakhir, bukan SVG statis.
- Panel "Alokasi Pengeluaran" kini menampilkan 3 kategori pengeluaran terbesar bulan ini dari transaksi asli.
- Menambahkan CRUD dompet: tambah dompet, edit nama/warna/saldo awal, dan hapus dompet.
- Hapus dompet diberi validasi agar dompet yang masih dipakai transaksi atau aturan rutin tidak menghilangkan referensi data.
- Data bawaan yang sebelumnya berbahasa Inggris seperti Food & Drink, Transport, Lifestyle, dan Personal Card dinormalisasi ke Bahasa Indonesia saat data dimuat.

---

## 🎯 Ringkasan

Sakuta berkembang dari UI statis (data hardcoded) menjadi aplikasi pencatat keuangan yang **fungsional penuh**: data tersimpan permanen di browser, transaksi bisa dikelola (tambah/edit/hapus/transfer), ada transaksi rutin otomatis, anggaran bulanan dengan notifikasi, target tabungan yang bisa ditambah sendiri, serta sistem **login & registrasi akun**.

---

## 1. 💾 State Management + Penyimpanan Permanen

**File baru:**
- `frontend/src/contexts/FinanceContext.jsx` — state global (React Context)
- `frontend/src/utils/format.js` — helper format Rupiah, tanggal Indonesia, dll

**Penjelasan:**
- Semua data (dompet, kategori, transaksi, anggaran, aturan rutin, target tabungan) kelasih dalam satu store global dan **tersimpan otomatis ke `localStorage`** — data tidak hilang saat browser ditutup
- Saldo tiap dompet dihitung riil dari transaksi (pemasukan − pengeluaran ± transfer)
- Tombol **Reset Data** di sidebar mengembalikan semua data ke contoh awal

---

## 2. ✏️ CRUD Transaksi Sungguhan

**File diubah:** `components/shared/AddTransactionModal.jsx`, `features/wallets/MultiWallet.jsx`, `features/dashboard/Dashboard.jsx`

- Tambah transaksi: pengeluaran / pemasukan, dengan nama, nominal, kategori, dompet, tanggal, waktu, dan catatan
- **Edit transaksi**: klik ikon pensil di tabel — form terisi otomatis dengan data lama
- **Hapus transaksi**: ikon tong sampah + dialog konfirmasi
- Fitur "Scan Struk AI" tetap ada sebagai simulasi (mengisi form otomatis)
- Dashboard kini menampilkan saldo, arus kas bulan ini, dan 5 aktivitas terakhir dari data riil

---

## 3. 🔍 Filter & Pencarian Transaksi

**File diubah:** `features/wallets/MultiWallet.jsx`, `layouts/AuthenticatedLayout.jsx`

- **Kotak pencarian** di halaman transaksi: cari berdasarkan nama/catatan transaksi
- **Search bar di navbar kini berfungsi**: tekan Enter → langsung ke halaman transaksi dengan hasil pencarian (`/wallets?q=kata-kunci`)
- Filter **rentang tanggal**: Hari Ini / 7 Hari / 30 Hari / Bulan Ini / Semua Waktu
- Filter **kategori** (dinamis mengikuti daftar kategori) dan **jenis** (Pemasukan / Pengeluaran / Transfer)
- **Pagination asli** (8 transaksi per halaman, nomor halaman menyesuaikan jumlah data)
- **Export CSV** fungsional — mengunduh hasil filter dalam format Excel-friendly

---

## 4. 💸 Transfer Antar Dompet

**File diubah:** `components/shared/AddTransactionModal.jsx`

- Tipe transaksi baru: **Transfer** — pilih dompet sumber & dompet tujuan (tidak boleh sama, ada validasi)
- Saldo kedua dompet otomatis ter-update (sumber berkurang, tujuan bertambah)
- Di tabel, transfer tampil khusus: badge biru + "Dompet A ➜ Dompet B"

---

## 5. 🔁 Transaksi Rutin (Recurring)

**File baru:** `components/shared/RecurringModal.jsx`
**File diubah:** `features/wallets/MultiWallet.jsx`, `contexts/FinanceContext.jsx`

- Buat aturan rutin: gaji, langganan, tagihan — peningan **harian / mingguan / bulanan**
- Transaksi **dicatat otomatis** sesuai jadwal saat aplikasi dibuka (anti-duplikat)
- Panel "Transaksi Rutin" di halaman transaksi: lihat jadwal berikutnya, aktif/nonaktifkan (toggle), hapus
- Transaksi hasil otomatis ditandai ikon 🔄 di tabel

---

## 6. 💰 Anggaran Bulanan per Kategori + Notifikasi

**File baru:** `components/shared/BudgetAlertBanner.jsx`, `features/categories/components/CategoryModal.jsx`
**File diubah:** `features/categories/Categories.jsx`, `features/categories/components/CategoryCard.jsx`, `layouts/AuthenticatedLayout.jsx`

- Setiap kategori pengeluaran bisa diberi **batas anggaran bulanan**
- Progress bar dengan 3 status warna:
  - 🟢 Aman (< 75%)
  - 🟡 Mendekati batas (≥ 75%) — label "MENDEKATI BATAS ANGGARAN"
  - 🔴 Melebihi batas (> 100%) — label "MELEBIHI BATAS ANGGARAN!"
- **Banner peringatan** otomatis di Dashboard, halaman Transaksi, dan Kategori
- **Notifikasi lonceng** di navbar: menampilkan jumlah peringatan + daftar kategori bermasalah
- Kategori bisa **ditambah / diubah / dihapus** (ikon gerigi di kartu kategori)
- Ringkasan: total anggaran vs terpakai bulan ini

---

## 7. 🎯 Halaman Target Tabungan (Savings Goals)

**File baru:** `features/savings/components/GoalModal.jsx`
**File diubah:** `features/savings/SavingsGoals.jsx`, `contexts/FinanceContext.jsx`

### Perapian UI
- Kartu target diubah dari daftar memanjang menjadi **grid 2 kolom** yang seimbang
- Tab **"Sedang Berjalan / Selesai" kini berfungsi** (dengan jumlah masing-masing)
- Dropdown **"Urutkan" kini berfungsi**: Tenggat Waktu / Progres / Jumlah Target (tertutup otomatis saat klik di luar)
- Kartu proyeksi & "Paling Berhasil" disusun berdampingan
- Ringkasan atas (Total Terkumpul, Target Aktif, Rerata Progres) dihitung dari data asli
- Layout responsif untuk layar kecil

### Form "Tambah Target" (baru!)
- Tombol **Tambah Target** kini membuka form lengkap:
  - Nama target, target nominal, sudah terkumpul, setoran bulanan, tanggal target selesai
  - **Pilih ikon**: 12 pilihan ikon minimalis bergaya seragam (lucide-react) — Rumah, Travel, Pendidikan, Pensiun, Teknologi, Hadiah, Kendaraan, Kesehatan, Pernikahan, Ibadah, Usaha, Lainnya
  - **Pratinjau progres awal** secara langsung saat mengisi nominal
- Target baru langsung muncul di grid dan tersimpan permanen
- Target bisa dihapus (ikon tong sampah di kartu, dengan konfirmasi)
- Target dengan progres 100% otomatis pindah ke tab "Selesai" dengan badge "SELESAI"

---

## 8. 🔐 Sistem Login & Registrasi Akun

**File baru:** `contexts/AuthContext.jsx`
**File diubah:** `app.jsx`, `features/auth/Login.jsx`, `features/auth/Register.jsx`, `layouts/AuthenticatedLayout.jsx`

### Fitur
- **Registrasi akun**: nama, email, kata sandi (min. 8 karakter, konfirmasi harus cocok) — berhasil daftar langsung masuk ke dashboard
- **Login**: verifikasi email & kata sandi, dengan pesan error jelas ("Akun tidak ditemukan" / "Kata sandi salah")
- **Logout**: tombol Keluar di sidebar
- **Proteksi halaman**: Dashboard, Multi-Wallet, Savings, Categories **wajib login** — jika tidak, otomatis diarahkan ke halaman login
- Sebaliknya, halaman login/register tidak bisa dibuka jika sedang login
- **Sesi bertahan** meski browser ditutup, sampai logout
- Sidebar menampilkan **nama & email akun asli** (bukan lagi "Fina Melinda" hardcoded)

### Akun Demo
Tersedia akun bawaan untuk mencoba cepat:
```
Email    : demo@sakupintar.id
Password : demo123
```
Atau gunakan tombol **"Coba cepat dengan akun demo"** / tombol Google & Apple di halaman login (masih simulasi, belum OAuth sungguhan).

### Catatan Keamanan
Data akun disimpan di `localStorage` browser (frontend-only, tanpa backend) — cocok untuk demo/prototipe, **bukan untuk produksi**. Produksi membutuhkan backend + hash password sungguhan + verifikasi OAuth di server.

---

## 🚀 Cara Menjalankan

```bash
npm install    # sekali saja
npm run dev    # buka http://localhost:5173
```

Build produksi: `npm run build` → hasil di folder `dist/`

---

## 📁 Struktur File Baru

```
frontend/src/
├── contexts/
│   ├── AuthContext.jsx        ← login, register, logout, sesi
│   └── FinanceContext.jsx     ← data keuangan + localStorage
├── utils/
│   └── format.js              ← format Rupiah & tanggal
├── components/shared/
│   ├── AddTransactionModal.jsx (diubah: edit + transfer)
│   ├── RecurringModal.jsx      ← form aturan rutin
│   └── BudgetAlertBanner.jsx   ← banner peringatan anggaran
└── features/
    ├── categories/components/
    │   └── CategoryModal.jsx   ← tambah/ubah/hapus kategori
    └── savings/components/
        └── GoalModal.jsx       ← form tambah target + ikon
```

---

## ⚠️ Keterbatasan yang Diketahui

1. **Tanpa backend** — semua data di `localStorage` browser ini saja (tidak sinkron antar perangkat)
2. **Login Google/Apple masih simulasi** — OAuth sungguhan butuh Client ID Google Cloud + backend verifikasi token
3. Halaman Savings Goals bagian grafik & "Paling Berhasil" masih data contoh
4. Password di-hash sederhana untuk demo — bukan standar keamanan produksi
