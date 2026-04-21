import { Router } from "express";
import { IncidentCommentController } from "../controllers/IncidentCommentController";
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.post("/", 
    requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
IncidentCommentController.create);

router.get("/:incidentId", 
    requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
IncidentCommentController.getByIncident);

export default router;