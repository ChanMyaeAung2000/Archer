import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const profileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  headline: z.string().trim().max(160).nullable().optional(),
  bio: z.string().trim().max(5000).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
  timezone: z.string().trim().max(80).nullable().optional(),
  languages: z.string().trim().max(200).nullable().optional()
});

router.get("/me", requireAuth, asyncHandler(async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.auth!.userId },
    select: { id: true, email: true, role: true, status: true, profile: true, createdAt: true }
  });
  if (!user) throw notFound("User not found");
  response.json({ data: user });
}));

router.patch("/me/profile", requireAuth, asyncHandler(async (request, response) => {
  const input = profileSchema.parse(request.body);
  const profile = await prisma.profile.upsert({
    where: { userId: request.auth!.userId },
    create: { userId: request.auth!.userId, name: input.name ?? "Archer user", ...input },
    update: input
  });
  response.json({ data: profile });
}));

export default router;
