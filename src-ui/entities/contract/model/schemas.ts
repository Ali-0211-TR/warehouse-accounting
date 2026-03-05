import { z } from "zod";
import type { ContractDTO, ContractEntity } from "./types";

export const emptyContract: ContractEntity = {
  id: null,
  device_id: "",
  client: null,
  name: "",
  contract_name: "",
  d_begin: "",
  d_end: "",
  contract_products: [],
  contract_cars: [],
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
};

export const contractValidationSchema = z
  .object({
    id: z.string().nullable(),
    device_id: z.string(),
    client_id: z.string().nullable(),
    name: z.string().min(1, { message: "contract.name_required" }),
    contract_name: z
      .string()
      .min(1, { message: "contract.contract_name_required" }),
    d_begin: z.string().min(1, { message: "contract.d_begin_required" }),
    d_end: z.string().min(1, { message: "contract.d_end_required" }),
  })
  .refine(
    data => {
      if (data.d_begin && data.d_end) {
        return new Date(data.d_begin) <= new Date(data.d_end);
      }
      return true;
    },
    {
      message: "contract.date_range_invalid",
      path: ["d_end"],
    }
  );

export type ContractFormSchema = z.infer<typeof contractValidationSchema>;
export const contractEntityToFormData = (
  contract: ContractEntity | null
): ContractFormSchema => ({
  id: contract?.id ?? null,
  device_id: contract?.device_id ?? "",
  client_id: contract?.client?.id ?? null,
  name: contract?.name ?? "",
  contract_name: contract?.contract_name ?? "",
  d_begin: contract?.d_begin ?? "",
  d_end: contract?.d_end ?? "",
});

export const contractFormDataToDTO = (
  data: ContractFormSchema
): ContractDTO => ({
  id: data.id,
  device_id: data.device_id,
  client_id: data.client_id,
  name: data.name,
  contract_name: data.contract_name,
  d_begin: data.d_begin,
  d_end: data.d_end,
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
});
