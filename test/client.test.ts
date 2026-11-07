import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { ElearningClient } from "../src/client.js";

vi.mock("axios");

describe("ElearningClient", () => {
  let client: ElearningClient;

  beforeEach(() => {
    vi.clearAllMocks();
    (axios.create as any).mockReturnValue({
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
    });
    client = new ElearningClient({
      baseUrl: "https://elearning.itg.ac.id",
      username: "2206001",
      password: "secretpassword",
    });
  });

  it("initializes client properly", () => {
    expect(client).toBeDefined();
    expect(client.getToken()).toBeNull();
  });

  it("updates and retrieves session token correctly", () => {
    client.setToken("mock-session-token-12345");
    expect(client.getToken()).toBe("mock-session-token-12345");
  });

  it("handles login flow successfully when API returns status 1", async () => {
    const mockPost = vi.fn().mockResolvedValue({
      data: {
        status: 1,
        token: "jwt-token-abcdef",
        message: "Login Berhasil",
        user: {
          id: 101,
          name: "Mahasiswa ITG",
          username: "2206001",
        },
      },
    });

    (client as any).http = { post: mockPost };

    const result = await client.login("2206001", "secretpassword");
    expect(result.status).toBe(1);
    expect(result.token).toBe("jwt-token-abcdef");
    expect(client.getToken()).toBe("jwt-token-abcdef");
  });

  it("throws descriptive error when login API returns failure", async () => {
    const mockPost = vi.fn().mockResolvedValue({
      data: {
        status: 0,
        message: "Username atau Password salah!",
      },
    });

    (client as any).http = { post: mockPost };

    await expect(client.login("wrong_user", "wrong_pass")).rejects.toThrow(
      "Username atau Password salah!"
    );
  });
});
