import { glpiPool } from '../infrastructure/database/glpiMysql';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type GlpiUserRow = {
  id: number;
  name: string | null;
  realname: string | null;
  firstname: string | null;
  phone: string | null;
  is_active: number | null;
  is_deleted: number | null;
  date_mod: Date | string | null;
};

export type GlpiTicketRow = {
  id: number;
  name: string | null;
  content: string | null;
  status: string | null;
  priority: number | null;
  urgency: number | null;
  impact: number | null;
  itilcategories_id: number | null;
  entities_id: number | null;
  locations_id: number | null;
  category_name: string | null;
  entity_name: string | null;
  location_name: string | null;
  requester_names: string | null;
  assignee_names: string | null;
  date: Date | string | null;
  time_to_resolve: Date | string | null;
  solvedate: Date | string | null;
  closedate: Date | string | null;
  date_mod: Date | string | null;
};

export class GlpiSyncService {
  async getUsers(limit = 1000): Promise<GlpiUserRow[]> {
    const [rows] = await glpiPool.query(
      `SELECT id, name, realname, firstname, phone, is_active, is_deleted, date_mod FROM glpi_users WHERE is_deleted = 0 ORDER BY id DESC LIMIT ?`,
      [limit]
    );
    return rows as GlpiUserRow[];
  }

  /**
   * Récupère les tickets GLPI (non supprimés), enrichis avec catégorie,
   * entité, localisation, demandeur(s) et technicien(s) assigné(s).
   * On inclut TOUS les statuts (y compris clôturés) pour que la table locale
   * reflète fidèlement les changements de statut côté GLPI.
   */
  async getTickets(limit = 1000): Promise<GlpiTicketRow[]> {
    const [rows] = await glpiPool.query(
      `SELECT
         t.id,
         t.name,
         t.content,
         t.status,
         t.priority,
         t.urgency,
         t.impact,
         t.itilcategories_id,
         t.entities_id,
         t.locations_id,
         t.date,
         t.time_to_resolve,
         t.solvedate,
         t.closedate,
         t.date_mod,
         cat.name AS category_name,
         ent.name AS entity_name,
         loc.name AS location_name,
         (SELECT GROUP_CONCAT(CONCAT(COALESCE(u.firstname,''), ' ', COALESCE(u.realname,'')) SEPARATOR ', ')
            FROM glpi_tickets_users tu
            JOIN glpi_users u ON u.id = tu.users_id
            WHERE tu.tickets_id = t.id AND tu.type = 1) AS requester_names,
         (SELECT GROUP_CONCAT(CONCAT(COALESCE(u.firstname,''), ' ', COALESCE(u.realname,'')) SEPARATOR ', ')
            FROM glpi_tickets_users tu
            JOIN glpi_users u ON u.id = tu.users_id
            WHERE tu.tickets_id = t.id AND tu.type = 2) AS assignee_names
       FROM glpi_tickets t
       LEFT JOIN glpi_itilcategories cat ON cat.id = t.itilcategories_id
       LEFT JOIN glpi_entities ent ON ent.id = t.entities_id
       LEFT JOIN glpi_locations loc ON loc.id = t.locations_id
       WHERE t.is_deleted = 0
       ORDER BY t.id DESC
       LIMIT ?`,
      [limit]
    );
    return rows as GlpiTicketRow[];
  }

  async syncUsersToLocalDb(limit = 1000) {
    const users = await this.getUsers(limit);
    if (!users.length) return { success: true, synced: 0, message: 'Aucun utilisateur GLPI à synchroniser' };

      const existing = await prisma.gLPIUser.findMany({
      where: { glpiId: { in: users.map(u => u.id) } },
      select: { glpiId: true },
    });
    const existingIds = new Set(existing.map(u => u.glpiId));
    const usersToCreate = users.filter(u => !existingIds.has(u.id));

    if (!usersToCreate.length) return { success: true, synced: 0, message: 'Aucun nouvel utilisateur GLPI à synchroniser' };

      await prisma.gLPIUser.createMany({
      data: usersToCreate.map(u => ({
        glpiId: u.id,
        login: u.name,
        firstName: u.firstname,
        lastName: u.realname,
        fullName: [u.firstname, u.realname].filter(Boolean).join(' '),
        phone: u.phone,
        status: u.is_active === 0 ? 'INACTIVE' : 'ACTIVE',
        isDeletedInSource: u.is_deleted === 1,
        sourceUpdatedAt: u.date_mod ? new Date(u.date_mod) : null,
        lastSyncedAt: new Date(),
        syncStatus: 'SYNCED',
        rawPayload: JSON.stringify(u),
      })),
    });

    return { success: true, synced: usersToCreate.length, message: `${usersToCreate.length} utilisateur(s) GLPI synchronisé(s)` };
  }

  async syncTicketsToLocalDb(limit = 1000) {
    const tickets = await this.getTickets(limit);
    if (!tickets.length) return { success: true, synced: 0, updated: 0, message: 'Aucun ticket GLPI à synchroniser' };

    // Helper de tronquage
    const truncate = (str: any, max: number) =>
      str === null || str === undefined ? null : (typeof str === 'string' && str.length > max ? str.slice(0, max) : str);

    const mapTicket = (t: GlpiTicketRow) => ({
      glpiId: t.id,
      ticketNumber: truncate(t.name ?? '', 255),
      title: truncate(t.name || `Ticket ${t.id}`, 4000),
      description: truncate(t.content ?? '', 4000),
      status: t.status ? truncate(String(t.status), 100) : 'OPEN',
      priority: t.priority ? truncate(String(t.priority), 100) : null,
      urgency: t.urgency ? truncate(String(t.urgency), 100) : null,
      impact: t.impact ? truncate(String(t.impact), 100) : null,
      categoryName: truncate(t.category_name ?? '', 4000),
      entityName: truncate(t.entity_name ?? '', 4000),
      locationName: truncate(t.location_name ?? '', 4000),
      requesterName: truncate(t.requester_names ?? '', 4000),
      assigneeName: truncate(t.assignee_names ?? '', 4000),
      openedAt: t.date ? new Date(t.date) : null,
      dueAt: t.time_to_resolve ? new Date(t.time_to_resolve) : null,
      resolvedAt: t.solvedate ? new Date(t.solvedate) : null,
      closedAt: t.closedate ? new Date(t.closedate) : null,
      sourceUpdatedAt: t.date_mod ? new Date(t.date_mod) : null,
      lastSyncedAt: new Date(),
      syncStatus: 'SYNCED',
      rawPayload: truncate(JSON.stringify(t), 4000),
    });

    const existing = await prisma.gLPITicket.findMany({
      where: { glpiId: { in: tickets.map(t => t.id) } },
      select: { glpiId: true },
    });
    const existingIds = new Set(existing.map(t => t.glpiId));

    const ticketsToCreate = tickets.filter(t => !existingIds.has(t.id));
    const ticketsToUpdate = tickets.filter(t => existingIds.has(t.id));

    let created = 0;
    let updated = 0;

    if (ticketsToCreate.length) {
      await prisma.gLPITicket.createMany({
        data: ticketsToCreate.map(mapTicket),
      });
      created = ticketsToCreate.length;
    }

    // ✅ Mise à jour des tickets déjà présents (statut, échéance, assignés, …)
    for (const t of ticketsToUpdate) {
      const data = mapTicket(t);
      const res = await prisma.gLPITicket.updateMany({
        where: { glpiId: t.id },
        data,
      });
      updated += res.count;
    }

    return {
      success: true,
      synced: created,
      updated,
      message: `${created} ticket(s) créé(s), ${updated} ticket(s) mis à jour`,
    };
  }
}
