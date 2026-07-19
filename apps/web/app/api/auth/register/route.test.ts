import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000/api/auth";

describe("POST /api/auth/register", () => {
  it("rejects invalid email", async () => {
    const res = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", email: "not-an-email", password: "password123" }),
    });
    expect(res.status).toBe(422);
  });

  it("rejects short password", async () => {
    const res = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", email: "test@test.com", password: "123" }),
    });
    expect(res.status).toBe(422);
  });
});
