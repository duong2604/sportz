import { z } from "zod";

export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().positive().max(100).optional(),
});

export const createCommentarySchema = z.object({
  minute:    z.number().int().nonnegative().optional(),
  sequence:  z.number().int().optional(),
  period:    z.string().max(50).optional(),
  eventType: z.string().min(1).max(50),
  actor:     z.string().max(100).optional(),
  team:      z.string().max(100).optional(),
  message:   z.string().min(1),
  metadata:  z.record(z.string(), z.unknown()).optional(),
  tags:      z.array(z.string()).optional(),
});
