import { z } from "zod";

const LogicSchema = z.enum(["AND", "OR"]);

const FieldSchema = z.enum([
  "glpiId",
  "ticketNumber",
  "title",
  "description",
  "status",
  "priority",
  "urgency",
  "impact",
  "categoryName",
  "entityName",
  "locationName",
  "requesterName",
  "assigneeName",
  "openedAt",
  "dueAt",
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
  "notIn",
]);

const FilterSchema = z.object({
  field: FieldSchema,
  op: OpSchema,
  value: z.any().optional(),
});

const SortSchema = z.object({
  field: z.enum(["glpiId", "openedAt", "dueAt", "status", "priority", "urgency", "impact", "title"]),
  dir: z.enum(["asc", "desc"]),
});

export const GLPITicketQuerySchema = z.object({
  logic: LogicSchema.default("AND"),
  filters: z.array(FilterSchema).max(10).default([]),
  sort: z
    .array(SortSchema)
    .max(3)
    .default([{ field: "glpiId", dir: "desc" }]),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  tz: z.string().optional(),
});
