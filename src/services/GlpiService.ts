import { glpiPool } from "../infrastructure/database/glpiMysql";

function isConnectionError(e: any): boolean {
  const msg = String(e?.message || "").toLowerCase();
  const code = String(e?.code || "").toUpperCase();

  return (
    code === "ECONNREFUSED" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    code === "ECONNRESET" ||
    msg.includes("connection lost") ||
    msg.includes("connect") ||
    msg.includes("pool is closed")
  );
}

export class GlpiService {

  async getRowsFromTable(tableName: string, limit = 100) {
    const allowedTables = new Set(["glpi_tickets", "glpi_users"]);

    if (!allowedTables.has(tableName)) {
      throw new Error("Table non autorisée");
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const sql = `SELECT * FROM \`${tableName}\` LIMIT ?`;

    try {
      const [rows] = await glpiPool.query(sql, [safeLimit]);
      return rows;
    } catch (e: any) {
      if (isConnectionError(e)) {
        return [];
      }
      throw e;
    }
  }

  async getTickets() {
    try {
      const [rows] = await glpiPool.query(
        `SELECT id, name, status, date, closedate, LEFT(content, 120) AS content
        FROM glpi_tickets
        WHERE status = 2
        ORDER BY id DESC`
      );

      console.log(rows);
      return rows;
    } catch (e: any) {
      if (isConnectionError(e)) {
        return [];
      }
      throw e;
    }
  }
  
  async searchUsers(q: string, limit = 20) {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);
    const query = String(q || "").trim();
    if (!query) return [];

    const like = `%${query}%`;

    try {
      const [rows] = await glpiPool.query(
        `SELECT id, name, realname, firstname
         FROM glpi_users
         WHERE name LIKE ? OR realname LIKE ? OR firstname LIKE ?
         ORDER BY id DESC
         LIMIT ?`,
        [like, like, like, safeLimit]
      );
      return rows;
    } catch (e: any) {
      if (isConnectionError(e)) {
        return [];
      }
      throw e;
    }
  }

  async getTicketById(id: number) {
    const ticketId = Number(id);
    if (!Number.isFinite(ticketId) || ticketId <= 0) return null;

    try {
      const [rows] = await glpiPool.query(
        `SELECT id, name, status, date, closedate, content
        FROM glpi_tickets
        WHERE id = ?
        LIMIT 1`,
        [ticketId]
      );

      const arr = rows as any[];
      return arr?.[0] ?? null;
    } catch (e: any) {
      if (isConnectionError(e)) return null;
      throw e;
    }
  }

  async searchTickets(q: string, limit = 20) {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const query = String(q || "").trim();
    if (!query) return [];

    const like = `%${query}%`;

    try {
      const [rows] = await glpiPool.query(
        `SELECT id,
                LEFT(content, 120) AS content,
                name,
                status,
                date,
                closedate
        FROM glpi_tickets
        WHERE CAST(id AS CHAR) LIKE ?
            OR name LIKE ?
            OR content LIKE ?
        ORDER BY id DESC
        LIMIT ?`,
        [like, like, like, safeLimit]
      );
      return rows;
    } catch (e: any) {
      if (isConnectionError(e)) return [];
      throw e;
    }
  }

}