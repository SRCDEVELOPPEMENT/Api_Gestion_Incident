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
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((s) => s.trim()).filter(Boolean);
  return [String(value)].map((s) => s.trim()).filter(Boolean);
}

function parseNumberList(value: any): number[] {
  const list = Array.isArray(value) ? value : String(value).split(",").map((s) => s.trim());
  return list.map((v) => Number(v)).filter((n) => Number.isFinite(n));
}

const STRING_FIELDS = new Set([
  "ticketNumber",
  "title",
  "description",
  "categoryName",
  "entityName",
  "locationName",
  "requesterName",
  "assigneeName",
]);

const CODE_FIELDS = new Set(["status", "priority", "urgency", "impact"]);

const DATETIME_FIELDS = new Set(["openedAt", "dueAt"]);

export function buildGLPITicketWhere(
  filters: Filter[],
  logic: Logic
): Prisma.GLPITicketWhereInput {
  const parts: Prisma.GLPITicketWhereInput[] = [];

  for (const f of filters) {
    const { field, op, value } = f;

    if (op === "isEmpty" || op === "isNotEmpty") {
      if (STRING_FIELDS.has(field)) {
        parts.push({
          [field]: op === "isEmpty" ? { equals: "" } : { not: "" },
        } as any);
      }
      continue;
    }

    if (isBlank(value)) continue;

    if (field === "glpiId") {
      parts.push(mapNumber(field, op, value));
      continue;
    }

    if (STRING_FIELDS.has(field)) {
      parts.push(mapString(field, op, value));
      continue;
    }

    if (CODE_FIELDS.has(field)) {
      parts.push(mapCode(field, op, value));
      continue;
    }

    if (DATETIME_FIELDS.has(field)) {
      parts.push(mapDateTime(field, op, value));
      continue;
    }
  }

  return parts.length === 0 ? {} : ({ [logic]: parts } as any);
}

function mapString(field: string, op: string, value: any): Prisma.GLPITicketWhereInput {
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

function mapCode(field: string, op: string, value: any): Prisma.GLPITicketWhereInput {
  if (op === "in") {
    const list = parseList(value);
    return list.length ? ({ [field]: { in: list } } as any) : {};
  }

  if (op === "notIn") {
    const list = parseList(value);
    return list.length ? ({ [field]: { notIn: list } } as any) : {};
  }

  if (op === "neq") {
    return { [field]: { not: String(value) } } as any;
  }

  if (op === "contains") {
    return { [field]: { contains: String(value) } } as any;
  }

  return { [field]: { equals: String(value) } } as any;
}

function mapDateTime(field: string, op: string, value: any): Prisma.GLPITicketWhereInput {
  if (op === "between") {
    const [a, b] = Array.isArray(value) ? value : [];
    if (!a || !b) return {};
    return { [field]: { gte: new Date(a), lte: new Date(b) } } as any;
  }

  if (op === "gte") return { [field]: { gte: new Date(value) } } as any;
  if (op === "lte") return { [field]: { lte: new Date(value) } } as any;
  if (op === "gt") return { [field]: { gt: new Date(value) } } as any;
  if (op === "lt") return { [field]: { lt: new Date(value) } } as any;
  if (op === "eq") return { [field]: { equals: new Date(value) } } as any;
  if (op === "neq") return { [field]: { not: new Date(value) } } as any;

  return {};
}

function mapNumber(field: string, op: string, value: any): Prisma.GLPITicketWhereInput {
  if (op === "in") {
    const list = parseNumberList(value);
    return list.length ? ({ [field]: { in: list } } as any) : {};
  }

  if (op === "notIn") {
    const list = parseNumberList(value);
    return list.length ? ({ [field]: { notIn: list } } as any) : {};
  }

  const n = Number(value);
  if (!Number.isFinite(n)) return {};

  if (op === "eq") return { [field]: { equals: n } } as any;
  if (op === "neq") return { [field]: { not: n } } as any;
  if (op === "gt") return { [field]: { gt: n } } as any;
  if (op === "gte") return { [field]: { gte: n } } as any;
  if (op === "lt") return { [field]: { lt: n } } as any;
  if (op === "lte") return { [field]: { lte: n } } as any;

  return {};
}
