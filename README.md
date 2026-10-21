# E-SPb PPDB — Sektor Pembelajaran PPD Beluran
## Portal Pengurusan & Repositori Instruksional V2.0 (Next.js & Vercel)

Selamat datang ke versi moden **E-SPb PPDB (Sektor Pembelajaran Pejabat Pendidikan Daerah Beluran, Sabah)** yang telah dimigrasikan sepenuhnya daripada Google Apps Script (GAS) ke **Next.js (App Router), React, TypeScript, Tailwind CSS**, dan bersedia untuk dihoskan di **Vercel**.

---

## 1. Ciri-Ciri Utama Sistem

- **Portal Awam Responsif**:
  - Banner Sorotan Hero Berputar secara automatik.
  - Hebahan Rasmi mengikut kategori (`Rasmi`, `Program`, `Hebahan`) dengan paparan modal perincian.
  - Struktur Unit Sektor mengikut Kategori (`SISC+` dan `Unit Sokongan`).
  - Halaman Khusus Unit dengan peranan/fungsi, perkhidmatan bimbingan, direktori pegawai, serta repositori dokumen dan modul.
  - Pratonton Dokumen (PDF & Imej) dan muat turun terus fail Google Drive.
  - Sokongan Mod Gelap (Dark Mode) dan Mod Terang (Light Mode) dengan storan setempat.
  - Bar navigasi mesra telefon pintar (Mobile Drawer).
- **Pangkalan Data Google Sheets**:
  - Menggunakan Google Spreadsheet sedia ada sebagai pangkalan data utama.
  - Operasi CRUD penuh: Hebahan, Hero Album, Unit, Kandungan Unit, Pegawai, Dokumen, dan Log Audit.
  - Perlindungan suntikan formula spreadsheet (*formula injection sanitization*).
- **Integrasi Google Drive**:
  - Storan hierarki mengikut folder Unit & Sektor.
  - Muat naik dokumen dan imej terus dari panel pentadbir ke Google Drive.
  - Penyelarasan automatik (*Drive Sync*) antara folder Drive dan senarai rekod dokumen.
- **Keselamatan & Pengesahan Pentadbir**:
  - Pengesahan dwipilihan: Google Workspace (@moe.gov.my) atau Kata Laluan Induk.
  - Sesi disulitkan menggunakan JWT (*JSON Web Tokens*) melalui kuki HTTP-Only yang selamat.
  - Perlindungan had percubaan (*Rate-limiting & Brute Force Lockout*).
  - Kawalan capaian berasaskan peranan (*Server-Side Authorization Guard*).

---

## 2. Keperluan Sistem & Pemasangan Tempatan

### Keperluan:
- **Node.js**: v18.17.0 atau terkini (diuji pada v24.21.0)
- **npm**: v9.0.0 atau terkini

### Langkah Persediaan:
1. Salin fail konfigurasi persekitaran:
   ```bash
   cp .env.example .env.local
   ```
2. Pasang kebergantungan (dependencies):
   ```bash
   npm install
   ```
3. Jalankan ujian automatik (unit tests):
   ```bash
   npm test
   ```
4. Mulakan pelayan pembangunan tempatan:
   ```bash
   npm run dev
   ```
5. Buka pelayar web di [http://localhost:3000](http://localhost:3000).

> [!NOTE]
> Aplikasi ini dilengkapi dengan penyesuai pangkalan data pintar (*resilient fallback database*). Sekiranya kelayakan Google Cloud belum dimasukkan semasa pembangunan awal, portal akan terus beroperasi secara lancar menggunakan data simulasi berasaskan struktur sebenar tanpa sebarang ralat terputus.

---

## 3. Konfigurasi Google Cloud & Kelayakan API

Untuk menghubungkan aplikasi ini dengan Google Spreadsheet dan Google Drive anda:

1. **Cipta Projek Google Cloud**:
   - Layari [Google Cloud Console](https://console.cloud.google.com/).
   - Cipta projek baharu: contohnya `espb-ppdb-portal`.

2. **Aktifkan API Berkaitan**:
   - Di menu *APIs & Services* > *Library*, aktifkan:
     1. **Google Sheets API**
     2. **Google Drive API**

3. **Cipta Akaun Perkhidmatan (Service Account)**:
   - Pergi ke *APIs & Services* > *Credentials* > *Create Credentials* > *Service Account*.
   - Masukkan nama akaun: `espb-service-account`.
   - Klik *Create and Continue*, kemudian *Done*.
   - Klik pada akaun perkhidmatan yang dicipta > tab *Keys* > *Add Key* > *Create new key* > pilih format **JSON**.
   - Fail JSON akan dimuat turun ke komputer anda.

4. **Kongsi Akses Spreadsheet & Folder Google Drive**:
   - Buka Google Spreadsheet `ESPB_Master_Database` dan folder utama di Google Drive anda.
   - Klik butang **Share (Kongsi)** dan masukkan alamat e-mel akaun perkhidmatan (contoh: `espb-service-account@projek.iam.gserviceaccount.com`).
   - Berikan peranan **Editor**.

5. **Kemas Kini Pemboleh Ubah Persekitaran (.env.local / Vercel)**:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Nilai `client_email` dari fail JSON.
   - `GOOGLE_PRIVATE_KEY`: Nilai `private_key` dari fail JSON (kekalkan baris pemisah `\n`).
   - `GOOGLE_SPREADSHEET_ID`: ID Google Spreadsheet anda (didapati dari URL fail).
   - `GOOGLE_DRIVE_ROOT_FOLDER_ID`: ID folder utama Google Drive anda.
   - `ADMIN_PASSPHRASE`: Kata laluan induk pentadbir portal.
   - `SESSION_SECRET`: Rentetan aksara rawak melebihi 32 aksara untuk enkripsi token.

---

## 4. Panduan Penempatan ke Vercel (Deployment)

1. **Tolak Kod ke GitHub**:
   - Muat naik repositori ini ke akaun GitHub anda.

2. **Import Projek ke Vercel**:
   - Layari [Vercel Dashboard](https://vercel.com/) dan klik **Add New Project**.
   - Import repositori GitHub `ESPB-V2`.
   - Vercel akan mengesan rangka kerja Next.js secara automatik.

3. **Masukkan Environment Variables di Vercel**:
   - Di bahagian **Environment Variables**, masukkan semua pemboleh ubah daripada `.env.example`:
     - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
     - `GOOGLE_PRIVATE_KEY`
     - `GOOGLE_SPREADSHEET_ID`
     - `GOOGLE_DRIVE_ROOT_FOLDER_ID`
     - `ADMIN_PASSPHRASE`
     - `SESSION_SECRET`
     - `PORTAL_NAME`
     - `SECTOR_NAME`
     - `DISTRICT`
     - `STATE`
     - `CONTACT_EMAIL`
     - `CONTACT_PHONE`
     - `ADDRESS`
     - `CARTA_ORGANISASI_URL`
     - `E_KEBERADAAN_URL`

4. **Klik Deploy**:
   - Vercel akan membina (*build*) aplikasi dan menyediakan URL pengeluaran (*production URL*) secara automatik bersama sijil keselamatan SSL/HTTPS percuma.

---

## 5. Prosedur Pertukaran Pengeluaran & Pelan Sandaran (Rollback)

### Sebelum Pertukaran Pengeluaran (Cutover):
1. **Sandaran Data Spreadsheet**:
   - Buat salinan (*Make a copy*) Google Spreadsheet `ESPB_Master_Database` sebagai sandaran sebelum peralihan rasmi.
2. **Pengesahan Capaian Pentadbir**:
   - Uji log masuk pentadbir di persekitaran Vercel Preview.
   - Sahkan keupayaan mencipta hebahan ujian dan memuat naik dokumen ke Google Drive.
3. **Penyelarasan Triggers / Jadual**:
   - Nyahaktifkan Web App Google Apps Script lama setelah pengesahan berjaya untuk mengelakkan percanggahan kemas kini dua hala.

### Pelan Sandaran (Rollback):
- Sekiranya berlaku gangguan kritikal yang tidak dapat diselesaikan segera pada Vercel, capaian pengguna boleh dialihkan serta-merta kembali ke URL Google Apps Script Web App lama (`AKfycbw.../exec`) yang masih kekal utuh dan tidak diubah suai.
