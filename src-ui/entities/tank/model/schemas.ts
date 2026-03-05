import { z } from "zod";
import type { TankDTO, TankEntity } from "./types";

export const emptyTank: TankDTO = {
  id: null,
  name: "",
  protocol: null,
  address: null,
  server_address: null,
  server_port: null,
  port_name: null,
  port_speed: null,
  product_id: "", // Will be set to actual product ID
  balance: 0,
  volume_max: 0,
};

export const emptyTankEntity: TankEntity = {
  id: null,
  device_id: "",
  name: "",
  protocol: null,
  address: null,
  server_address: null,
  server_port: null,
  port_name: null,
  port_speed: null,
  product: null,
  product_id: "",
  balance: 0,
  volume_max: 0,
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
};

const protocolTypeSchema = z.enum(["TexnoUz", "Arrow"]);

export const tankValidationSchema = z.object({
  id: z.string().nullable(),
  name: z.string().min(1, { message: "validation.tank.name_required" }),
  protocol: protocolTypeSchema.nullable(),
  address: z.coerce.number().min(1).nullable(),
  server_address: z.string().nullable(),
  server_port: z.coerce.number().min(1).max(65535).nullable(),
  port_name: z.string().nullable(),
  port_speed: z.coerce.number().min(1).nullable(),
  product_id: z
    .string()
    .min(1, { message: "validation.tank.product_required" }),
  balance: z.coerce
    .number()
    .min(0, { message: "validation.tank.balance_positive" }),
  volume_max: z.coerce
    .number()
    .min(0, { message: "validation.tank.volume_max_positive" }),
});

export type TankFormSchema = z.infer<typeof tankValidationSchema>;

export const tankEntityToFormData = (
  tank: TankEntity | null
): TankFormSchema => ({
  id: tank?.id ?? null,
  name: tank?.name ?? "",
  protocol: tank?.protocol ?? null,
  address: tank?.address ?? null,
  server_address: tank?.server_address ?? null,
  server_port: tank?.server_port ?? null,
  port_name: tank?.port_name ?? null,
  port_speed: tank?.port_speed ?? null,
  product_id: tank?.product?.id ?? "",
  balance: tank?.balance ?? 0,
  volume_max: tank?.volume_max ?? 0,
});

export const tankFormDataToDTO = (formData: TankFormSchema): TankDTO => {
  return {
    id: formData.id,
    name: formData.name,
    protocol: formData.protocol,
    address: formData.address,
    server_address: formData.server_address,
    server_port: formData.server_port,
    port_name: formData.port_name,
    port_speed: formData.port_speed,
    product_id: formData.product_id,
    balance: formData.balance,
    volume_max: formData.volume_max,
  };
};
