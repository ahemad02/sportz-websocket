import { Router } from "express";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { matchIdParamSchema } from "../validation/matches.js";

import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary.js";
import { desc, eq } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.post("/", async (req, res) => {
  const paramResult = matchIdParamSchema.safeParse(req.params);

  if (!paramResult.success) {
    return res.status(400).json({
      message: "Invalid matchId",
      details: paramResult.error.issues,
    });
  }

  const bodyResult = createCommentarySchema.safeParse(req.body);

  if (!bodyResult.success) {
    return res.status(400).json({
      message: "Invalid request",
      details: bodyResult.error.issues,
    });
  }

  try {
    const { minute, ...rest } = bodyResult.data;

    const [result] = await db
      .insert(commentary)
      .values({
        matchId: paramResult.data.id,
        minute,
        ...rest,
      })
      .returning();

    if (res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(result.matchId, result);
    }

    return res.status(201).json({
      message: "Commentary created",
      data: result,
    });
  } catch (error) {
    console.error("Create commentary error:", error);

    return res.status(500).json({
      message: "Failed to create commentary",
    });
  }
});

commentaryRouter.get("/", async (req, res) => {
  const MAX_LIMIT = 100;

  const paramResult = matchIdParamSchema.safeParse(req.params);

  if (!paramResult.success) {
    return res.status(400).json({
      error: "invalid request parameters",
      details: paramResult.error.issues,
    });
  }

  const queryResult = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    return res.status(400).json({
      error: "invalid query parameters",
      details: parsedQuery.error.issues,
    });
  }

  try {
    const { id: matchId } = paramResult.data;

    const { limit = 10 } = queryResult.data;

    const safeLimit = Math.min(limit, MAX_LIMIT);

    const results = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(safeLimit);

    return res.status(200).json({
      data: results,
    });
  } catch (error) {
    console.error("List commentary error:", error);

    return res.status(500).json({
      error: "failed to list commentary",
    });
  }
});
