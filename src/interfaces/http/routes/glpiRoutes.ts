import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/authMiddleware";
import { GlpiController } from "../controllers/GlpiController";

const router = Router();

router.use(authenticate);

router.get(
  "/tickets",
  requireRole("ADMIN", "MANAGER", "EMPLOYE", "CONTROLEUR"),
  GlpiController.getTickets
);

router.get(
  "/users/search",
  requireRole("ADMIN", "MANAGER", "EMPLOYE", "CONTROLEUR"),
  GlpiController.searchUsers
);

router.get(
  "/tickets/:id",
  requireRole("ADMIN", "MANAGER", "EMPLOYE", "CONTROLEUR"),
  GlpiController.getTicketById
);

router.get(
  "/tickets/search",
  requireRole("ADMIN", "MANAGER", "EMPLOYE", "CONTROLEUR"),
  GlpiController.searchTickets
);

export default router;