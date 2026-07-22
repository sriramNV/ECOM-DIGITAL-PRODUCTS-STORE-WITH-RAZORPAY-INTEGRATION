import { describe, it, expect } from "vitest";
import { h } from "../html-escape";

describe("html-escape", () => {
  it("escapes ampersands", () => {
    expect(h("A & B")).toBe("A &amp; B");
  });

  it("escapes less-than", () => {
    expect(h("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes greater-than", () => {
    expect(h("a > b")).toBe("a &gt; b");
  });

  it("escapes double quotes", () => {
    expect(h('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes all special characters", () => {
    expect(h('<a href="x"> & </a>')).toBe("&lt;a href=&quot;x&quot;&gt; &amp; &lt;/a&gt;");
  });

  it("passes through safe strings", () => {
    expect(h("hello world")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(h("")).toBe("");
  });

  it("handles numbers as strings", () => {
    expect(h("123")).toBe("123");
  });
});
