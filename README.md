[![M8ven Verified](https://m8ven.ai/badge/mcp/badroel07/elearningitg-mcp-server?variant=verified)](https://m8ven.ai/mcp/badroel07/elearningitg-mcp-server?s=readme)

# E-Learning ITG MCP Server

Model Context Protocol (MCP) Server untuk berinteraksi dengan portal akademik E-Learning Institut Teknologi Garut (https://elearning.itg.ac.id/).

Server ini memungkinkan AI coding assistant (Claude Desktop, Cursor, Antigravity, OpenCode, Windsurf) membaca jadwal kuliah, memantau tugas, membaca materi, serta mengunggah berkas atau tautan pengumpulan tugas secara otomatis.

---

## Fitur Utama

1. **Autentikasi Token-Based Aman**: Mendukung penggunaan `ELEARNING_TOKEN` (Bearer JWT) tanpa perlu menyimpan kata sandi akun di berkas teks atau konfigurasi.
2. **Monitoring Tugas**: Melihat daftar tugas aktif, deadline, nama mata kuliah, dosen, jenis tugas (individu/kelompok), dan status pengumpulan.
3. **Pengumpulan Tugas Berkas & Tautan**:
   * Mengunggah berkas tugas lokal via multipart/form-data.
   * Mendukung bypass otomatis otorisasi foto kamera (`foto_siswa`) menggunakan citra JPEG hitam valid bila tugas berada pada status wajib kamera (status 2).
   * Mengunggah langsung tautan tugas (Google Drive, GitHub, YouTube) secara instan.
   * Otomatis memicu finalisasi pengumpulan tugas (`set_done`).
4. **Informasi Akademik Lengkap**:
   * Mengambil jadwal perkuliahan mingguan.
   * Mengambil materi perkuliahan dan tautan unduhan dokumen.
   * Mengambil ringkasan dashboard (indikator tugas belum selesai).
   * Mengambil data Kartu Hasil Studi (KHS).

---

## Instalasi & Build

```bash
git clone https://github.com/Badroel07/elearningitg-mcp-server.git
cd elearningitg-mcp-server
npm install
npm run build
```

---

## Konfigurasi Environment (`.env`)

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi konfigurasi pada file `.env`:

```env
ELEARNING_URL=https://elearning.itg.ac.id
ELEARNING_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGci...
```

> **Cara mengambil Bearer Token secara mandiri:**
> 1. Buka https://elearning.itg.ac.id/ di browser dan login seperti biasa.
> 2. Buka DevTools (`F12` atau `Ctrl+Shift+I`) -> tab **Console**.
> 3. Jalankan: `localStorage.getItem("token")` lalu tekan Enter.
> 4. Salin string token tersebut ke dalam variabel `ELEARNING_TOKEN` di file `.env`.

---

## Konfigurasi Klien MCP

### 1. Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "elearning-itg": {
      "command": "node",
      "args": ["<PATH_KE_PROYEK>/dist/index.js"],
      "env": {
        "ELEARNING_URL": "https://elearning.itg.ac.id",
        "ELEARNING_TOKEN": "TOKEN_BEARER_ANDA"
      }
    }
  }
}
```

### 2. Cursor / Antigravity (`mcp.json`)
```json
{
  "servers": {
    "elearning-itg": {
      "command": "node",
      "args": ["<PATH_KE_PROYEK>/dist/index.js"],
      "env": {
        "ELEARNING_URL": "https://elearning.itg.ac.id",
        "ELEARNING_TOKEN": "TOKEN_BEARER_ANDA"
      },
      "type": "stdio"
    }
  }
}
```

---

## Daftar Tools

| Tool | Deskripsi |
| :--- | :--- |
| `elearning_login` | Login menggunakan NIM/password jika token kedaluwarsa. |
| `elearning_get_dashboard` | Mengambil ringkasan tugas, evaluasi, dan pengumuman. |
| `elearning_list_tugas` | Mengambil daftar tugas beserta filter status, jenis (individu/kelompok), dan tenggat waktu. |
| `elearning_get_tugas_detail` | Melihat rincian tugas dan memeriksa status otorisasi kamera. |
| `elearning_submit_tugas` | Mengunggah berkas tugas lokal dengan auto-bypass webcam jika wajib. |
| `elearning_submit_tugas_link` | Mengunggah tautan jawaban tugas (Google Drive, GitHub, dll.) secara instan. |
| `elearning_get_jadwal` | Mengambil jadwal kuliah mingguan. |
| `elearning_get_materi` | Mengambil materi kuliah dan tautan unduhan. |
| `elearning_get_khs` | Mengambil data KHS dan perolehan SKS per semester. |

---

## Lisensi

[MIT](LICENSE)
