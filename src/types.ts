export interface LoginResponse {
  status: number;
  message?: string;
  token?: string;
  user?: {
    id: number;
    username: string;
    nama: string;
    email?: string;
    level?: string;
    foto?: string;
    [key: string]: unknown;
  };
}

export interface DashboardCountResponse {
  evaluasi: { not_finished: number; finished: number };
  tugas: { not_finished: number; finished: number };
  online_learning: { not_finished: number; finished: number };
  pengumuman: { not_read: number; read: number };
  [key: string]: unknown;
}

export interface TugasItem {
  id: number;
  tugas_id: number | string;
  judul: string;
  mapel?: string;
  dosen?: string;
  jenis?: "individu" | "kelompok" | string;
  link_download?: string | null;
  tanggal_mulai?: string;
  tanggal_pengumpulan?: string;
  deskripsi?: string;
  status_pengerjaan?: string;
  is_done?: string;
  [key: string]: unknown;
}

export interface TugasDetailResponse {
  status: number; // 1 = ok, 2 = requires photo authorization, 0 = error/forbidden
  message?: string;
  data?: {
    id: number;
    judul: string;
    deskripsi?: string;
    tanggal_mulai?: string;
    tanggal_pengumpulan?: string;
    link_download?: string;
    link_youtube?: string;
    foto?: string | null;
    detail?: {
      judul: string;
      tanggal_pengumpulan?: string;
      tanggal_mulai?: string;
      created_at?: string;
      kelas_mapel?: {
        nama?: string;
        guru?: { nama: string };
        mapel?: { nama: string };
        tingkat?: { nama: string };
      };
    };
    [key: string]: unknown;
  };
}

export interface JadwalItem {
  id: number;
  hari?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  ruang?: string;
  mapel?: { nama: string };
  guru?: { nama: string };
  [key: string]: unknown;
}

export interface MateriItem {
  id: number;
  judul: string;
  deskripsi?: string;
  link_download?: string;
  mapel?: { nama: string };
  guru?: { nama: string };
  created_at?: string;
  [key: string]: unknown;
}

export interface KhsItem {
  kode_mapel?: string;
  nama_mapel?: string;
  sks?: number;
  nilai_huruf?: string;
  nilai_angka?: number;
  semester?: string | number;
  [key: string]: unknown;
}
