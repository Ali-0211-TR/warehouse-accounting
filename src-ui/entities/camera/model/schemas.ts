import { z } from "zod";
import type { CameraDTO, CameraEntity } from "./types";

const cameraTypeSchema = z.enum([
  "Blocked",
  "Local",
  "NetworkJpeg",
  "NetworkMjpeg",
]);

export const emptyCamera: CameraEntity = {
  id: null,
  camera_type: "Local" as const,
  name: "",
  address: "",
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
  device_id: "",
};

export const cameraValidationSchema = z.object({
  id: z.string().nullable(),
  name: z.string().min(1, { message: "validation.camera.name_required" }),
  camera_type: cameraTypeSchema.refine(val => val !== undefined, {
    message: "validation.camera.type_required",
  }),
  address: z.string().min(1, { message: "validation.camera.address_required" }),
});

export type CameraFormSchema = z.infer<typeof cameraValidationSchema>;

export const cameraEntityToFormData = (
  camera: CameraEntity | null
): CameraFormSchema => ({
  id: camera?.id ?? null,
  name: camera?.name ?? "",
  camera_type: camera?.camera_type ?? "Local",
  address: camera?.address ?? "",
});

export const cameraFormDataToDTO = (formData: CameraFormSchema): CameraDTO => {
  return {
    id: formData.id,
    name: formData.name,
    camera_type: formData.camera_type,
    address: formData.address,
  };
};
