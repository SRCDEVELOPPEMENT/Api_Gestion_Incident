import { Request, Response } from "express";
import { GlpiService } from "../../../services/GlpiService";

const glpiService = new GlpiService();

export class GlpiController {
  static async getTickets(req: Request, res: Response) {
    try {
      const data = await glpiService.getTickets();
      return res.json({ data });
    } catch (e: any) {
      return res.status(400).json({ message: e?.message || "Erreur GLPI" });
    }
  }

  static async searchUsers(req: Request, res: Response) {
    try {
      const q = String(req.query.q || "").trim();
      const limit = Number(req.query.limit || 20);
      const data = await glpiService.searchUsers(q, limit);
      return res.json({ data });
    } catch (e: any) {
      return res.status(400).json({ message: e?.message || "Erreur GLPI" });
    }
  }

  static async getTicketById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await glpiService.getTicketById(id);
      if (!data) return res.status(404).json({ message: "Ticket introuvable" });
      return res.json({ data });
    } catch (e: any) {
      return res.status(400).json({ message: e?.message || "Erreur GLPI" });
    }
  }

  static async searchTickets(req: Request, res: Response) {
    try {
      const q = String(req.query.q || "").trim();
      const limit = Number(req.query.limit || 20);
      const data = await glpiService.searchTickets(q, limit);
      return res.json({ data });
    } catch (e: any) {
      return res.status(400).json({ message: e?.message || "Erreur GLPI" });
    }
  }  

}