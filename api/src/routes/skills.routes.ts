import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/async-handler.js";

const router = Router();

router.get("/", asyncHandler(async (request, response) => {
  const query = z.object({ q: z.string().trim().max(80).optional() }).parse(request.query);
  const skills = await prisma.skill.findMany({
    where: query.q ? { name: { contains: query.q } } : undefined,
    orderBy: { name: "asc" },
    take: 100
  });
  response.json({ data: skills });
}));

export default router;
