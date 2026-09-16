import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { conflict, forbidden, notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const currency = z.enum(["USD", "MMK"]);

const createProposalSchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().trim().min(20).max(10000),
  bidAmount: z.number().int().positive(),
  bidCurrency: currency,
  estimatedDays: z.number().int().positive().max(365).optional()
});

const proposalSelect = {
  id: true,
  coverLetter: true,
  bidAmount: true,
  bidCurrency: true,
  estimatedDays: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  freelancer: { select: { id: true, email: true, profile: true } },
  job: {
    select: {
      id: true,
      title: true,
      description: true,
      budgetAmount: true,
      budgetCurrency: true,
      status: true,
      clientId: true,
      client: { select: { id: true, email: true, profile: true } }
    }
  }
} as const;

const createNotification = (userId: string, type: string, title: string, payload: Record<string, string>) => ({
  userId,
  type,
  title,
  payload: JSON.stringify(payload)
});

router.get("/mine", requireAuth, requireRole("FREELANCER"), asyncHandler(async (request, response) => {
  const proposals = await prisma.proposal.findMany({
    where: { freelancerId: request.auth!.userId },
    select: proposalSelect,
    orderBy: { createdAt: "desc" }
  });
  response.json({ data: proposals });
}));

router.get("/received", requireAuth, requireRole("CLIENT"), asyncHandler(async (request, response) => {
  const proposals = await prisma.proposal.findMany({
    where: { job: { clientId: request.auth!.userId } },
    select: proposalSelect,
    orderBy: { createdAt: "desc" }
  });
  response.json({ data: proposals });
}));

router.get("/:id", requireAuth, asyncHandler(async (request, response) => {
  const proposalId = request.params.id;
  if (!proposalId || Array.isArray(proposalId)) throw notFound("Proposal not found");
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId }, select: proposalSelect });
  if (!proposal) throw notFound("Proposal not found");
  const canView = proposal.freelancer.id === request.auth!.userId || proposal.job.clientId === request.auth!.userId;
  if (!canView) throw forbidden();
  response.json({ data: proposal });
}));

router.post("/", requireAuth, requireRole("FREELANCER"), asyncHandler(async (request, response) => {
  const input = createProposalSchema.parse(request.body);
  const job = await prisma.job.findUnique({
    where: { id: input.jobId },
    select: { id: true, clientId: true, title: true, status: true }
  });
  if (!job) throw notFound("Job not found");
  if (job.status !== "PUBLISHED") throw conflict("Only published jobs accept proposals");
  if (job.clientId === request.auth!.userId) throw forbidden("You cannot propose on your own job");

  const existing = await prisma.proposal.findUnique({ where: { jobId_freelancerId: { jobId: job.id, freelancerId: request.auth!.userId } } });
  if (existing) throw conflict("You have already submitted a proposal for this job");

  const proposal = await prisma.$transaction(async (transaction) => {
    const created = await transaction.proposal.create({
      data: {
        jobId: job.id,
        freelancerId: request.auth!.userId,
        coverLetter: input.coverLetter,
        bidAmount: input.bidAmount,
        bidCurrency: input.bidCurrency,
        estimatedDays: input.estimatedDays
      },
      select: proposalSelect
    });
    await transaction.notification.create({
      data: createNotification(job.clientId, "NEW_PROPOSAL", `New proposal for ${job.title}`, { proposalId: created.id, jobId: job.id })
    });
    return created;
  });

  response.status(201).json({ data: proposal });
}));

router.post("/:id/withdraw", requireAuth, requireRole("FREELANCER"), asyncHandler(async (request, response) => {
  const proposalId = request.params.id;
  if (!proposalId || Array.isArray(proposalId)) throw notFound("Proposal not found");
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw notFound("Proposal not found");
  if (proposal.freelancerId !== request.auth!.userId) throw forbidden();
  if (proposal.status !== "SUBMITTED") throw conflict("Only submitted proposals can be withdrawn");
  const updated = await prisma.proposal.update({ where: { id: proposal.id }, data: { status: "WITHDRAWN" }, select: proposalSelect });
  response.json({ data: updated });
}));

router.post("/:id/reject", requireAuth, requireRole("CLIENT"), asyncHandler(async (request, response) => {
  const proposalId = request.params.id;
  if (!proposalId || Array.isArray(proposalId)) throw notFound("Proposal not found");
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId }, select: { id: true, status: true, job: { select: { clientId: true, title: true } }, freelancerId: true } });
  if (!proposal) throw notFound("Proposal not found");
  if (proposal.job.clientId !== request.auth!.userId) throw forbidden();
  if (proposal.status !== "SUBMITTED") throw conflict("Only submitted proposals can be rejected");
  const updated = await prisma.$transaction(async (transaction) => {
    const result = await transaction.proposal.update({ where: { id: proposal.id }, data: { status: "REJECTED" }, select: proposalSelect });
    await transaction.notification.create({ data: createNotification(proposal.freelancerId, "PROPOSAL_REJECTED", `Your proposal for ${proposal.job.title} was not selected`, { proposalId: proposal.id }) });
    return result;
  });
  response.json({ data: updated });
}));

router.post("/:id/accept", requireAuth, requireRole("CLIENT"), asyncHandler(async (request, response) => {
  const proposalId = request.params.id;
  if (!proposalId || Array.isArray(proposalId)) throw notFound("Proposal not found");
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { id: true, freelancerId: true, bidAmount: true, bidCurrency: true, status: true, job: { select: { id: true, clientId: true, title: true, status: true } } }
  });
  if (!proposal) throw notFound("Proposal not found");
  if (proposal.job.clientId !== request.auth!.userId) throw forbidden();
  if (proposal.status !== "SUBMITTED" || proposal.job.status !== "PUBLISHED") throw conflict("This proposal is no longer available");

  const result = await prisma.$transaction(async (transaction) => {
    const accepted = await transaction.proposal.update({ where: { id: proposal.id }, data: { status: "ACCEPTED" } });
    await transaction.proposal.updateMany({ where: { jobId: proposal.job.id, id: { not: proposal.id }, status: "SUBMITTED" }, data: { status: "REJECTED" } });
    const project = await transaction.project.create({
      data: {
        jobId: proposal.job.id,
        clientId: proposal.job.clientId,
        freelancerId: proposal.freelancerId,
        acceptedProposalId: accepted.id,
        agreedAmount: proposal.bidAmount,
        agreedCurrency: proposal.bidCurrency,
        status: "NOT_STARTED",
        conversation: { create: {} }
      },
      select: { id: true, status: true, agreedAmount: true, agreedCurrency: true }
    });
    await transaction.job.update({ where: { id: proposal.job.id }, data: { status: "IN_PROGRESS" } });
    await transaction.notification.create({ data: createNotification(proposal.freelancerId, "PROPOSAL_ACCEPTED", `Your proposal for ${proposal.job.title} was accepted`, { proposalId: proposal.id, projectId: project.id }) });
    return { project };
  });
  response.json({ data: result });
}));

export default router;
