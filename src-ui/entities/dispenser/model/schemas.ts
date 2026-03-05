import { NozzleDTO } from "@/shared/bindings/NozzleDTO";
import { z } from "zod";
import type { DispenserDTO, DispenserEntity, NozzleEntity } from "./types";

export const emptyDispenser: DispenserDTO = {
  id: null,
  name: "",
  base_address: 0,
  port_id: "",
  camera_id: null,
  state: "Inactive",
};

export const emptyDispenserEntity: DispenserEntity = {
  id: null,
  device_id: "",
  name: "",
  base_address: 0,
  port_id: "",
  camera_id: null,
  port: null,
  camera: null,
  nozzles: [],
  selected_nozzle_id: null,
  fueling_state: {
    nozzle_down: false,
    pause: false,
    start: false,
    card: false,
    kb_control: false,
    kb_preset: false,
    is_error: false,
  },
  state: "Inactive",
  error: null,
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
};
// Function to create validation schema with translations
export const createDispenserValidationSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().nullable(),
    name: z
      .string()
      .min(1, { message: t("validation.dispenser.name_required") }),
    base_address: z.coerce
      .number()
      .min(0, { message: t("validation.dispenser.base_address_non_negative") }),
    port_id: z
      .string()
      .min(1, { message: t("validation.dispenser.port_required") }),
    camera_id: z.string().nullable(),
    state: z.enum(["Active", "Blocked", "Inactive"]),
  });

// Original schema for backward compatibility
export const dispenserValidationSchema = z.object({
  id: z.string().nullable(),
  name: z.string().min(1, { message: "validation.dispenser.name_required" }),
  base_address: z.coerce
    .number()
    .min(0, { message: "validation.dispenser.base_address_non_negative" }),
  port_id: z.string().min(1, { message: "validation.dispenser.port_required" }),
  camera_id: z.string().nullable(),
  state: z.enum(["Active", "Blocked", "Inactive"]),
});

export type DispenserFormSchema = z.infer<typeof dispenserValidationSchema>;

export const dispenserEntityToFormData = (
  dispenser: DispenserEntity | null
): DispenserFormSchema => ({
  id: dispenser?.id ?? null,
  name: dispenser?.name ?? "",
  base_address: dispenser?.base_address ?? 0,
  port_id: dispenser?.port?.id ?? "",
  camera_id: dispenser?.camera?.id ?? null,
  state: dispenser?.state ?? "Inactive",
});

export const dispenserFormDataToDTO = (
  formData: DispenserFormSchema
): DispenserDTO => {
  return {
    id: formData.id,
    name: formData.name,
    base_address: formData.base_address,
    port_id: formData.port_id,
    camera_id: formData.camera_id,
    state: formData.state,
  };
};

// Nozzle schemas
export const nozzleValidationSchema = z.object({
  id: z.string().nullable(),
  dispenser_id: z.string(),
  address: z.coerce
    .number()
    .min(1, { message: "validation.nozzle.address_min" })
    .max(255, { message: "validation.nozzle.address_max" }),
  tank_id: z.string().min(1, { message: "validation.nozzle.tank_required" }),
});

export type NozzleFormSchema = z.infer<typeof nozzleValidationSchema>;

export const nozzleEntityToFormData = (
  nozzle: NozzleEntity | null,
  dispenserId: string | null
): NozzleFormSchema => {
  return {
    id: nozzle?.id ?? null,
    dispenser_id: dispenserId ?? nozzle?.dispenser_id ?? "",
    address: nozzle?.address ?? 1,
    tank_id: nozzle?.tank?.id ?? "",
  };
};

export const nozzleFormDataToDTO = (formData: NozzleFormSchema): NozzleDTO => {
  return {
    id: formData.id,
    dispenser_id: formData.dispenser_id,
    address: formData.address,
    tank_id: formData.tank_id,
    fueling_order_id: null, // Assuming fueling_order_id is not used in this context
  };
};
