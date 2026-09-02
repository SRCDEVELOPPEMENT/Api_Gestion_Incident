import { Request, Response } from 'express';
import { WeeklyReportService } from '../../../services/WeeklyReportService';
import { IncidentService } from '../../../services/IncidentService';
import { IncidentPdfService } from '../../../domain/services/IncidentPdfService';
import prisma from '../../../infrastructure/database/prisma';
import path from 'path';
import fs from 'fs/promises';

/* ------------------------------------------------------------------ */
/*  Helpers rôles (copie depuis IncidentController)                    */
/* ------------------------------------------------------------------ */

function hasAdminLikeAccess(user: any): boolean {
  return (
    user?.roles?.some((r: any) =>
      typeof r === 'string'
        ? r === 'ADMIN' || r === 'MANAGER' || r === 'CONTROLEUR'
        : r?.name === 'ADMIN' ||
          r?.role?.name === 'ADMIN' ||
          r?.name === 'MANAGER' ||
          r?.role?.name === 'MANAGER' ||
          r?.name === 'CONTROLEUR' ||
          r?.role?.name === 'CONTROLEUR'
    ) ?? false
  );
}

function escapeHtml(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const reportService = new WeeklyReportService();

export class ReportController {
  /**
   * GET /api/v1/reports/weekly/available-weeks
   * Renvoie la liste des semaines disponibles dans l'historique.
   */
  static async getAvailableWeeks(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser?.id) return res.status(401).json({ message: 'Unauthorized' });

      const dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { roles: { include: { role: true } } },
      });
      if (!dbUser) return res.status(404).json({ message: 'Utilisateur introuvable' });

      const roles = dbUser.roles
        .map((r) => r.role?.name)
        .filter(Boolean)
        .map((n: string) => n.toUpperCase());

      const weeks = await reportService.getAvailableWeeks({
        id: dbUser.id,
        roles,
        siteId: dbUser.siteId ?? undefined,
      });

      return res.json(weeks);
    } catch (error) {
      console.error('[REPORT] getAvailableWeeks error:', error);
      return res.status(500).json({ message: 'Erreur récupération semaines' });
    }
  }

  /**
   * GET /api/v1/reports/weekly?week=2026-W30
   * GET /api/v1/reports/weekly/current
   * Renvoie les données JSON du rapport pour visualisation.
   */
  static async getWeeklyReport(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser?.id) return res.status(401).json({ message: 'Unauthorized' });

      const dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { roles: { include: { role: true } } },
      });
      if (!dbUser) return res.status(404).json({ message: 'Utilisateur introuvable' });

      const roles = dbUser.roles
        .map((r) => r.role?.name)
        .filter(Boolean)
        .map((n: string) => n.toUpperCase());

      const user = { id: dbUser.id, roles, siteId: dbUser.siteId ?? undefined };

      // Si le paramètre week est présent, extraire semaine/année
      const weekParam = req.query.week as string | undefined;
      let result;

      if (weekParam) {
        // Format: "2026-W30"
        const match = weekParam.match(/^(\d{4})-W(\d{1,2})$/);
        if (!match) {
          return res.status(400).json({ message: 'Format de semaine invalide. Utiliser YYYY-Www (ex: 2026-W30)' });
        }
        const year = parseInt(match[1], 10);
        const week = parseInt(match[2], 10);
        result = await reportService.getWeeklyReport(week, year, user);
      } else {
        // Semaine courante par défaut
        result = await reportService.getCurrentWeekReport(user);
      }

      return res.json(result);
    } catch (error) {
      console.error('[REPORT] getWeeklyReport error:', error);
      return res.status(500).json({ message: 'Erreur récupération rapport' });
    }
  }

  /**
   * POST /api/v1/reports/weekly/export/pdf
   * Body: { week?: "2026-W30" } — si omis, semaine courante
   */
  static async exportPdf(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser?.id) return res.status(401).json({ message: 'Unauthorized' });

      const dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { roles: { include: { role: true } } },
      });
      if (!dbUser) return res.status(404).json({ message: 'Utilisateur introuvable' });

      const roles = dbUser.roles
        .map((r) => r.role?.name)
        .filter(Boolean)
        .map((n: string) => n.toUpperCase());

      const user = { id: dbUser.id, roles, siteId: dbUser.siteId ?? undefined };

      const weekParam = req.body?.week as string | undefined;
      let data;

      if (weekParam) {
        const match = weekParam.match(/^(\d{4})-W(\d{1,2})$/);
        if (!match) {
          return res.status(400).json({ message: 'Format de semaine invalide' });
        }
        data = await reportService.getWeeklyReport(parseInt(match[2], 10), parseInt(match[1], 10), user);
      } else {
        data = await reportService.getCurrentWeekReport(user);
      }

      // ── Génération HTML depuis le template ──
      const TEMPLATE_DIR = path.resolve(__dirname, '../../../../templates');
      const ASSETS_DIR = path.resolve(__dirname, '../../../../assets');

      const templatePath = path.join(TEMPLATE_DIR, 'weekly-report.html');
      const logoPath = path.join(ASSETS_DIR, 'logo.png');

      let template: string;
      try {
        template = await fs.readFile(templatePath, 'utf8');
      } catch {
        return res.status(500).json({ message: 'Template de rapport introuvable' });
      }

      let logoBase64 = '';
      try {
        const logoBuffer = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } catch {
        logoBase64 = '';
      }

      // ── Helper pour les barres de progression ──
      const barWidth = (rate: number | null): string => {
        if (rate === null) return '0';
        return String(Math.min(rate, 100));
      };

      // ── Builder le contenu ──
      const kpi = data.kpi;
      const comparison = data.comparison;

      const renderChange = (value: number | null, unit: string, inverse = false): string => {
        if (value === null) return '<span class="neutral">—</span>';
        const abs = Math.abs(value);
        const formatted = unit === 'pts'
          ? `${abs.toFixed(1)} pts`
          : `${abs.toFixed(1)}%`;
        if (Math.abs(value) < 0.01) return `<span class="neutral">→ ${formatted}</span>`;
        const isPositive = inverse ? value < 0 : value > 0;
        if (isPositive) {
          return `<span class="good">▲ ${formatted}</span>`;
        }
        return `<span class="bad">▼ ${formatted}</span>`;
      };

      // Taux de résolution affiché
      const displayRate = kpi.resolutionRate !== null ? `${kpi.cappedRate.toFixed(1)}%` : 'N/A';
      const extraNote = kpi.extraResolvedFromStock > 0
        ? `<p class="note">Dont ${kpi.extraResolvedFromStock} résolu(s) d'anciens stocks</p>`
        : '';

      // Services rows
      const serviceRows = data.byService.length
        ? data.byService.map((s) => `
          <tr>
            <td>${escapeHtml(s.name)}</td>
            <td class="num">${s.created}</td>
            <td class="num">${s.resolved}</td>
            <td class="num">${s.rate !== null ? `${s.rate.toFixed(1)}%` : 'N/A'}
              <div class="bar-bg"><div class="bar-fill" style="width:${barWidth(s.rate)}%"></div></div>
            </td>
          </tr>`).join('')
        : '<tr><td colspan="4" class="empty">Aucune donnée cette semaine</td></tr>';

      // Priority rows
      const priorityRows = data.byPriority.length
        ? data.byPriority.map((p) => `
          <tr>
            <td>${escapeHtml(p.name)}</td>
            <td class="num">${p.created}</td>
            <td class="num">${p.resolved}</td>
            <td class="num">${p.rate !== null ? `${p.rate.toFixed(1)}%` : 'N/A'}
              <div class="bar-bg"><div class="bar-fill" style="width:${barWidth(p.rate)}%"></div></div>
            </td>
          </tr>`).join('')
        : '<tr><td colspan="4" class="empty">Aucune donnée cette semaine</td></tr>';

      // Trend rows
      const trendRows = data.dailyTrend.map((d) => `
        <tr>
          <td>${escapeHtml(d.dayLabel)}</td>
          <td class="num">${d.created}</td>
          <td class="num">${d.resolved}</td>
          <td class="num">
            <div class="mini-bar">
              <div class="bar-created" style="width:${d.created > 0 ? Math.max(2, (d.created / Math.max(...data.dailyTrend.map((x) => x.created), 1)) * 100) : 0}%"></div>
              <div class="bar-resolved" style="width:${d.resolved > 0 ? Math.max(2, (d.resolved / Math.max(...data.dailyTrend.map((x) => x.resolved), 1)) * 100) : 0}%"></div>
            </div>
          </td>
        </tr>`).join('');

      // Comparison rows
      const comparisonRows = comparison
        ? `
        <tr>
          <td>Créés</td>
          <td class="num">${kpi.created}</td>
          <td class="num">${comparison.previousWeek.created}</td>
          <td class="num">${renderChange(comparison.createdChange, 'pct')}</td>
        </tr>
        <tr>
          <td>Résolus</td>
          <td class="num">${kpi.resolved}</td>
          <td class="num">${comparison.previousWeek.resolved}</td>
          <td class="num">${renderChange(comparison.resolvedChange, 'pct')}</td>
        </tr>
        <tr>
          <td>Taux de résolution</td>
          <td class="num">${displayRate}</td>
          <td class="num">${comparison.previousWeek.resolutionRate !== null ? `${comparison.previousWeek.cappedRate.toFixed(1)}%` : 'N/A'}</td>
          <td class="num">${renderChange(comparison.resolutionRateChange, 'pts')}</td>
        </tr>
        <tr>
          <td>Incidents en cours (fin)</td>
          <td class="num">${kpi.backlogEnd}</td>
          <td class="num">${comparison.previousWeek.backlogEnd}</td>
          <td class="num">${renderChange(comparison.backlogEndChange, 'pct', true)}</td>
        </tr>
        <tr>
          <td>Tps moy. résolution</td>
          <td class="num">${kpi.avgResolutionHours !== null ? `${kpi.avgResolutionHours.toFixed(1)} h` : '—'}</td>
          <td class="num">${comparison.previousWeek.avgResolutionHours !== null ? `${comparison.previousWeek.avgResolutionHours.toFixed(1)} h` : '—'}</td>
          <td class="num">${renderChange(comparison.avgResolutionChange, 'pct', true)}</td>
        </tr>`
        : '<tr><td colspan="4" class="empty">Semaine précédente non disponible</td></tr>';

      let html = template
        .replace(/{{LOGO_URL}}/g, logoBase64)
        .replace(/{{PERIOD_LABEL}}/g, escapeHtml(data.period.label))
        .replace(/{{PERIOD_START}}/g, formatDateFr(data.period.startDate))
        .replace(/{{PERIOD_END}}/g, formatDateFr(data.period.endDate))
        .replace(/{{EXPORT_DATE}}/g, new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
        .replace('{{KPI_CREATED}}', String(kpi.created))
        .replace('{{KPI_RESOLVED}}', String(kpi.resolved))
        .replace('{{KPI_RATE}}', displayRate)
        .replace('{{KPI_EXTRA_NOTE}}', extraNote)
        .replace('{{KPI_BACKLOG_START}}', String(kpi.backlogStart))
        .replace('{{KPI_BACKLOG_END}}', String(kpi.backlogEnd))
        .replace('{{KPI_AVG_RES}}', kpi.avgResolutionHours !== null ? `${kpi.avgResolutionHours.toFixed(1)} h` : '—')
        .replace('{{KPI_AVG_TIC}}', kpi.avgTakeInChargeHours !== null ? `${kpi.avgTakeInChargeHours.toFixed(1)} h` : '—')
        .replace('{{SERVICE_ROWS}}', serviceRows)
        .replace('{{PRIORITY_ROWS}}', priorityRows)
        .replace('{{TREND_ROWS}}', trendRows)
        .replace('{{COMPARISON_ROWS}}', comparisonRows);

      // ── Incident rows ──
      const statusLabels: Record<string, string> = {
        OPEN: 'Ouvert', IN_PROGRESS: 'En cours', RESOLVED: 'Résolu',
        CLOSED: 'Clôturé', CANCELLED: 'Annulé',
      };
      const incidentRows = Array.isArray(data.incidents) && data.incidents.length
        ? data.incidents.map((inc: any) => {
            const statusLabel = statusLabels[inc.status] || inc.status;
            return `
            <tr>
              <td><strong>${escapeHtml(inc.reference)}</strong></td>
              <td class="desc-cell">${escapeHtml(inc.description)}</td>
              <td><span class="status-badge status-${inc.status}">${escapeHtml(statusLabel)}</span></td>
              <td class="num ${`prio-${inc.priority}`}">${escapeHtml(inc.priority)}</td>
              <td>${escapeHtml(inc.serviceEmetteur)}</td>
              <td>${escapeHtml(inc.serviceRecepteur)}</td>
              <td class="num">${escapeHtml(inc.createdAt)}</td>
              <td class="desc-cell">${inc.rootCause ? escapeHtml(inc.rootCause) : '<span class="text-muted">—</span>'}</td>
            </tr>`;
          }).join('')
        : '<tr><td colspan="8" class="empty">Aucun incident créé cette semaine</td></tr>';

      html = html.replace('{{INCIDENT_ROWS}}', incidentRows);

      const pdfBuffer = await IncidentPdfService.generateBuffer(html);

      const filename = `rapport_hebdo_${data.period.startDate}_${data.period.endDate}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', String(pdfBuffer.length));
      return res.status(200).send(pdfBuffer);
    } catch (error) {
      console.error('[REPORT] exportPdf error:', error);
      return res.status(500).json({ message: 'Erreur génération PDF' });
    }
  }

  /**
   * POST /api/v1/reports/weekly/export/excel
   * Body: { week?: "2026-W30" } — si omis, semaine courante
   */
  static async exportExcel(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser?.id) return res.status(401).json({ message: 'Unauthorized' });

      const dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { roles: { include: { role: true } } },
      });
      if (!dbUser) return res.status(404).json({ message: 'Utilisateur introuvable' });

      const roles = dbUser.roles
        .map((r) => r.role?.name)
        .filter(Boolean)
        .map((n: string) => n.toUpperCase());

      const user = { id: dbUser.id, roles, siteId: dbUser.siteId ?? undefined };

      const weekParam = req.body?.week as string | undefined;
      let data;

      if (weekParam) {
        const match = weekParam.match(/^(\d{4})-W(\d{1,2})$/);
        if (!match) {
          return res.status(400).json({ message: 'Format de semaine invalide' });
        }
        data = await reportService.getWeeklyReport(parseInt(match[2], 10), parseInt(match[1], 10), user);
      } else {
        data = await reportService.getCurrentWeekReport(user);
      }

      const sep = ';';
      const quote = (v: any): string => `"${String(v ?? '').replace(/"/g, '""')}"`;

      let csv = '';

      // ── En-tête ──
      csv += `Rapport hebdomadaire;${quote(data.period.label)}\n`;
      csv += `Période;${quote(data.period.startDate)};→;${quote(data.period.endDate)}\n\n`;

      // ── KPIs ──
      csv += 'Indicateur;Valeur\n';
      csv += `Créés;${data.kpi.created}\n`;
      csv += `Résolus;${data.kpi.resolved}\n`;
      csv += `Taux de résolution;${data.kpi.resolutionRate !== null ? `${data.kpi.cappedRate.toFixed(1)}%` : 'N/A'}\n`;
      if (data.kpi.extraResolvedFromStock > 0) {
        csv += `Dont résolus d'anciens stocks;${data.kpi.extraResolvedFromStock}\n`;
      }
      csv += `Backlog début;${data.kpi.backlogStart}\n`;
      csv += `Backlog fin;${data.kpi.backlogEnd}\n`;
      csv += `Tps moyen résolution (h);${data.kpi.avgResolutionHours !== null ? data.kpi.avgResolutionHours.toFixed(2) : ''}\n`;
      csv += `Tps moyen prise en charge (h);${data.kpi.avgTakeInChargeHours !== null ? data.kpi.avgTakeInChargeHours.toFixed(2) : ''}\n\n`;

      // ── Par service ──
      csv += 'Service;Créés;Résolus;Taux (%)\n';
      for (const s of data.byService) {
        csv += `${quote(s.name)};${s.created};${s.resolved};${s.rate !== null ? s.rate.toFixed(1) : ''}\n`;
      }
      csv += '\n';

      // ── Par priorité ──
      csv += 'Priorité;Créés;Résolus;Taux (%)\n';
      for (const p of data.byPriority) {
        csv += `${quote(p.name)};${p.created};${p.resolved};${p.rate !== null ? p.rate.toFixed(1) : ''}\n`;
      }
      csv += '\n';

      // ── Trend journalier ──
      csv += 'Jour;Créés;Résolus\n';
      for (const d of data.dailyTrend) {
        csv += `${quote(d.dayLabel)};${d.created};${d.resolved}\n`;
      }
      csv += '\n';

      // ── Comparaison S-1 ──
      if (data.comparison) {
        csv += 'Comparaison S-1;S courante;S-1;Variation\n';
        const c = data.comparison;
        csv += `Créés;${data.kpi.created};${c.previousWeek.created};${c.createdChange !== null ? `${c.createdChange.toFixed(1)}%` : ''}\n`;
        csv += `Résolus;${data.kpi.resolved};${c.previousWeek.resolved};${c.resolvedChange !== null ? `${c.resolvedChange.toFixed(1)}%` : ''}\n`;
        csv += `Taux;${data.kpi.resolutionRate !== null ? `${data.kpi.cappedRate.toFixed(1)}%` : 'N/A'};${c.previousWeek.resolutionRate !== null ? `${c.previousWeek.cappedRate.toFixed(1)}%` : 'N/A'};${c.resolutionRateChange !== null ? `${c.resolutionRateChange.toFixed(1)} pts` : ''}\n`;
        csv += `Backlog;${data.kpi.backlogEnd};${c.previousWeek.backlogEnd};${c.backlogEndChange !== null ? `${c.backlogEndChange.toFixed(1)}%` : ''}\n`;
      }

      const filename = `rapport_hebdo_${data.period.startDate}_${data.period.endDate}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      // BOM pour Excel
      res.setHeader('Content-Length', Buffer.byteLength('\uFEFF' + csv, 'utf8'));
      return res.status(200).send('\uFEFF' + csv);
    } catch (error) {
      console.error('[REPORT] exportExcel error:', error);
      return res.status(500).json({ message: 'Erreur génération Excel' });
    }
  }

  /**
   * POST /api/v1/reports/statistics/export/pdf
   * Body: { dateFrom?: string; periodLabel?: string }
   * Génère un PDF du tableau statistique avec l'en-tête SOREPCO (comme les autres exports).
   */
  static async exportStatisticsPdf(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser?.id) return res.status(401).json({ message: 'Unauthorized' });

      const dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { roles: { include: { role: true } } },
      });
      if (!dbUser) return res.status(404).json({ message: 'Utilisateur introuvable' });

      const roles = dbUser.roles
        .map((r) => r.role?.name)
        .filter(Boolean)
        .map((n: string) => n.toUpperCase());

      const user = { id: dbUser.id, roles, siteId: dbUser.siteId ?? undefined };

      const dateFromParam = req.body?.dateFrom as string | undefined;
      const periodLabel = (req.body?.periodLabel as string | undefined) || 'Tout';
      const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;

      const incidentService = new IncidentService();
      const [catProc, byService, priority] = await Promise.all([
        incidentService.getByCategoryProcess({ ...user, dateFrom }),
        incidentService.getByService(user),
        incidentService.getByPriority(user),
      ]);

      // Totaux cohérents avec la période (chaque incident est compté, y compris "Non catégorisé")
      const catList = Array.isArray(catProc?.categories) ? catProc.categories : [];
      const totals = catList.reduce(
        (acc, c) => ({
          total: acc.total + (c.total || 0),
          open: acc.open + (c.open || 0),
          inProgress: acc.inProgress + (c.inProgress || 0),
          closed: acc.closed + (c.closed || 0),
          cancelled: acc.cancelled + (c.cancelled || 0),
        }),
        { total: 0, open: 0, inProgress: 0, closed: 0, cancelled: 0 }
      );
      const enCours = totals.open + totals.inProgress;
      const resolutionRate = totals.total > 0 ? Math.round((totals.closed / totals.total) * 100) : 0;
      const backlogCritical = priority?.backlogCritical ?? 0;

      // ── KPI ──
      const kpis: { label: string; value: string }[] = [
        { label: 'Total incidents', value: String(totals.total) },
        { label: 'En cours', value: String(enCours) },
        { label: 'Résolus', value: String(totals.closed) },
        { label: 'Annulés', value: String(totals.cancelled) },
        { label: 'Taux de résolution', value: `${resolutionRate}%` },
        { label: 'Backlog critique', value: String(backlogCritical) },
      ];
      const kpiRowsHtml = kpis
        .map((k) => `<div class="kpi"><span class="kpi-label">${escapeHtml(k.label)}</span><span class="kpi-value">${escapeHtml(k.value)}</span></div>`)
        .join('');

      // ── Catégories ──
      const categoryRowsHtml = catList.length
        ? catList
            .map((c: any) => {
              const rate = c.total > 0 ? Math.round((c.closed / c.total) * 100) : 0;
              return `
          <tr>
            <td>${escapeHtml(c.name)}</td>
            <td class="num">${c.total}</td>
            <td class="num">${(c.inProgress || 0) + (c.open || 0)}</td>
            <td class="num">${c.closed}</td>
            <td class="num">${c.cancelled}</td>
            <td class="num">${rate}%</td>
          </tr>`;
            })
            .join('')
        : '<tr><td colspan="6" class="empty">Aucune donnée pour la période sélectionnée</td></tr>';

      const categoryTotalsHtml = catList.length
        ? `<tr class="total-row">
          <td>Total</td>
          <td class="num">${totals.total}</td>
          <td class="num">${enCours}</td>
          <td class="num">${totals.closed}</td>
          <td class="num">${totals.cancelled}</td>
          <td class="num">${resolutionRate}%</td>
        </tr>`
        : '';

      // ── Services ──
      const serviceRowsHtml =
        Array.isArray(byService) && byService.length
          ? byService
              .map((s: any) => {
                const share = totals.total > 0 ? Math.round((s.value / totals.total) * 100) : 0;
                return `
          <tr>
            <td>${escapeHtml(s.name)}</td>
            <td class="num">${s.value}</td>
            <td class="num">${share}%</td>
          </tr>`;
              })
              .join('')
          : '<tr><td colspan="3" class="empty">Aucune donnée</td></tr>';

      // ── Priorités ──
      const PRIORITY_ORDER = ['Critique', 'Haute', 'Moyenne', 'Basse'];
      const priorityRows = PRIORITY_ORDER.map((name) => ({
        name,
        value: (priority?.byPriority || []).find((p: any) => p.name === name)?.value || 0,
      })).filter((p) => p.value > 0);
      const priorityRowsHtml = priorityRows.length
        ? priorityRows
            .map((p) => `
          <tr>
            <td>${escapeHtml(p.name)}</td>
            <td class="num">${p.value}</td>
          </tr>`)
            .join('')
        : '<tr><td colspan="2" class="empty">Aucune donnée</td></tr>';

      // ── Sous-catégories / Sous-processus ──
      const subCatRowsHtml =
        Array.isArray(catProc?.subCategories) && catProc.subCategories.length
          ? catProc.subCategories
              .slice(0, 8)
              .map((s: any) => `
          <tr>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.categoryName)}</td>
            <td class="num">${s.total}</td>
          </tr>`)
              .join('')
          : '<tr><td colspan="3" class="empty">Aucune donnée</td></tr>';

      const subProcRowsHtml =
        Array.isArray(catProc?.subProcesses) && catProc.subProcesses.length
          ? catProc.subProcesses
              .slice(0, 8)
              .map((s: any) => `
          <tr>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.processName)}</td>
            <td class="num">${s.total}</td>
          </tr>`)
              .join('')
          : '<tr><td colspan="3" class="empty">Aucune donnée</td></tr>';

      // ── Template + logo ──
      const TEMPLATE_DIR = path.resolve(__dirname, '../../../../templates');
      const ASSETS_DIR = path.resolve(__dirname, '../../../../assets');

      let template: string;
      try {
        template = await fs.readFile(path.join(TEMPLATE_DIR, 'statistics-report.html'), 'utf8');
      } catch {
        return res.status(500).json({ message: 'Template de statistiques introuvable' });
      }

      let logoBase64 = '';
      try {
        const logoBuffer = await fs.readFile(path.join(ASSETS_DIR, 'logo.png'));
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } catch {
        logoBase64 = '';
      }

      const html = template
        .replace(/{{LOGO_URL}}/g, logoBase64)
        .replace(/{{PERIOD_LABEL}}/g, escapeHtml(periodLabel))
        .replace(/{{EXPORT_DATE}}/g, new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
        .replace('{{KPI_ROWS}}', kpiRowsHtml)
        .replace('{{CATEGORY_ROWS}}', categoryRowsHtml)
        .replace('{{CATEGORY_TOTALS}}', categoryTotalsHtml)
        .replace('{{SERVICE_ROWS}}', serviceRowsHtml)
        .replace('{{PRIORITY_ROWS}}', priorityRowsHtml)
        .replace('{{SUBCAT_ROWS}}', subCatRowsHtml)
        .replace('{{SUBPROC_ROWS}}', subProcRowsHtml);

      const pdfBuffer = await IncidentPdfService.generateBuffer(html);

      const filename = `tableau_statistique_${new Date().toISOString().slice(0, 10)}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', String(pdfBuffer.length));
      return res.status(200).send(pdfBuffer);
    } catch (error) {
      console.error('[REPORT] exportStatisticsPdf error:', error);
      return res.status(500).json({ message: 'Erreur génération PDF statistiques' });
    }
  }

  /**
   * POST /api/v1/reports/pilotage/export/pdf
   * Body: { dateFrom?: string; periodLabel?: string }
   * Génère un PDF du pilotage (catégories/processus) avec l'en-tête SOREPCO.
   */
  static async exportPilotagePdf(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser?.id) return res.status(401).json({ message: 'Unauthorized' });

      const dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { roles: { include: { role: true } } },
      });
      if (!dbUser) return res.status(404).json({ message: 'Utilisateur introuvable' });

      const roles = dbUser.roles
        .map((r) => r.role?.name)
        .filter(Boolean)
        .map((n: string) => n.toUpperCase());

      const user = { id: dbUser.id, roles, siteId: dbUser.siteId ?? undefined };

      const dateFromParam = req.body?.dateFrom as string | undefined;
      const periodLabel = (req.body?.periodLabel as string | undefined) || 'Tout';
      const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;

      const incidentService = new IncidentService();
      const catProc = await incidentService.getByCategoryProcess({ ...user, dateFrom });

      const catList = Array.isArray(catProc?.categories) ? catProc.categories : [];
      const totals = catList.reduce(
        (acc, c) => ({
          total: acc.total + (c.total || 0),
          open: acc.open + (c.open || 0),
          inProgress: acc.inProgress + (c.inProgress || 0),
          closed: acc.closed + (c.closed || 0),
          cancelled: acc.cancelled + (c.cancelled || 0),
        }),
        { total: 0, open: 0, inProgress: 0, closed: 0, cancelled: 0 }
      );
      const enCours = totals.open + totals.inProgress;
      const resolutionRate = totals.total > 0 ? Math.round((totals.closed / totals.total) * 100) : 0;

      const kpis: { label: string; value: string }[] = [
        { label: 'Total incidents', value: String(totals.total) },
        { label: 'Catégories concernées', value: String(catList.length) },
        { label: 'Processus concernés', value: String(Array.isArray(catProc?.processes) ? catProc.processes.length : 0) },
        { label: 'Taux de résolution', value: `${resolutionRate}%` },
      ];
      const kpiRowsHtml = kpis
        .map((k) => `<div class="kpi"><span class="kpi-label">${escapeHtml(k.label)}</span><span class="kpi-value">${escapeHtml(k.value)}</span></div>`)
        .join('');

      const categoryRowsHtml = catList.length
        ? catList
            .map((c: any) => {
              const rate = c.total > 0 ? Math.round((c.closed / c.total) * 100) : 0;
              return `
          <tr>
            <td>${escapeHtml(c.name)}</td>
            <td class="num">${c.total}</td>
            <td class="num">${(c.inProgress || 0) + (c.open || 0)}</td>
            <td class="num">${c.closed}</td>
            <td class="num">${c.cancelled}</td>
            <td class="num">${rate}%</td>
          </tr>`;
            })
            .join('')
        : '<tr><td colspan="6" class="empty">Aucune donnée pour la période sélectionnée</td></tr>';

      const categoryTotalsHtml = catList.length
        ? `<tr class="total-row">
          <td>Total</td>
          <td class="num">${totals.total}</td>
          <td class="num">${enCours}</td>
          <td class="num">${totals.closed}</td>
          <td class="num">${totals.cancelled}</td>
          <td class="num">${resolutionRate}%</td>
        </tr>`
        : '';

      const processRowsHtml =
        Array.isArray(catProc?.processes) && catProc.processes.length
          ? catProc.processes
              .map((p: any) => `
          <tr>
            <td>${escapeHtml(p.name)}</td>
            <td class="num">${p.total}</td>
          </tr>`)
              .join('')
          : '<tr><td colspan="2" class="empty">Aucune donnée</td></tr>';

      const subCatRowsHtml =
        Array.isArray(catProc?.subCategories) && catProc.subCategories.length
          ? catProc.subCategories
              .slice(0, 8)
              .map((s: any) => `
          <tr>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.categoryName)}</td>
            <td class="num">${s.total}</td>
          </tr>`)
              .join('')
          : '<tr><td colspan="3" class="empty">Aucune donnée</td></tr>';

      const subProcRowsHtml =
        Array.isArray(catProc?.subProcesses) && catProc.subProcesses.length
          ? catProc.subProcesses
              .slice(0, 8)
              .map((s: any) => `
          <tr>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.processName)}</td>
            <td class="num">${s.total}</td>
          </tr>`)
              .join('')
          : '<tr><td colspan="3" class="empty">Aucune donnée</td></tr>';

      const TEMPLATE_DIR = path.resolve(__dirname, '../../../../templates');
      const ASSETS_DIR = path.resolve(__dirname, '../../../../assets');

      let template: string;
      try {
        template = await fs.readFile(path.join(TEMPLATE_DIR, 'pilotage-report.html'), 'utf8');
      } catch {
        return res.status(500).json({ message: 'Template de pilotage introuvable' });
      }

      let logoBase64 = '';
      try {
        const logoBuffer = await fs.readFile(path.join(ASSETS_DIR, 'logo.png'));
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } catch {
        logoBase64 = '';
      }

      const html = template
        .replace(/{{LOGO_URL}}/g, logoBase64)
        .replace(/{{PERIOD_LABEL}}/g, escapeHtml(periodLabel))
        .replace(/{{EXPORT_DATE}}/g, new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
        .replace('{{KPI_ROWS}}', kpiRowsHtml)
        .replace('{{CATEGORY_ROWS}}', categoryRowsHtml)
        .replace('{{CATEGORY_TOTALS}}', categoryTotalsHtml)
        .replace('{{PROCESS_ROWS}}', processRowsHtml)
        .replace('{{SUBCAT_ROWS}}', subCatRowsHtml)
        .replace('{{SUBPROC_ROWS}}', subProcRowsHtml);

      const pdfBuffer = await IncidentPdfService.generateBuffer(html);

      const filename = `pilotage_${new Date().toISOString().slice(0, 10)}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', String(pdfBuffer.length));
      return res.status(200).send(pdfBuffer);
    } catch (error) {
      console.error('[REPORT] exportPilotagePdf error:', error);
      return res.status(500).json({ message: 'Erreur génération PDF pilotage' });
    }
  }
}
