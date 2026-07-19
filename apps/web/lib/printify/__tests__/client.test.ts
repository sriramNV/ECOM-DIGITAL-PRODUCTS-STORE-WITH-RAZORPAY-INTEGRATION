// lib/printify/__tests__/client.test.ts
import { describe, it, expect } from "vitest";
import { PrintifyError } from "../client";

describe("PrintifyError", () => {
  it("creates error with status and message", () => {
    const err = new PrintifyError(401, "Unauthorized");
    expect(err.status).toBe(401);
    expect(err.message).toBe("Unauthorized");
    expect(err.name).toBe("PrintifyError");
  });
});
