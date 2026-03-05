import { z } from "zod";
import type { OrderEntity, OrderFilter } from "./types";

const orderTypeSchema = z.enum([
  "Income",
  "Outcome",
  "Sale",
  "Returns",
]);

export const emptyOrder: OrderEntity = {
  id: null,
  device_id: "",
  order_type: "Sale",
  d_created: new Date().toISOString(),
  d_move: "",
  summ: 0,
  tax: 0,
  discard: null,
  client: null,
  contract: null,
  contract_car: null,
  items: [],
  fueling_order_item_id: null,
  pictures: [],
  payments: [],
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
};

export const initOrderFilter: OrderFilter = {
  id: null,
  client_id: null,
  company: null,
  order_type: null,
  d_move: null,
};

export const orderValidationSchema = z.object({
  id: z.number().nullable().optional(),
  order_type: orderTypeSchema,
  d_created: z.string().min(1, { message: "order.d_created_required" }),
  d_move: z.string(),
  summ: z.number().min(0, { message: "order.summ_min" }),
  tax: z.number().min(0, { message: "order.tax_min" }),
  discard: z.string().nullable().optional(),
  client_id: z.number().nullable().optional(),
  contract_id: z.number().nullable().optional(),
  contract_car_id: z.number().nullable().optional(),
  item_ids: z.array(z.number()),
  fueling_order_item_id: z.number().nullable().optional(),
  picture_ids: z.array(z.number()),
});

export const orderItemValidationSchema = z.object({
  id: z.number().nullable().optional(),
  order_id: z.number().min(1, { message: "order.order_required" }),
  product_id: z.number().nullable().optional(),
  contract_product_id: z.number().nullable().optional(),
  fueling_order_id: z.number().nullable().optional(),
  count: z.number().min(0.01, { message: "order.count_min" }),
  price: z.number().min(0, { message: "order.price_min" }),
  discount: z.number().min(0, { message: "order.discount_min" }),
  cost: z.number().min(0, { message: "order.cost_min" }),
  tax: z.number().min(0, { message: "order.tax_min" }),
});

export const orderFilterSchema = z.object({
  search: z.string().optional(),
  id: z.string().nullable().optional(),
  orderType: z.union([orderTypeSchema, z.literal("all")]).optional(),
  clientId: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  shiftId: z.string().nullable().optional(),
  dateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export type OrderFormSchema = z.infer<typeof orderValidationSchema>;
export type OrderItemFormSchema = z.infer<typeof orderItemValidationSchema>;
