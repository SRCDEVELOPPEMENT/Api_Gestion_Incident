import { Prisma } from "@prisma/client";

type Filter = { field: string; op: string; value?: any };
type Logic = "AND" | "OR";

function isBlank(v: any) {
  return (
    v === undefined ||
    v === null ||
    v === "" ||
    (Array.isArray(v) && v.length === 0)
  );
}

function parseList(value: any): string[] {
  if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map(s => s.trim()).filter(Boolean);
  return [String(value)].map(s => s.trim()).filter(Boolean);
}

function parseNumberList(value: any): number[] {
  const list = Array.isArray(value)
    ? value
    : String(value).split(",").map(s => s.trim());
  return list.map(v => Number(v)).filter(n => Number.isFinite(n));
}

export function buildIncidentWhere(
  filters: Filter[],
  logic: Logic
): Prisma.IncidentWhereInput {
  const parts: Prisma.IncidentWhereInput[] = [];

  for (const f of filters) {
    const { field, op, value } = f;

    // -----------------------------
    // operators not needing value
    // -----------------------------
    if (op === "isEmpty") {
        // ✅ Uniquement sur champs string où "vide" a du sens
        if (field === "description") {
            parts.push({ OR: [{ description: "" }] } as any);
            continue;
        }

        
        if (field === "reference") {
            parts.push({ OR: [{ reference: "" }] } as any);
            continue;
        }

    // ⛔ Ne pas produire de filtre NULL sur status/urgency/dates/etc.
    // Sinon Prisma TS crie si le champ n'est pas nullable.
    continue;
    }

    if (op === "isNotEmpty") {
        if (field === "description") {
            parts.push({ description: { not: "" } } as any);
            continue;
        }

        if (field === "reference") {
            parts.push({ reference: { not: "" } } as any);
            continue;
        }

        // ⛔ idem : pas de NOT NULL sur champs non-nullables
        continue;
    }

    // other ops require a value
    if (isBlank(value)) continue;

    // -----------------------------
    // FIELD MAPPINGS (relations)
    // -----------------------------
    if (field === "emitterSiteId") {
      // reporter.siteId
      parts.push(mapReporterSite(op, value));
      continue;
    }

    if (field === "receiverSiteId") {
      // incidentSites.some.siteId
      parts.push(
        mapNumber(op, value, (v) => ({
          incidentSites: { some: { siteId: v } },
        }))
      );
      continue;
    }

    if (field === "assignedPersonneId") {
      parts.push(
        mapNumber(op, value, (v) => ({
          incidentPersonnes: { some: { personneId: v } },
        }))
      );
      continue;
    }

    if (field === "emitterServiceId") {
      parts.push(mapNumber(op, value, (v) => ({ emitterServiceId: v } as any)));
      continue;
    }

    if (field === "receiverServiceId") {
      parts.push(mapNumber(op, value, (v) => ({ receiverServiceId: v } as any)));
      continue;
    }

    // -----------------------------
    // SIMPLE FIELDS
    // -----------------------------
    if (field === "reference" || field === "description") {
      parts.push(mapString(field, op, value));
      continue;
    }

    if (field === "status" || field === "urgency") {
      parts.push(mapEnum(field, op, value));
      continue;
    }

    if (field === "createdAt" || field === "dueDate") {
      parts.push(mapDateTime(field, op, value));
      continue;
    }
  }

  return parts.length === 0 ? {} : ({ [logic]: parts } as any);
}

function mapString(
  field: "reference" | "description",
  op: string,
  value: any
): Prisma.IncidentWhereInput {
  const v = String(value).trim();

  switch (op) {
    case "contains":
      return { [field]: { contains: v } } as any;
    case "eq":
      return { [field]: { equals: v } } as any;
    case "neq":
      return { [field]: { not: v } } as any;
    case "startsWith":
      return { [field]: { startsWith: v } } as any;
    case "endsWith":
      return { [field]: { endsWith: v } } as any;
    default:
      return {};
  }
}

function mapEnum(field: string, op: string, value: any): Prisma.IncidentWhereInput {
  if (op === "in") {
    const list = parseList(value);
    return { [field]: { in: list } } as any;
  }

  if (op === "notIn") {
    const list = parseList(value);
    return { [field]: { notIn: list } } as any;
  }

  if (op === "neq") {
    return { [field]: { not: value } } as any;
  }

  // eq (par défaut)
  return { [field]: { equals: value } } as any;
}

function mapDateTime(field: string, op: string, value: any): Prisma.IncidentWhereInput {
  // value expected as ISO string (UTC) or [isoStart, isoEnd] for between
  if (op === "between") {
    const [a, b] = Array.isArray(value) ? value : [];
    if (!a || !b) return {};
    return { [field]: { gte: new Date(a), lte: new Date(b) } } as any; // inclusive
  }

  if (op === "gte") return { [field]: { gte: new Date(value) } } as any;
  if (op === "lte") return { [field]: { lte: new Date(value) } } as any;
  if (op === "gt") return { [field]: { gt: new Date(value) } } as any;
  if (op === "lt") return { [field]: { lt: new Date(value) } } as any;

  if (op === "eq") return { [field]: { equals: new Date(value) } } as any;
  if (op === "neq") return { [field]: { not: new Date(value) } } as any;

  return {};
}

function mapNumber(
  op: string,
  value: any,
  build: (n: number) => Prisma.IncidentWhereInput
): Prisma.IncidentWhereInput {
  if (op === "in") {
    const list = parseNumberList(value);
    if (list.length === 0) return {};
    return { OR: list.map((v) => build(v)) } as any;
  }

  if (op === "notIn") {
    const list = parseNumberList(value);
    if (list.length === 0) return {};
    // NOT (OR ...)
    return { NOT: { OR: list.map((v) => build(v)) } } as any;
  }

  // between pas pertinent pour relations (sites/personnes) => ignore
  if (op === "between") return {};

  const n = Number(value);
  if (!Number.isFinite(n)) return {};

  if (op === "eq") return build(n) as any;
  if (op === "neq") return { NOT: build(n) } as any;

  return {};
}

function mapReporterSite(op: string, value: any): Prisma.IncidentWhereInput {
  if (op === "in") {
    const list = parseNumberList(value);
    if (list.length === 0) return {};
    return { OR: list.map((v) => ({ reporter: { siteId: v } })) } as any;
  }

  if (op === "notIn") {
    const list = parseNumberList(value);
    if (list.length === 0) return {};
    return { NOT: { OR: list.map((v) => ({ reporter: { siteId: v } })) } } as any;
  }

  const n = Number(value);
  if (!Number.isFinite(n)) return {};

  if (op === "eq") return { reporter: { siteId: n } } as any;
  if (op === "neq") return { NOT: { reporter: { siteId: n } } } as any;

  return {};
}
