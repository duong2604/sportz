import { Router } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm";
const router = Router();

const MAX_LIMIT = 100;

router.get("/", async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Invalid payload", details: parsed.error.issues });
  }

  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);
  try {
    const results = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    return res.status(200).json({ data: results });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get list of matches",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post("/", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid payload",
      details: parsed.error.issues,
    });
  }
  try {
    const {
      data: { homeScore, awayScore, endTime, startTime },
    } = parsed;

    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();

    if (res.app.locals.broadcastMatchCreated) {
      res.app.locals.broadcastMatchCreated(event);
    }

    return res.status(201).json({ data: event });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create match",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
