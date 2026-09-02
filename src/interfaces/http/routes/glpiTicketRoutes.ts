import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/authMiddleware";
import { GLPITicketController } from "../controllers/GLPITicketController";

const router = Router();

router.use(authenticate);

router.post(
  "/query",
  requireRole("ADMIN", "MANAGER", "EMPLOYE", "CONTROLEUR"),
  GLPITicketController.query
);

export default router;
