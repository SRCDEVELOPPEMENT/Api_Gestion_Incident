import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { ensureSafeTmpdir, getSafeTmpdir } from "../../bootstrap/safeTmpdir.bootstrap";

// Idempotent : garantit un dossier temporaire local sûr même si ce service
// est importé hors du flux normal de server.ts (tests, script isolé...).
ensureSafeTmpdir();

export class IncidentPdfService {
  static async generateBuffer(html: string): Promise<Buffer> {
    const tmpBase = getSafeTmpdir();
    const artifactsDir = fs.mkdtempSync(path.join(tmpBase, "artifacts-"));

    const browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      artifactsDir,
      env: {
        ...process.env,
        TEMP: tmpBase,
        TMP: tmpBase,
        TMPDIR: tmpBase,
      },
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded" });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close().catch(() => {});
      // Nettoyage des dossiers temporaires locaux (le dossier de base est réutilisé)
      fs.rmSync(artifactsDir, { recursive: true, force: true });
    }
  }
}