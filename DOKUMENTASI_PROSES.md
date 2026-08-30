# Dokumentasi Proses & Langkah Kerja SakuPintar 🚀

Dokumen ini berisi rangkuman seluruh perubahan sistem yang telah diimplementasikan pada proyek **SakuPintar** serta panduan langkah demi langkah untuk melakukan deploy dan aktivasi produksi di cloud.

---

## 1. Rangkuman Perubahan yang Telah Selesai (Work Accomplished)

### 🔹 Frontend & Antarmuka Premium (UI/UX)
1. **Interactive SVG Area Line Chart**:
   * Menggantikan grafik bar statis lama dengan kurva area SVG interaktif yang bersinar hijau zamrud, garis putus-putus proyeksi abu-abu, serta *floating black tooltip* interaktif saat kursor diarahkan ke grafik.
2. **Responsive Sidebar (Split Desktop & Tablet)**:
   * Mengoptimalkan breakpoint dari `md` (768px) menjadi `sm` (640px) pada [AuthenticatedLayout.jsx](file:///c:/Users/Asus/Documents/PROJECTWEB/SakuPintar/resources/js/Layouts/AuthenticatedLayout.jsx).
   * Sidebar otomatis menyusut menjadi ukuran minimalis bergaya premium (`w-20`) saat layar desktop dibagi setengah (*split screen*), hanya menampilkan ikon-ikon menu utama secara simetris di tengah.
3. **Fitur Tabungan Bersama (Collaborative Savings Goals)**:
   * Menambahkan lencana hijau premium **"Bersama"** di samping nama target yang dibagikan pada `GoalCard`.
   * Menambahkan tombol ikon **Kelola Kolaborasi** (ikon Dua Pengguna) untuk mengundang pasangan mengelola tabungan bersama.
   * Membuat modal kolaborasi baru ([CollaborateModal.jsx](file:///c:/Users/Asus/Documents/PROJECTWEB/SakuPintar/resources/js/Components/Savings/CollaborateModal.jsx)) untuk menghubungkan/memutus kolaborasi dengan pasangan menggunakan email.

### 🔹 Integrasi Cloud Database & Auth (Supabase)
1. **Klien Supabase**:
   * Membuat [supabaseClient.js](file:///c:/Users/Asus/Documents/PROJECTWEB/SakuPintar/resources/js/Store/supabaseClient.js) yang mendeteksi konfigurasi secara dinamis (beralih otomatis ke mode LocalStorage offline jika file `.env` kosong).
2. **Pusat Notifikasi & Undangan Aman (Secure Invite Flow)**:
   * **Tidak langsung memunculkan target**: Ketika Anda mengundang pacar, undangan dikirim dengan status `pending`.
   * **Lencana Lonceng Interaktif**: Lonceng di pojok kanan atas akun pacar Anda akan menyala merah berkedip (*pulsing*). Ketika diklik, akan muncul kartu undangan kolaborasi lengkap dengan tombol **Terima** dan **Tolak**.
   * **Real-time Sync**: Begitu diterima, target tabungan langsung terduplikasi otomatis di dashboard miliknya. Riwayat transaksi setoran akan mencatat nama penyetor secara dinamis (contoh: *Setoran oleh Rian*).

### 🔹 Keamanan & Perbaikan Bug Redirection Loop
1. **Otentikasi Google OAuth**:
   * Memasang logika integrasi Google Login asli di [Login.jsx](file:///c:/Users/Asus/Documents/PROJECTWEB/SakuPintar/resources/js/Pages/Auth/Login.jsx) dan [Register.jsx](file:///c:/Users/Asus/Documents/PROJECTWEB/SakuPintar/resources/js/Pages/Auth/Register.jsx) menggunakan `signInWithOAuth` Supabase.
2. **Perbaikan Redirection Loop (Loading Spinner Terjebak)**:
   * Memperbarui file routing utama [app.jsx](file:///c:/Users/Asus/Documents/PROJECTWEB/SakuPintar/resources/js/app.jsx) dengan menambahkan `useEffect` reaktif dan menghapus variabel hash statis. Sistem sekarang menunggu Supabase selesai memverifikasi sesi OAuth secara asinkron (menampilkan loading spinner sejenak) sebelum melakukan pengalihan, sehingga token login tidak terhapus dari URL.

---

## 2. Langkah Kerja Selanjutnya (Next Steps & Deploy Guide)

Agar aplikasi SakuPintar ini dapat diakses secara online oleh Anda dan pacar Anda secara bersamaan melalui HP atau laptop masing-masing, ikuti panduan ini:

### 📍 Langkah 1: Deploy Aplikasi Frontend ke Vercel (2 Menit)
Karena kode lokal Anda sudah 100% tersinkronisasi di GitHub remote, Anda tinggal melakukan deploy gratis ke Vercel:
1. Masuk ke **[Vercel](https://vercel.com/)** menggunakan akun GitHub Anda.
2. Klik tombol **"Add New"** -> **"Project"**.
3. Klik **"Import"** pada repositori bernama **`SakuPintar`**.
4. Cari bagian **Environment Variables** sebelum klik deploy, lalu masukkan kredensial Supabase Anda dari file `.env`:
   * **Key**: `VITE_SUPABASE_URL` | **Value**: *(Salin URL Supabase Anda)*
   * **Key**: `VITE_SUPABASE_ANON_KEY` | **Value**: *(Salin Anon Key Supabase Anda)*
   * Klik **"Add"**.
5. Klik **"Deploy"**. Vercel akan memproses build dan memberikan tautan website resmi Anda (misal: `https://sakupintar.vercel.app`).

### 📍 Langkah 2: Daftarkan Domain Vercel di Supabase (1 Menit)
Agar proses login Google OAuth dan verifikasi token berjalan lancar di website produksi online:
1. Buka halaman **[Supabase URL Configuration](https://supabase.com/dashboard/project/ozrtaxqhbwqzsrfjonws/auth/providers)**.
2. Pada kolom **Site URL**, ganti alamat localhost menjadi URL domain Vercel Anda:
   ```text
   https://sakupintar.vercel.app
   ```
3. Pada bagian **Redirect URLs** (tepat di bawahnya), klik **Add URL** dan masukkan rute dashboard Anda:
   ```text
   https://sakupintar.vercel.app/dashboard
   ```
4. Klik **Save changes** di bagian paling bawah halaman.

### 📍 Langkah 3: Daftarkan Domain Vercel di Google Cloud Console (1 Menit)
Agar Google mengizinkan pengalihan masuk ke domain Vercel Anda:
1. Buka kembali proyek **SakuPintar** Anda di **[Google Cloud Credentials](https://console.cloud.google.com/apis/credentials)**.
2. Klik ikon pensil (Edit) pada bagian **OAuth 2.0 Client IDs** -> **Web client 1**.
3. Cari kolom **Authorized redirect URIs**.
4. Salin alamat callback URL Supabase produksi Anda dari kolom Google Provider di Supabase. Alamatnya sama dengan yang telah Anda salin sebelumnya:
   ```text
   https://ozrtaxqhbwqzsrfjonws.supabase.co/auth/v1/callback
   ```
5. Simpan perubahan tersebut.

---

## 3. Cara Menguji Aplikasi setelah Online 🌟
1. Bagikan link Vercel (`https://sakupintar.vercel.app`) ke pacar Anda.
2. Minta dia membuka link tersebut di HP-nya dan mendaftar dengan akun Google-nya (klik tombol **Google**).
3. Anda masuk ke akun Anda sendiri menggunakan akun Google Anda juga.
4. Masuk ke menu **Target Tabungan**, pilih salah satu target tabungan, klik tombol kolaborasi, dan masukkan email Google pacar Anda.
5. Pacar Anda akan melihat lonceng notifikasi di HP-nya berkedip merah. Dia cukup mengklik lonceng tersebut dan menekan **Terima**.
6. **Selesai!** Anda berdua kini resmi mengelola tabungan impian bersama secara online, aman, dan real-time dari HP masing-masing!
