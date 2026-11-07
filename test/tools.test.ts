import { describe, it, expect } from "vitest";
import { TOOLS } from "../src/index.js";

describe("MCP Tools Declaration & Annotations", () => {
  it("declares exactly 9 tools", () => {
    expect(TOOLS).toHaveLength(9);
  });

  it("ensures every tool has name, description, and inputSchema", () => {
    for (const tool of TOOLS) {
      expect(typeof tool.name).toBe("string");
      expect(tool.name.length).toBeGreaterThan(0);
      expect(typeof tool.description).toBe("string");
      expect(tool.description.length).toBeGreaterThan(0);
      expect(typeof tool.inputSchema).toBe("object");
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("ensures all 4 hints (readOnlyHint, destructiveHint, idempotentHint, openWorldHint) are explicit booleans on all tools", () => {
    const hintKeys = [
      "readOnlyHint",
      "destructiveHint",
      "idempotentHint",
      "openWorldHint",
    ] as const;

    for (const tool of TOOLS) {
      expect(tool.annotations).toBeDefined();
      for (const key of hintKeys) {
        expect(
          typeof tool.annotations[key],
          `Tool "${tool.name}" missing boolean hint "${key}"`
        ).toBe("boolean");
      }
    }
  });
});
