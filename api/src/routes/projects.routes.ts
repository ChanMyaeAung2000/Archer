import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { conflict, forbidden, notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const currency = z.enum(["USD", "MMK"]);
const projectStatus = z.enum(["NOT_STARTED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]);
const milestoneStatus = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);

const participantSelect = { id: true, email: true, profile: true } as const;

const projectSelect = {
  id: true,
  clientId: true,
  freelancerId: true,
  agreedAmount: true,
  agreedCurrency: true,
  status: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  job: { select: { id: true, title: true, description: true, budgetAmount: true, budgetCurrency: true, status: true, deadline: true } },
  client: { select: participantSelect },
  freelancer: { select: participantSelect },
  acceptedProposal: { select: { id: true, coverLetter: true, bidAmount: true, bidCurrency: true, estimatedDays: true } },
  milestones: { orderBy: { createdAt: "asc" as const } },
  conversation: {
    select: {
      id: true,
      messages: {
        orderBy: { createdAt: "asc" as const },
        take: 100,
        include: { sender: { select: participantSelect } }
      }
    }
  }
} as const;

const notificationData = (userId: string, type: string, title: string, payload: Record<string, string>) => ({
  userId,
  type,
  title,
  payload: JSON.stringify(payload)
});

async function findParticipantProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, OR: [{ clientId: userId }, { freelancerId: userId }] }, select: projectSelect });
  if (!project) throw notFound("Project not found");
  return project;
}

function getOtherParticipant(project: { clientId: string; freelancerId: string }, userId: string) {
  return project.clientId === userId ? project.freelancerId : project.clientId;
}

router.get("/", requireAuth, asyncHandler(async (request, response) => {
  const projects = await prisma.project.findMany({
    where: { OR: [{ clientId: request.auth!.userId }, { freelancerId: request.auth!.userId }] },
    select: projectSelect,
    orderBy: { updatedAt: "desc" }
  });
  response.json({ data: projects });
}));

router.get("/:id", requireAuth, asyncHandler(async (request, response) => {
  const projectId = request.params.id;
  if (!projectId || Array.isArray(projectId)) throw notFound("Project not found");
  response.json({ data: await findParticipantProject(projectId, request.auth!.userId) });
}));

router.patch("/:id/status", requireAuth, asyncHandler(async (request, response) => {
  const projectId = request.params.id;
  if (!projectId || Array.isArray(projectId)) throw notFound("Project not found");
  const input = z.object({ status: projectStatus }).parse(request.body);
  const project = await findParticipantProject(projectId, request.auth!.userId);
  if (project.status === input.status) throw conflict(`Project is already ${input.status.toLowerCase().replace("_", " ")}`);
  const now = new Date();
  const updated = await prisma.$transaction(async (transaction) => {
    const result = await transaction.project.update({
      where: { id: project.id },
      data: {
        status: input.status,
        startedAt: input.status === "ACTIVE" && !project.startedAt ? now : undefined,
        completedAt: input.status === "COMPLETED" ? now : undefined
      },
      select: projectSelect
    });
    await transaction.notification.create({ data: notificationData(getOtherParticipant(project, request.auth!.userId), "PROJECT_STATUS_CHANGED", `Project status changed to ${input.status.toLowerCase().replace("_", " ")}`, { projectId: project.id }) });
    return result;
  });
  response.json({ data: updated });
}));

const milestoneCreateSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional(),
  amount: z.number().int().positive(),
  currency,
  dueDate: z.coerce.date().optional()
});

router.post("/:id/milestones", requireAuth, asyncHandler(async (request, response) => {
  const projectId = request.params.id;
  if (!projectId || Array.isArray(projectId)) throw notFound("Project not found");
  const input = milestoneCreateSchema.parse(request.body);
  const project = await findParticipantProject(projectId, request.auth!.userId);
  const milestone = await prisma.milestone.create({ data: { projectId: project.id, ...input } });
  await prisma.notification.create({ data: notificationData(getOtherParticipant(project, request.auth!.userId), "MILESTONE_CREATED", `New milestone added to ${project.job.title}`, { projectId: project.id, milestoneId: milestone.id }) });
  response.status(201).json({ data: milestone });
}));

router.patch("/:id/milestones/:milestoneId", requireAuth, asyncHandler(async (request, response) => {
  const projectId = request.params.id;
  const milestoneId = request.params.milestoneId;
  if (!projectId || Array.isArray(projectId) || !milestoneId || Array.isArray(milestoneId)) throw notFound("Milestone not found");
  const project = await findParticipantProject(projectId, request.auth!.userId);
  const input = milestoneCreateSchema.partial().extend({ status: milestoneStatus.optional() }).parse(request.body);
  const existing = await prisma.milestone.findFirst({ where: { id: milestoneId, projectId: project.id } });
  if (!existing) throw notFound("Milestone not found");
  const milestone = await prisma.milestone.update({ where: { id: existing.id }, data: input });
  response.json({ data: milestone });
}));

router.get("/:id/messages", requireAuth, asyncHandler(async (request, response) => {
  const projectId = request.params.id;
  if (!projectId || Array.isArray(projectId)) throw notFound("Project not found");
  const project = await findParticipantProject(projectId, request.auth!.userId);
  response.json({ data: project.conversation?.messages ?? [] });
}));

router.post("/:id/messages", requireAuth, asyncHandler(async (request, response) => {
  const projectId = request.params.id;
  if (!projectId || Array.isArray(projectId)) throw notFound("Project not found");
  const { body } = z.object({ body: z.string().trim().min(1).max(5000) }).parse(request.body);
  const project = await findParticipantProject(projectId, request.auth!.userId);
  const message = await prisma.$transaction(async (transaction) => {
    const conversation = await transaction.conversation.upsert({ where: { projectId: project.id }, update: {}, create: { projectId: project.id } });
    const created = await transaction.message.create({ data: { conversationId: conversation.id, senderId: request.auth!.userId, body }, include: { sender: { select: participantSelect } } });
    await transaction.notification.create({ data: notificationData(getOtherParticipant(project, request.auth!.userId), "NEW_MESSAGE", `New message in ${project.job.title}`, { projectId: project.id }) });
    return created;
  });
  response.status(201).json({ data: message });
}));

router.post("/:id/messages/read", requireAuth, asyncHandler(async (request, response) => {
  const projectId = request.params.id;
  if (!projectId || Array.isArray(projectId)) throw notFound("Project not found");
  const project = await findParticipantProject(projectId, request.auth!.userId);
  if (!project.conversation) return response.status(204).send();
  await prisma.message.updateMany({ where: { conversationId: project.conversation.id, senderId: { not: request.auth!.userId }, readAt: null }, data: { readAt: new Date() } });
  response.status(204).send();
}));

export default router;
