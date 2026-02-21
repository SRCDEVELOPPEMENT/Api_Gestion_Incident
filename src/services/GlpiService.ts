import { glpiPool } from "../infrastructure/database/glpiMysql";

export class GlpiService {
  async getRowsFromTable(tableName: string, limit = 100) {
    const allowedTables = new Set(["glpi_ticket", "glpi_users"]);

    if (!allowedTables.has(tableName)) {
      throw new Error("Table non autorisée");
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);

    const sql = `SELECT * FROM \`${tableName}\` LIMIT ?`;
    const [rows] = await glpiPool.query(sql, [safeLimit]);
    return rows;
  }

  async getTickets(limit = 50) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    const [rows] = await glpiPool.query(
      `SELECT id, name, status, date, closedate
       FROM glpi_ticket
       ORDER BY id DESC
       LIMIT ?`,
      [safeLimit]
    );
    return rows;
  }

  async searchUsers(q: string, limit = 20) {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);
    const query = String(q || "").trim();
    if (!query) return [];

    const like = `%${query}%`;

    const [rows] = await glpiPool.query(
      `SELECT id, name, realname, firstname
       FROM glpi_users
       WHERE name LIKE ? OR realname LIKE ? OR firstname LIKE ?
       ORDER BY id DESC
       LIMIT ?`,
      [like, like, like, safeLimit]
    );
    return rows;
  }
}