import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createAraaReport, listAraaReports } from "./db";
import { analyzeAraaEvidence } from "./araa-core";

const MAX_EVIDENCE_BYTES = 256 * 1024;
const evidenceInput = z.object({ evidence: z.unknown() }).strict();
const reportMetadataInput = z.object({ score: z.number().int().min(0).max(100), level: z.string().max(32), datasetVersion: z.string().max(32), matchedCount: z.number().int().min(0).max(1000), findingCount: z.number().int().min(0).max(1000), reportMetadata: z.string().max(32 * 1024) }).strict();

function validateEvidenceSize(evidence: unknown) {
  const serialized = JSON.stringify(evidence ?? {});
  if (serialized.length > MAX_EVIDENCE_BYTES) {
    throw new Error("Evidence melebihi batas 256 KB.");
  }
  return evidence;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  araa: router({
    analyze: publicProcedure.input(evidenceInput).mutation(({ input }) => {
      try {
        validateEvidenceSize(input.evidence);
        return analyzeAraaEvidence(input.evidence as Record<string, unknown>);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Evidence tidak dapat dianalisis.";
        throw new Error(message);
      }
    }),
    saveMetadata: protectedProcedure.input(reportMetadataInput).mutation(async ({ ctx, input }) => {
      const id = await createAraaReport({ ...input, userId: ctx.user.id });
      return { success: true, id };
    }),
    listSaved: protectedProcedure.query(({ ctx }) => listAraaReports(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
