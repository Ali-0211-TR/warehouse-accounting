import { ChangePasswordDTO } from "@/shared/bindings/dtos/ChangePasswordDTO";
import { CreateUserDTO } from "@/shared/bindings/dtos/CreateUserDTO";
import { UpdateUserDTO } from "@/shared/bindings/dtos/UpdateUserDTO";
import { RoleType } from "@/shared/bindings/RoleType";
import { z } from "zod";
import { UserEntity } from "./types";

export const emptyUser: UserEntity = {
  id: null,
  device_id: "",
  full_name: "",
  username: "",
  phone_number: "",
  roles: [],
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
};

export const changeUserPasswordValidationSchema = z.object({
  id: z.string(),
  password: z.string(),
});
export type ChangeUserPasswordFormSchema = z.infer<
  typeof changeUserPasswordValidationSchema
>;

export const userCreateValidationSchema = z.object({
  id: z.string().nullable(),
  full_name: z.string().min(1, { message: "Full name is required" }),
  username: z.string().min(1, { message: "Username is required" }),
  phone_number: z.string(),
  password: z.string(),
  roles: z.array(z.string()),
});

// Export the inferred type
export type UserCreateFormSchema = z.infer<typeof userCreateValidationSchema>;

export const userUpdateValidationSchema = z.object({
  id: z.string().nullable(),
  full_name: z.string().min(1, { message: "Full name is required" }),
  phone_number: z.string(),
  roles: z.array(z.string()),
});

// Export the inferred type
export type UserUpdateFormSchema = z.infer<typeof userUpdateValidationSchema>;

export const userEntityToUpdateFormData = (
  user: UserEntity | null
): UserUpdateFormSchema => ({
  id: user?.id ?? null,
  full_name: user?.full_name ?? "",
  phone_number: user?.phone_number ?? "",
  roles: user?.roles ?? [],
});

export const userEntityToCreateFormData = (
  user: UserEntity | null
): UserCreateFormSchema => ({
  id: user?.id ?? null,
  full_name: user?.full_name ?? "",
  username: user?.username ?? "",
  phone_number: user?.phone_number ?? "",
  password: "",
  roles: user?.roles ?? [],
});
export const userEntityToChangePasswordFormData = (
  user: UserEntity | null
): ChangeUserPasswordFormSchema => {
  if (user?.id == null) {
    throw new Error("User id cannot be null when changing password");
  }
  return {
    id: user.id,
    password: "",
  };
};

export const formDataToChangePasswordDTO = (
  formData: ChangeUserPasswordFormSchema
): ChangePasswordDTO => {
  return {
    id: formData.id,
    password: formData.password,
  };
};
export const userFormDataToUpdateDTO = (
  formData: UserUpdateFormSchema
): UpdateUserDTO => {
  if (formData.id === null) {
    throw new Error("User id cannot be null when updating user");
  }
  return {
    id: formData.id,
    full_name: formData.full_name,
    phone_number: formData.phone_number,
    roles: formData.roles as RoleType[],
  };
};

export const userFormDataToCreateDTO = (
  formData: UserCreateFormSchema
): CreateUserDTO => {
  return {
    full_name: formData.full_name,
    username: formData.username,
    phone_number: formData.phone_number,
    password: formData.password,
    roles: formData.roles as RoleType[],
  };
};
