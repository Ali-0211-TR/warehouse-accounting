import { UserEntity } from "@/entities/user";
import {
  userEntityToUpdateFormData,
  userFormDataToUpdateDTO,
  UserUpdateFormSchema,
  userUpdateValidationSchema,
} from "@/entities/user/model/schemas";
import { UserFormData } from "@/entities/user/model/types";
import { UpdateUserDTO } from "@/shared/bindings/dtos/UpdateUserDTO";
import { RoleType } from "@/shared/bindings/RoleType";
import { EntityForm } from "@/shared/ui/components/EntityForm";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/shadcn/form";
import { Input } from "@/shared/ui/shadcn/input";
import { t } from "i18next";
import { useFormContext } from "react-hook-form";

interface UserFormProps {
  visible: boolean;
  onHide: () => void;
  user: UserEntity;
  onSave: (user: UpdateUserDTO) => Promise<void>;
}

const roleOptions: RoleType[] = [
  "Administrator",
  "Manager",
  "Seller",
  "Operator",
  "Remote",
] as const;

const UserFormFields = () => {
  const form = useFormContext<UserFormData>();
  const currentRoles = form.watch("roles") || [];

  // // Debug: Log current roles

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto md:overflow-visible px-2">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <FormField
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("user.full_name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("user.phone_number")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Roles Section */}
      <div>
        <FormLabel className="text-base font-medium">
          {t("user.roles")}
        </FormLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          {roleOptions.map(role => {
            const isChecked = currentRoles.includes(role);

            return (
              <FormField
                key={role}
                name="roles"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={checked => {
                          const currentValues = field.value || [];
                          const updatedRoles = checked
                            ? [...currentValues, role]
                            : currentValues.filter((r: string) => r !== role);
                          field.onChange(updatedRoles);
                        }}
                      />
                    </FormControl>
                    <FormLabel
                      className="text-sm font-normal cursor-pointer"
                      onClick={() => {
                        // Allow clicking label to toggle checkbox
                        const currentValues = form.getValues("roles") || [];
                        const isCurrentlyChecked = currentValues.includes(role);
                        const updatedRoles = isCurrentlyChecked
                          ? currentValues.filter((r: string) => r !== role)
                          : [...currentValues, role];

                        form.setValue("roles", updatedRoles);
                      }}
                    >
                      {t(`lists.role_type.${role}`)}
                    </FormLabel>
                  </FormItem>
                )}
              />
            );
          })}
        </div>
        <FormMessage />
      </div>
    </div>
  );
};

export function UserUpdateForm({
  visible,
  onHide,
  user,
  onSave,
}: UserFormProps) {
  const header = user?.id ? t("user.edit_user") : t("user.add_user");
  const initialData = userEntityToUpdateFormData(user);
  const handleSave = async (formData: UserUpdateFormSchema) => {
    const user = userFormDataToUpdateDTO(formData);
    await onSave(user);
  };

  return (
    <EntityForm
      visible={visible}
      onHide={onHide}
      header={header}
      schema={userUpdateValidationSchema}
      initialData={initialData}
      onSave={handleSave}
    >
      <UserFormFields />
    </EntityForm>
  );
}
