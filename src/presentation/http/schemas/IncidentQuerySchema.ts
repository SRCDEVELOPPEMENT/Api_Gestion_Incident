import { z } from "zod";

const LogicSchema = z.enum(["AND", "OR"]);

const FieldSchema = z.enum([
  "reference",
  "description",
  "status",
  "urgency",

  // anciens (site-based)
  "emitterSiteId",
  "receiverSiteId",

  // nouveaux (service-based)
  "emitterServiceId",
  "receiverServiceId",

  "assignedPersonneId",
  "createdAt",
  "dueDate",
]);

const OpSchema = z.enum([
  "contains",
  "eq",
  "neq",
  "startsWith",
  "endsWith",
  "isEmpty",
  "isNotEmpty",
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  "in",
  "notIn", // ✅ AJOUT
]);

const FilterSchema = z.object({
  field: FieldSchema,
  op: OpSchema,
  value: z.any().optional(),
});

const SortSchema = z.object({
  field: z.enum(["createdAt", "dueDate", "status", "urgency", "reference"]),
  dir: z.enum(["asc", "desc"]),
});

export const IncidentQuerySchema = z.object({
  logic: LogicSchema.default("AND"),
  filters: z.array(FilterSchema).max(10).default([]),
  sort: z
    .array(SortSchema)
    .max(3)
    .default([{ field: "createdAt", dir: "desc" }]),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  tz: z.string().optional(),
});