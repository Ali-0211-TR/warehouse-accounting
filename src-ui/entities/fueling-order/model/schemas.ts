import { FuelingOrderFilter } from "@/shared/bindings/FuelingOrderFilter";
import { z } from "zod";

const fuelingTypeSchema = z.enum(["Regular", "NoCache", "Kalibr", "Progon"]);

const presetTypeSchema = z.enum(["Volume", "Amount"]);

export const initFuelOrderFilter: FuelingOrderFilter = {
  id: null,
  order_item_id: null,
  nozzle_id: null,
  d_created: null,
  d_move: null,
  fueling_type: null,
  preset_type: null,
  title: null,
};

export const fuelingOrderFilterSchema = z.object({
  search: z.string().optional(),
  id: z.string().nullable().optional(),
  orderItemId: z.string().nullable().optional(),
  nozzleId: z
    .union([z.string(), z.literal("all")])
    .nullable()
    .optional(),
  fuelingType: z.union([fuelingTypeSchema, z.literal("all")]).optional(),
  presetType: z.union([presetTypeSchema, z.literal("all")]).optional(),
  title: z.string().nullable().optional(),
  createdDateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .nullable()
    .optional(),
  moveDateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export type FuelingOrderFormSchema = z.infer<typeof fuelingOrderFilterSchema>;
