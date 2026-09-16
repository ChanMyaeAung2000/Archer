import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { conflict, forbidden, notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const currency = z.enum(["USD", "MMK"]);

const createJobSchema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(20).max(10000),
  category: z.string().trim().max(80).optional(),
  budgetAmount: z.number().int().positive(),
  budgetCurrency: currency,
  deadline: z.coerce.date().optional(),
  skillIds: z.array(z.string().uuid()).max(20).default([])
});

const jobSummary = {
  id: true,
  title: true,
  description: true,
  category: true,
  budgetAmount: true,
  budgetCurrency: true,
  status: true,
  deadline: true,
  createdAt: true,
  publishedAt: true,
  client: { select: { id: true, profile: { select: { name: true, avatarUrl: true } } } },
  skills: { include: { skill: true } }
} as const;

router.get("/", asyncHandler(async (request, response) => {
  const query = z.object({
    q: z.string().trim().max(100).optional(),
    currency: currency.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  }).parse(request.query);

  const where = {
    status: "PUBLISHED",
    ...(query.currency ? { budgetCurrency: query.currency } : {}),
    ...(query.q ? { OR: [{ title: { contains: query.q } }, { description: { contains: query.q } }] } : {})
  };
  const [items, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      select: jobSummary,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.job.count({ where })
  ]);

  response.json({
    data: items,
    meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) }
  });
}));

router.get("/:id", asyncHandler(async (request, response) => {
  const jobId = request.params.id;
  if (!jobId || Array.isArray(jobId)) throw notFound("Job not found");
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: jobSummary });
  if (!job) throw notFound("Job not found");
  response.json({ data: job });
}));

router.post("/", requireAuth, requireRole("CLIENT"), asyncHandler(async (request, response) => {
  const input = createJobSchema.parse(request.body);
  if (input.skillIds.length) {
    const skills = await prisma.skill.count({ where: { id: { in: input.skillIds } } });
    if (skills !== input.skillIds.length) throw conflict("One or more skills do not exist");
  }
  const job = await prisma.job.create({
    data: {
      clientId: request.auth!.userId,
      title: input.title,
      description: input.description,
      category: input.category,
      budgetAmount: input.budgetAmount,
      budgetCurrency: input.budgetCurrency,
      deadline: input.deadline,
      skills: { create: input.skillIds.map((skillId) => ({ skill: { connect: { id: skillId } } })) }
    },
    select: jobSummary
  });
  response.status(201).json({ data: job });
}));

router.post("/:id/publish", requireAuth, requireRole("CLIENT"), asyncHandler(async (request, response) => {
  const jobId = request.params.id;
  if (!jobId || Array.isArray(jobId)) throw notFound("Job not found");
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw notFound("Job not found");
  if (job.clientId !== request.auth!.userId) throw forbidden();
  if (job.status !== "DRAFT") throw conflict("Only draft jobs can be published");

  const published = await prisma.job.update({
    where: { id: job.id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
    select: jobSummary
  });
  response.json({ data: published });
}));

export default router;
