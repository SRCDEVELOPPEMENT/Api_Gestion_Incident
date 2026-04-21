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

// ✅ TEST DE CONNEXION AU DÉMARRAGE
(async () => {
  try {
    const connection = await glpiPool.getConnection();
    console.log("✅ Connexion MySQL GLPI établie avec succès");
    connection.release();
  } catch (error) {
    console.error("❌ Impossible de se connecter à MySQL GLPI");
    console.error(error);
  }
})();