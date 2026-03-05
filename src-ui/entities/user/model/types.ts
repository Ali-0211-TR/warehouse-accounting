import { UserEntity, UserRole } from "..";

// Re-export the generated type from backend
export type { UserEntity } from "../../../shared/bindings/UserEntity";
export type { RoleType as UserRole } from "../../../shared/bindings/RoleType";

// Filter types - renamed to avoid conflicts
export interface UserFilterState {
  search: string;
  roles?: UserRole[];
}

export interface UserFormData extends Omit<UserEntity, "id"> {
  id?: number | null;
  confirmPassword?: string;
}
