import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  comparePassword,
  createAccessToken,
  createRefreshToken,
  hashPassword,
  hashToken,
  refreshExpiry,
  verifyRefreshToken,
  type UserRole
} from "../lib/auth.js";
import { conflict, unauthorized } from "../lib/errors.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const credentialsSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8).max(128)
});

const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(100),
  role: z.enum(["CLIENT", "FREELANCER"]).default("FREELANCER")
});

const publicUser = (user: { id: string; email: string; role: string; profile: unknown }) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  profile: user.profile
});

const issueTokens = async (userId: string, role: UserRole) => {
  const session = await prisma.refreshSession.create({
    data: {
      userId,
      tokenHash: "pending",
      expiresAt: refreshExpiry()
    }
  });
  const refreshToken = createRefreshToken(userId, session.id);
  await prisma.refreshSession.update({
    where: { id: session.id },
    data: { tokenHash: hashToken(refreshToken) }
  });
  return {
    accessToken: createAccessToken(userId, role),
    refreshToken
  };
};

router.post("/register", asyncHandler(async (request, response) => {
  const input = registerSchema.parse(request.body);
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw conflict("An account with this email already exists");
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      profile: { create: { name: input.name } }
    },
    include: { profile: true }
  });

  const tokens = await issueTokens(user.id, input.role);
  response.status(201).json({ data: { user: publicUser(user), ...tokens } });
}));

router.post("/login", asyncHandler(async (request, response) => {
  const input = credentialsSchema.parse(request.body);
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { profile: true }
  });
  if (!user || user.status !== "ACTIVE" || !(await comparePassword(input.password, user.passwordHash))) {
    throw unauthorized("Invalid email or password");
  }

  const tokens = await issueTokens(user.id, user.role as UserRole);
  response.json({ data: { user: publicUser(user), ...tokens } });
}));

router.post("/refresh", asyncHandler(async (request, response) => {
  const refreshToken = z.object({ refreshToken: z.string().min(1) }).parse(request.body).refreshToken;
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw unauthorized("Invalid or expired refresh token");
  }

  if (payload.type !== "refresh" || typeof payload.sub !== "string" || typeof payload.sid !== "string") {
    throw unauthorized("Invalid refresh token");
  }

  const session = await prisma.refreshSession.findUnique({
    where: { id: payload.sid },
    include: { user: true }
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || session.tokenHash !== hashToken(refreshToken)) {
    throw unauthorized("Refresh session is no longer valid");
  }

  await prisma.refreshSession.delete({ where: { id: session.id } });
  const tokens = await issueTokens(session.user.id, session.user.role as UserRole);
  response.json({ data: tokens });
}));

router.post("/logout", requireAuth, asyncHandler(async (request, response) => {
  const refreshToken = z.object({ refreshToken: z.string().min(1) }).safeParse(request.body).data?.refreshToken;
  if (refreshToken) {
    await prisma.refreshSession.updateMany({
      where: { userId: request.auth!.userId, tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
  response.status(204).send();
}));

router.get("/me", requireAuth, asyncHandler(async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.auth!.userId },
    include: { profile: true }
  });
  if (!user) throw unauthorized();
  response.json({ data: { user: publicUser(user) } });
}));

export default router;
