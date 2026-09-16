import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(async (request, response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: request.auth!.userId },
    orderBy: { createdAt: "desc" },
    take: 30
  });
  response.json({ data: notifications, meta: { unread: notifications.filter((notification) => !notification.readAt).length } });
}));

router.post("/read-all", requireAuth, asyncHandler(async (request, response) => {
  await prisma.notification.updateMany({ where: { userId: request.auth!.userId, readAt: null }, data: { readAt: new Date() } });
  response.status(204).send();
}));

router.post("/:id/read", requireAuth, asyncHandler(async (request, response) => {
  const notificationId = request.params.id;
  if (!notificationId || Array.isArray(notificationId)) throw notFound("Notification not found");
  const result = await prisma.notification.updateMany({ where: { id: notificationId, userId: request.auth!.userId }, data: { readAt: new Date() } });
  if (!result.count) throw notFound("Notification not found");
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  response.json({ data: notification });
}));

export default router;
