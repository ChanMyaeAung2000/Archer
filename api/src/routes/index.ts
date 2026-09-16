import { Router } from "express";
import authRoutes from "./auth.routes.js";
import jobsRoutes from "./jobs.routes.js";
import skillsRoutes from "./skills.routes.js";
import usersRoutes from "./users.routes.js";
import proposalsRoutes from "./proposals.routes.js";
import notificationsRoutes from "./notifications.routes.js";
import projectsRoutes from "./projects.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/jobs", jobsRoutes);
router.use("/skills", skillsRoutes);
router.use("/users", usersRoutes);
router.use("/proposals", proposalsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/projects", projectsRoutes);

export default router;
