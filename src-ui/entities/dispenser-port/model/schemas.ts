import { DispenserPortDTO } from "@/shared/bindings/DispenserPortDTO";
import { z } from "zod";
import type { DispenserPortEntity } from "./types";

export const emptyDispenserPort: DispenserPortEntity = {
  id: null,
  device_id: "",
  protocol: "BlueSky",
  port_name: "",
  port_speed: 9600,
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
};

const protocolTypeSchema = z.enum(["TexnoUz", "BlueSky", "Shelf"]);

export const dispenserPortValidationSchema = z.object({
  id: z.string().nullable(),
  protocol: protocolTypeSchema.refine(val => val !== undefined, {
    message: "validation.dispenser_port.protocol_required",
  }),
  port_name: z
    .string()
    .min(1, { message: "validation.dispenser_port.port_name_required" }),
  port_speed: z.coerce
    .number()
    .min(1, { message: "validation.dispenser_port.port_speed_positive" }),
});

export type DispenserPortFormSchema = z.infer<
  typeof dispenserPortValidationSchema
>;

export const dispenserPortEntityToFormData = (
  dispenserPort: DispenserPortEntity | null
): DispenserPortFormSchema => ({
  id: dispenserPort?.id ?? null,
  protocol: dispenserPort?.protocol ?? "BlueSky",
  port_name: dispenserPort?.port_name ?? "",
  port_speed: dispenserPort?.port_speed ?? 9600,
});

export const dispenserPortFormDataToDTO = (
  formData: DispenserPortFormSchema
): DispenserPortDTO => {
  return {
    id: formData.id,
    protocol: formData.protocol,
    port_name: formData.port_name,
    port_speed: formData.port_speed,
  };
};
