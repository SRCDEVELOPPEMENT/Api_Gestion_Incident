import fs from "fs";
import os from "os";
import path from "path";

/**
 * Contexte du bug :
 * Sur certains serveurs Windows (PM2, service Windows, compte de domaine,
 * profil 8.3 "DEFFO~1.GROV"...), le dossier %TEMP% du process pointe vers un
 * chemin inexistant ou non accessible. Node met `os.tmpdir()` en cache au
 * 1er appel, et Playwright/Chromium y créent leurs dossiers (artefacts,
 * profil Chromium) → échec :
 *   `ENOENT ... mkdir 'C:\Users\...\Temp\playwright-artifacts-XXXXX'`
 * → `chromium.launch()` échoue → HTTP 500 "An unexpected error occurred".
 *
 * Ce module force, AVANT tout autre module de l'app, un dossier temporaire
 * local sûr (sous uploads/) :
 *   1. création du dossier (recursive, safe),
 *   2. redirection des variables TEMP/TMP/TMPDIR — couvre `os.tmpdir()` de
 *      Node ET le process Chromium enfant (qui hérite de `process.env`),
 *   3. remplacement définitif de `os.tmpdir()` — couvre même le cas où Node
 *      aurait déjà mis en cache la valeur cassée.
 *
 * Ce module doit être importé EN PREMIER dans server.ts.
 */
const TMP_BASE = path.join(process.cwd(), "uploads", ".tmp");

/** Retourne le dossier temporaire local sûr (après initialisation). */
export function getSafeTmpdir(): string {
  return TMP_BASE;
}

/** Idempotent : initialise la redirection du dossier temporaire. */
export function ensureSafeTmpdir(): string {
  try {
    fs.mkdirSync(TMP_BASE, { recursive: true });
    process.env.TEMP = TMP_BASE;
    process.env.TMP = TMP_BASE;
    process.env.TMPDIR = TMP_BASE;
    // os.tmpdir() est writable/configurable sur toutes les versions Node
    // récentes (vérifié : { writable: true, configurable: true }).
    try {
      os.tmpdir = () => TMP_BASE;
    } catch {
      // Si non remplaçable, les variables TEMP/TMP ci-dessus suffisent
      // (elles sont lues par os.tmpdir() tant que le cache n'est pas figé).
    }
  } catch {
    // En dernier recours on garde le comportement système :
    // le serveur doit pouvoir démarrer quand même.
  }
  return TMP_BASE;
}

// Exécution immédiate au chargement du module (importé en premier dans server.ts)
ensureSafeTmpdir();
