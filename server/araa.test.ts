import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function caller() {
  const ctx = {
    user: undefined,
    req: { protocol: "https", headers: {} },
    res: { clearCookie: () => undefined },
  } as unknown as TrpcContext;
  return appRouter.createCaller(ctx);
}

describe("araa.analyze cloud endpoint", () => {
  it("runs the standalone engine and returns dataset metadata", async () => {
    const result = await caller().araa.analyze({ evidence: { errors: ["G1006"], manifest: { files: ["index.html"] } } });
    expect(result.identity.name).toBe("A Core Raa");
    expect(result.identity.externalAI).toBe(false);
    expect(result.dataset.caseCount).toBeGreaterThanOrEqual(20);
    expect(result.dataset.matched.some((item: { id: string }) => item.id === "URL-G1006")).toBe(true);
  });

  it("rejects evidence over the payload limit", async () => {
    await expect(caller().araa.analyze({ evidence: { blob: "x".repeat(257 * 1024) } })).rejects.toThrow("256 KB");
  });
});
