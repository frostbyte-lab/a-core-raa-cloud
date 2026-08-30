import { describe, expect, it } from "vitest";
import { analyzeAraaEvidence, redactAraaEvidence } from "./araa-core";
import { ARAA_CASE_DATASET, matchAraaDataset } from "./araa-dataset";

describe("A Core Raa rules engine", () => {
  it("redacts credential-like fields recursively", () => {
    const safe = redactAraaEvidence({ token: "secret", nested: { authorization: "bearer", ok: "kept" } });
    expect(safe).toEqual({ token: "[redacted]", nested: { authorization: "[redacted]", ok: "kept" } });
  });

  it("calculates a bounded score and level from blockers", () => {
    const report = analyzeAraaEvidence({ errors: ["G1006"], protectedResources: ["license"], missingAssets: ["main.js"] });
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.level).toBe("BLOCKED");
    expect(report.priorities.map((item) => item.findingId)).toEqual(expect.arrayContaining(["ARAA-ASSET", "ARAA-ERROR", "ARAA-PROTECTED"]));
  });

  it("matches dataset patterns from evidence text", () => {
    expect(ARAA_CASE_DATASET.length).toBeGreaterThanOrEqual(20);
    const matches = matchAraaDataset(["service worker cache", "wss://game", "integrity sha256"]);
    expect(matches.map((item) => item.id)).toEqual(expect.arrayContaining(["CACHE-SW", "API-WEBSOCKET", "ASSET-HASH"]));
    expect(matches.every((item) => item.confidence >= 0 && item.confidence <= 1)).toBe(true);
  });

  it("reports evidence gaps rather than inventing readiness", () => {
    const report = analyzeAraaEvidence({});
    expect(report.findings.map((item) => item.id)).toEqual(expect.arrayContaining(["ARAA-MANIFEST", "ARAA-INTEGRITY", "ARAA-GRAPH"]));
    expect(report.explainability.evidenceBound).toBe(true);
    expect(report.explainability.externalProvider).toBe(false);
  });
});
