import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { BLACK_IMAGE_DATA_URI } from "./assets.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();
import {
  DashboardCountResponse,
  JadwalItem,
  KhsItem,
  LoginResponse,
  MateriItem,
  TugasDetailResponse,
  TugasItem,
} from "./types.js";

export interface ClientConfig {
  baseUrl?: string;
  username?: string;
  password?: string;
  token?: string;
}

export class ElearningClient {
  private http: AxiosInstance;
  private token: string | null = null;
  private username: string;
  private password: string;
  private userProfile: LoginResponse["user"] | null = null;

  constructor(config?: ClientConfig) {
    const baseUrl = config?.baseUrl || process.env.ELEARNING_URL || "https://elearning.itg.ac.id";
    this.username = config?.username || process.env.ELEARNING_USERNAME || "";
    this.password = config?.password || process.env.ELEARNING_PASSWORD || "";
    this.token = config?.token || process.env.ELEARNING_TOKEN || null;

    this.http = axios.create({
      baseURL: baseUrl,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
      timeout: 30000,
    });
  }

  public setToken(token: string) {
    this.token = token;
  }

  public getToken(): string | null {
    return this.token;
  }

  private getAuthHeader() {
    if (!this.token) {
      throw new Error("Sesi belum terautentikasi. Silakan login terlebih dahulu.");
    }
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  public async login(user?: string, pass?: string): Promise<LoginResponse> {
    const username = user || this.username || process.env.ELEARNING_USERNAME || "";
    const password = pass || this.password || process.env.ELEARNING_PASSWORD || "";

    if (!username || !password) {
      throw new Error("Username dan password wajib disediakan (melalui parameter atau konfigurasi environment).");
    }

    const response = await this.http.post<LoginResponse>("/api/auth/login", {
      username,
      password,
    });

    if (response.data.status === 1 && response.data.token) {
      this.token = response.data.token;
      this.userProfile = response.data.user;
      return response.data;
    }

    throw new Error(response.data.message || "Gagal melakukan autentikasi ke elearning.itg.ac.id");
  }

  public async ensureAuth(): Promise<void> {
    if (!this.token) {
      if (process.env.ELEARNING_TOKEN) {
        this.token = process.env.ELEARNING_TOKEN;
        return;
      }
      await this.login();
    }
  }

  public async getDashboardSummary(): Promise<DashboardCountResponse> {
    await this.ensureAuth();
    const res = await this.http.get<{ data?: DashboardCountResponse } & DashboardCountResponse>(
      "/api/student_area/dashbardo/menu/count",
      { headers: this.getAuthHeader() }
    );
    return res.data.data || res.data;
  }

  public async getProfile(): Promise<unknown> {
    await this.ensureAuth();
    const res = await this.http.get("/api/student_area/profile/user", {
      headers: this.getAuthHeader(),
    });
    return res.data;
  }

  public async getTugasList(params?: { mapel_id?: number; is_done?: string }): Promise<TugasItem[]> {
    await this.ensureAuth();
    const queryParams = {
      is_done: "all",
      ...params,
    };
    const res = await this.http.get<{ status: number; data: any[] }>("/api/student_area/tugas", {
      headers: this.getAuthHeader(),
      params: queryParams,
    });

    const rawList = res.data.data || [];
    return rawList.map((item) => {
      const d = item.detail;
      const cleanKonten = d?.konten ? d.konten.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim() : "";
      return {
        id: item.id,
        tugas_id: item.tugas_id,
        judul: d?.judul || "Tanpa Judul",
        mapel: d?.mapel?.nama || d?.kelas_mapel?.mapel?.nama || "Mata Kuliah Tidak Diketahui",
        dosen: d?.kelas_mapel?.guru?.nama || "Dosen Tidak Diketahui",
        jenis: d?.jenis || "individu",
        link_download: item.link_download || null,
        tanggal_mulai: d?.tanggal_mulai,
        tanggal_pengumpulan: d?.tanggal_pengumpulan,
        deskripsi: cleanKonten,
        status_pengerjaan: item.is_done === "y" ? "Selesai" : "Belum Dikumpulkan",
        is_done: item.is_done,
      };
    });
  }

  public async getTugasDetail(tugasId: number): Promise<TugasDetailResponse> {
    await this.ensureAuth();
    const res = await this.http.get<TugasDetailResponse>(`/api/student_area/tugas/${tugasId}`, {
      headers: this.getAuthHeader(),
    });
    return res.data;
  }

  public async authorizeTugasPhoto(tugasId: number, customDataUri?: string): Promise<{ status: number; message: string }> {
    await this.ensureAuth();
    const payload = {
      avatar: customDataUri || BLACK_IMAGE_DATA_URI,
      tugas_id: tugasId,
    };

    const res = await this.http.post<{ status: number; message: string }>(
      "/api/student_area/tugas/foto_siswa",
      payload,
      { headers: this.getAuthHeader() }
    );
    return res.data;
  }

  public async uploadTugasFile(tugasId: number, filePath: string): Promise<{ status: number; message?: string }> {
    await this.ensureAuth();

    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Berkas tidak ditemukan pada direktori: ${resolvedPath}`);
    }

    const form = new FormData();
    form.append("file", fs.createReadStream(resolvedPath));
    form.append("tugas_id", String(tugasId));

    const headers = {
      ...this.getAuthHeader(),
      ...form.getHeaders(),
    };

    const res = await this.http.post<{ status: number; message?: string }>(
      "/api/student_area/tugas/upload/file",
      form,
      {
        headers,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );
    return res.data;
  }

  public async submitTugasLink(
    tugasId: number,
    linkDownload: string
  ): Promise<{ status: number; message: string }> {
    await this.ensureAuth();
    const res = await this.http.post<{ status: number; message: string }>(
      "/api/student_area/tugas",
      {
        tugas_id: tugasId,
        link_download: linkDownload,
      },
      { headers: this.getAuthHeader() }
    );
    return res.data;
  }

  public async setTugasDone(tugasId: number): Promise<{ status: number; message?: string }> {
    await this.ensureAuth();
    const res = await this.http.put<{ status: number; message?: string }>(
      `/api/student_area/tugas/set_done/${tugasId}`,
      {},
      { headers: this.getAuthHeader() }
    );
    return res.data;
  }

  public async submitTugasComplete(
    tugasId: number,
    filePath: string,
    autoBypassPhoto: boolean = true
  ): Promise<{
    photoBypassed: boolean;
    uploadStatus: number;
    finalStatus: number;
    message: string;
  }> {
    await this.ensureAuth();

    // 1. Cek detail tugas dan syarat otorisasi
    const detail = await this.getTugasDetail(tugasId);
    let photoBypassed = false;

    if (detail.status === 2) {
      if (!autoBypassPhoto) {
        throw new Error(
          `Tugas ID ${tugasId} memerlukan otorisasi foto webcam (status: 2). Atur autoBypassPhoto ke true untuk mengirim frame hitam.`
        );
      }
      const authRes = await this.authorizeTugasPhoto(tugasId);
      if (authRes.status !== 1) {
        throw new Error(`Gagal mengirim foto otorisasi: ${authRes.message}`);
      }
      photoBypassed = true;
    }

    // 2. Unggah berkas tugas
    const uploadRes = await this.uploadTugasFile(tugasId, filePath);
    if (uploadRes.status !== 1) {
      throw new Error(`Gagal mengunggah berkas: ${uploadRes.message || "Unknown error"}`);
    }

    // 3. Finalisasi status selesai
    const finalRes = await this.setTugasDone(tugasId);
    if (finalRes.status !== 1) {
      throw new Error(`Gagal menandai tugas selesai: ${finalRes.message || "Unknown error"}`);
    }

    return {
      photoBypassed,
      uploadStatus: uploadRes.status,
      finalStatus: finalRes.status,
      message: `Tugas ID ${tugasId} berhasil diunggah (${path.basename(filePath)}) dan ditandai selesai.`,
    };
  }

  public async getJadwal(): Promise<JadwalItem[]> {
    await this.ensureAuth();
    const res = await this.http.get<{ status: number; data: JadwalItem[] }>("/api/student_area/jadwal", {
      headers: this.getAuthHeader(),
    });
    return res.data.data || [];
  }

  public async getMateri(params?: { mapel_id?: number }): Promise<MateriItem[]> {
    await this.ensureAuth();
    const res = await this.http.get<{ data: MateriItem[]; total?: number }>("/api/student_area/materi", {
      headers: this.getAuthHeader(),
      params,
    });
    return res.data.data || [];
  }

  public async getPengumuman(): Promise<unknown[]> {
    await this.ensureAuth();
    const res = await this.http.get<{ data: unknown[] }>("/api/student_area/pengumuman", {
      headers: this.getAuthHeader(),
    });
    return res.data.data || [];
  }

  public async getKhs(semester?: number | string): Promise<KhsItem[]> {
    await this.ensureAuth();
    const res = await this.http.get<{ status: number; data: KhsItem[] }>("/api/student_area/khs", {
      headers: this.getAuthHeader(),
      params: semester ? { semester } : undefined,
    });
    return res.data.data || [];
  }
}
