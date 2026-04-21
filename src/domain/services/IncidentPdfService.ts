import { chromium } from "playwright";

export class IncidentPdfService {
  static async generateBuffer(html: string): Promise<Buffer> {
    const browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
    }
  }
}