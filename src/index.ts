#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { ElearningClient } from "./client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const client = new ElearningClient();

const server = new Server(
  {
    name: "elearning-itg-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "elearning_login",
        description:
          "Melakukan autentikasi ke elearning.itg.ac.id menggunakan NIM/Username dan Password. Token sesi disimpan otomatis di memori klien.",
        inputSchema: {
          type: "object",
          properties: {
            username: {
              type: "string",
              description: "NIM atau username akun E-Learning (opsional jika sudah diatur di .env)",
            },
            password: {
              type: "string",
              description: "Kata sandi akun E-Learning (opsional jika sudah diatur di .env)",
            },
          },
        },
      },
      {
        name: "elearning_get_dashboard",
        description:
          "Mengambil ringkasan indikator dashboard E-Learning ITG (jumlah tugas aktif yang belum dikerjakan, evaluasi, materi daring, dan pengumuman).",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "elearning_list_tugas",
        description:
          "Mengambil daftar tugas kuliah mahasiswa beserta informasi tenggat waktu (deadline), mata kuliah, dosen, dan status pengerjaan.",
        inputSchema: {
          type: "object",
          properties: {
            mapel_id: {
              type: "number",
              description: "Filter opsional berdasarkan ID mata kuliah tertentu",
            },
          },
        },
      },
      {
        name: "elearning_get_tugas_detail",
        description:
          "Mengambil rincian instruksi tugas, berkas lampiran dosen, dan memeriksa apakah tugas tersebut mengunci pengunggahan dengan syarat otorisasi foto wajah (status 2).",
        inputSchema: {
          type: "object",
          properties: {
            tugas_id: {
              type: "number",
              description: "ID tugas yang ingin dilihat rinciannya",
            },
          },
          required: ["tugas_id"],
        },
      },
      {
        name: "elearning_submit_tugas",
        description:
          "Mengunggah berkas jawaban tugas mahasiswa ke sistem, melakukan bypass frame hitam otomatis jika tugas meminta otorisasi foto webcam, dan menyelesaikan pengumpulan.",
        inputSchema: {
          type: "object",
          properties: {
            tugas_id: {
              type: "number",
              description: "ID tugas mahasiswa (item.id atau tugas_id) yang akan dikumpulkan",
            },
            file_path: {
              type: "string",
              description: "Path absolut atau relatif ke file lokal yang hendak diunggah (misal .pdf, .docx, .zip)",
            },
            bypass_photo: {
              type: "boolean",
              description:
                "Jika true (default), otomatis mengirim frame citra JPEG hitam valid ke endpoint foto_siswa bila tugas berada pada status 2 (kamera wajib).",
              default: true,
            },
          },
          required: ["tugas_id", "file_path"],
        },
      },
      {
        name: "elearning_submit_tugas_link",
        description:
          "Mengunggah tautan jawaban tugas mahasiswa (seperti link Google Drive, GitHub, YouTube, dsb.) langsung ke tugas dan otomatis menyelesaikan status pengumpulan.",
        inputSchema: {
          type: "object",
          properties: {
            tugas_id: {
              type: "number",
              description: "ID tugas mahasiswa (item.id dari list tugas, misal 454692) yang akan dikumpulkan",
            },
            link: {
              type: "string",
              description: "URL tautan jawaban tugas (misal https://drive.google.com/...)",
            },
          },
          required: ["tugas_id", "link"],
        },
      },
      {
        name: "elearning_get_jadwal",
        description: "Mengambil jadwal perkuliahan mingguan mahasiswa lengkap dengan jam, ruangan, dan dosen pengampu.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "elearning_get_materi",
        description: "Mengambil daftar materi perkuliahan yang diunggah dosen beserta tautan unduhan berkas.",
        inputSchema: {
          type: "object",
          properties: {
            mapel_id: {
              type: "number",
              description: "Filter opsional berdasarkan ID mata kuliah",
            },
          },
        },
      },
      {
        name: "elearning_get_khs",
        description: "Mengambil Kartu Hasil Studi (KHS), daftar nilai, dan perolehan SKS mahasiswa per semester.",
        inputSchema: {
          type: "object",
          properties: {
            semester: {
              type: "string",
              description: "Nomor atau identifikasi semester (contoh: '1', '2', 'Ganjil', 'Genap')",
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "elearning_login": {
        const username = args?.username as string | undefined;
        const password = args?.password as string | undefined;
        const result = await client.login(username, password);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  message: result.message || "Berhasil login ke E-Learning ITG.",
                  user: result.user,
                  tokenPreview: result.token ? result.token.slice(0, 15) + "..." : null,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "elearning_get_dashboard": {
        const summary = await client.getDashboardSummary();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      case "elearning_list_tugas": {
        const mapelId = args?.mapel_id as number | undefined;
        const isDone = args?.is_done as string | undefined;
        const tugasList = await client.getTugasList({ mapel_id: mapelId, is_done: isDone });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(tugasList, null, 2),
            },
          ],
        };
      }

      case "elearning_get_tugas_detail": {
        const tugasId = Number(args?.tugas_id);
        if (!tugasId) {
          throw new McpError(ErrorCode.InvalidParams, "tugas_id wajib diisi berupa angka.");
        }
        const detail = await client.getTugasDetail(tugasId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(detail, null, 2),
            },
          ],
        };
      }

      case "elearning_submit_tugas": {
        const tugasId = Number(args?.tugas_id);
        const filePath = String(args?.file_path);
        const bypassPhoto = args?.bypass_photo !== undefined ? Boolean(args?.bypass_photo) : true;

        if (!tugasId || !filePath) {
          throw new McpError(ErrorCode.InvalidParams, "tugas_id dan file_path wajib diisi.");
        }

        const result = await client.submitTugasComplete(tugasId, filePath, bypassPhoto);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "elearning_submit_tugas_link": {
        const tugasId = Number(args?.tugas_id);
        const link = String(args?.link);

        if (!tugasId || !link) {
          throw new McpError(ErrorCode.InvalidParams, "tugas_id dan link wajib diisi.");
        }

        const result = await client.submitTugasLink(tugasId, link);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "elearning_get_jadwal": {
        const jadwal = await client.getJadwal();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(jadwal, null, 2),
            },
          ],
        };
      }

      case "elearning_get_materi": {
        const mapelId = args?.mapel_id as number | undefined;
        const materi = await client.getMateri({ mapel_id: mapelId });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(materi, null, 2),
            },
          ],
        };
      }

      case "elearning_get_khs": {
        const semester = args?.semester as string | number | undefined;
        const khs = await client.getKhs(semester);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(khs, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Tool '${name}' tidak dikenali.`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error saat mengeksekusi '${name}': ${errorMessage}`,
        },
      ],
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("E-Learning ITG MCP server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
