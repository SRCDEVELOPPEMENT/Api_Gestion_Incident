import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/authMiddleware";
import { GlpiController } from "../controllers/GlpiController";

const router = Router();

router.use(authenticate);

router.get(
  "/tickets",
  requireRole("ADMIN", "MANAGER", "EMPLOYE"),
  GlpiController.getTickets
);

router.get(
  "/users/search",
  requireRole("ADMIN", "MANAGER", "EMPLOYE"),
  GlpiController.searchUsers
);

export default router;