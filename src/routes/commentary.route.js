import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { matchIdParamSchema } from "../validation/matches.js";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary.js";

const MAX_LIMIT = 100;

const router = Router({ mergeParams: true });

router.get("/:matchId/commentary", async (req, res) => {
  const parsedParams = matchIdParamSchema.safeParse({ id: req.params.matchId });
  if (!parsedParams.success) {
    return res.status(400).json({
      message: "Invalid match ID",
      details: parsedParams.error.issues,
    });
  }

  const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({
      message: "Invalid query parameters",
      details: parsedQuery.error.issues,
    });
  }

  const limit = Math.min(parsedQuery.data.limit ?? MAX_LIMIT, MAX_LIMIT);

  try {
    const results = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, parsedParams.data.id))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    return res.status(200).json({ data: results });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch commentary",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post("/:matchId/commentary", async (req, res) => {
  const parsedParams = matchIdParamSchema.safeParse({ id: req.params.matchId });
  if (!parsedParams.success) {
    return res.status(400).json({
      message: "Invalid match ID",
      details: parsedParams.error.issues,
    });
  }

  const parsedBody = createCommentarySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({
      message: "Invalid payload",
      details: parsedBody.error.issues,
    });
  }

  try {
    const [entry] = await db
      .insert(commentary)
      .values({
        matchId: parsedParams.data.id,
        ...parsedBody.data,
      })
      .returning();

    return res.status(201).json({ data: entry });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create commentary entry",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
