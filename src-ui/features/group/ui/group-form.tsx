import { GroupEntity, groupValidationSchema } from "@/entities/group";
import {
  groupEntityToFormData,
  groupFormDataToDTO,
  GroupFormSchema,
} from "@/entities/group/model/schemas";
import { useDiscount } from "@/features/discount";
import { useMark } from "@/features/mark";
import { GroupDTO } from "@/shared/bindings/GroupDTO";
import { GROUP_TYPE_OPTIONS } from "@/shared/const/options";
import { CheckBox } from "@/shared/ui/components/CheckBox";
import { EntityForm } from "@/shared/ui/components/EntityForm";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/shadcn/form";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { t } from "i18next";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useGroup } from "../model/use-group";

interface GroupFormProps {
  visible: boolean;
  onHide: () => void;
  group: GroupEntity | null;
  onSave: (group: GroupDTO) => Promise<void>;
}

const GroupFormFields = () => {
  const { groups } = useGroup();
  const { marks } = useMark();
  const { discounts } = useDiscount();

  const { watch, setValue } = useFormContext<GroupFormSchema>();
  const watchedDiscountIds = watch("discount_ids") || [];
  const except_groups = useMemo(() => {
    return groups ?? [];
  }, [groups]);

  const handleDiscountChange = (selectedIds: (number | string)[]) => {
    setValue("discount_ids", selectedIds as string[], { shouldValidate: true });
  };
  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto md:overflow-visible px-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("group.name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="group_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("group.type")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder={t("group.select_type")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GROUP_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="parent_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("group.parent")}</FormLabel>
              <Select
                onValueChange={value =>
                  field.onChange(value === "none" ? null : value)
                }
                value={
                  field.value === null || field.value === undefined
                    ? "none"
                    : field.value.toString()
                }
              >
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder={t("group.select_parent")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {except_groups.map(group => (
                    <SelectItem key={group.id} value={group.id!.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="mark_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("group.mark")}</FormLabel>
              <Select
                onValueChange={value =>
                  field.onChange(value === "none" ? null : value)
                }
                value={
                  field.value === null || field.value === undefined
                    ? "none"
                    : field.value.toString()
                }
              >
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder={t("group.select_mark")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {marks.map(mark => (
                    <SelectItem key={mark.id} value={mark.id!.toString()}>
                      {mark.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Discounts Section */}
        <div className="space-y-3 col-span-full">
          <FormLabel>{t("group.discounts")}</FormLabel>
          <CheckBox
            items={discounts
              .filter(discount => discount.id !== null)
              .map(discount => ({
                id: discount.id as string,
                name: discount.name,
              }))}
            selectedIds={watchedDiscountIds}
            onSelectionChange={handleDiscountChange}
          />
        </div>
      </div>
    </div>
  );
};

export function GroupForm({ visible, onHide, group, onSave }: GroupFormProps) {
  const header = group?.id ? t("group.edit_group") : t("group.add_group");
  const initialData = groupEntityToFormData(group);
  const handleSave = async (formData: GroupFormSchema) => {
    const group = groupFormDataToDTO(formData);
    await onSave(group);
  };

  return (
    <EntityForm
      visible={visible}
      onHide={onHide}
      header={header}
      schema={groupValidationSchema}
      initialData={initialData}
      onSave={handleSave}
    >
      <GroupFormFields />
    </EntityForm>
  );
}
