# A Core Raa Cloud

Dashboard cloud responsif untuk memperkenalkan dan menjalankan **A Core Raa**, engine analisis evidence game web yang deterministic dan evidence-bound.

## Alur penggunaan

Pengguna menempelkan JSON evidence atau mengunggah berkas JSON lokal dengan batas 256 KB. Aplikasi memvalidasi bentuk JSON di browser, lalu mengirim evidence ke prosedur tRPC analisis. Backend tidak mengeksekusi URL, tidak mengambil resource game, dan tidak menyimpan evidence mentah secara default.

Rules engine melakukan redaction field sensitif, mencocokkan dataset lokal, menghitung readiness score dan level risiko, lalu mengembalikan findings, confidence, evidence pendukung, dan prioritas tindakan aman. Laporan dapat diunduh sebagai JSON metadata. Opsi simpan privat hanya menyimpan ringkasan laporan dan metadata milik akun yang telah login.

## Status transparan

A Core Raa adalah engine domain-spesifik mandiri, bukan layanan model AI eksternal. Hasilnya hanya boleh dipercaya sejauh evidence yang diberikan. Jika bukti tidak cukup, sistem menampilkan gap seperti manifest, integrity, dependency graph, atau API map yang belum tersedia.

## Privasi dan keamanan

Endpoint dibatasi pada 256 KB per evidence. Input diproses setelah validasi dan redaction. Evidence mentah tidak masuk database. Metadata laporan privat dibatasi 32 KB, membutuhkan autentikasi, dan dipisahkan berdasarkan user ID. Tidak ada auto-fetch, URL execution, CAPTCHA bypass, DRM bypass, atau pengambilan credential.

## Pengembangan

```bash
pnpm check
pnpm test -- --run
pnpm build
```

Frontend memakai React, Tailwind, shadcn/ui, dan tRPC. Backend memakai Express, tRPC, Drizzle, dan database managed. Skema metadata privat berada di `drizzle/schema.ts`; evidence bytes tidak disimpan di database.
