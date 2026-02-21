import mysql from "mysql2/promise";

export const glpiPool = mysql.createPool({
  host: process.env.GLPI_DB_HOST,
  port: Number(process.env.GLPI_DB_PORT || 3306),
  user: process.env.GLPI_DB_USER,
  password: process.env.GLPI_DB_PASSWORD,
  database: process.env.GLPI_DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z",
});