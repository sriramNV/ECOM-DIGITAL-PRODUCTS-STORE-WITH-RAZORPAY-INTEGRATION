import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PrintifyError } from "../client";

describe("PrintifyError", () => {
  it("creates error with status and message", () => {
    const err = new PrintifyError(401, "Unauthorized");
    expect(err.status).toBe(401);
    expect(err.message).toBe("Unauthorized");
    expect(err.name).toBe("PrintifyError");
  });

  it("carries optional body", () => {
    const err = new PrintifyError(400, "Bad request", { reason: "invalid" });
    expect(err.body).toEqual({ reason: "invalid" });
  });

  it("is instance of Error", () => {
    const err = new PrintifyError(500, "Server error");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("printifyClient.request", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET request with auth header", async () => {
    process.env.PRINTIFY_API_TOKEN = "test-token";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
      headers: new Map(),
    });

    const { printifyClient } = await import("../client");
    await printifyClient.request({ method: "GET", path: "/shops/1/products.json" });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.printify.com/v1/shops/1/products.json",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  it("retries on 429 with Retry-After header", async () => {
    process.env.PRINTIFY_API_TOKEN = "test-token";
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([["Retry-After", "1"]]),
        json: () => Promise.resolve(null),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
        headers: new Map(),
      });

    const { printifyClient } = await import("../client");
    vi.useFakeTimers();
    const promise = printifyClient.request({ method: "GET", path: "/shops/1/products.json" });
    await vi.runAllTimersAsync();
    const result = await promise;
    vi.useRealTimers();

    expect(result).toEqual({ data: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws PrintifyError on non-ok response", async () => {
    process.env.PRINTIFY_API_TOKEN = "test-token";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Map(),
      json: () => Promise.resolve({ error: "Internal error" }),
    });

    const { printifyClient, PrintifyError: ImportedError } = await import("../client");
    await expect(printifyClient.request({ method: "POST", path: "/shops/1/orders.json", body: {} }))
      .rejects.toThrow(ImportedError);
  });

  it("handles missing API token gracefully", async () => {
    delete process.env.PRINTIFY_API_TOKEN;
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Map(),
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    const { printifyClient, PrintifyError: ImportedError } = await import("../client");
    const err = await printifyClient.request({ method: "GET", path: "/shops/1/products.json" }).catch((e: Error) => e);
    expect(err).toBeInstanceOf(ImportedError);
    expect((err as any).status).toBe(401);
  });

  it("aborts on timeout", async () => {
    process.env.PRINTIFY_API_TOKEN = "test-token";
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (_url: string, opts: RequestInit) => {
      await new Promise((_, reject) => {
        const signal = opts.signal as AbortSignal;
        signal.addEventListener("abort", () => reject(new Error("The user aborted a request.")));
      });
    });

    const { printifyClient } = await import("../client");
    vi.useFakeTimers();
    const promise = printifyClient.request({ method: "GET", path: "/shops/1/products.json" });
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toThrow("aborted");
    vi.useRealTimers();
  });
});
