import {
  DiscountEntity,
  DiscountFormSchema,
  discountValidationSchema,
} from "@/entities/discount";
import type { DiscountDTO } from "@/shared/bindings/DiscountDTO";
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

import {
  discountEntityToFormData,
  discountFormDataToDTO,
} from "@/entities/discount/model/schemas";
import {
  DISCOUNT_BOUND_TYPE_OPTIONS,
  DISCOUNT_TYPE_OPTIONS,
  DISCOUNT_UNIT_TYPE_OPTIONS,
  ORDER_TYPE_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
} from "@/shared/const/options";

interface DiscountFormProps {
  visible: boolean;
  onHide: () => void;
  discount: DiscountEntity | null;
  onSave: (discount: DiscountEntity | DiscountDTO) => Promise<void>;
}

const DiscountFormFields = () => {
  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto md:overflow-visible px-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("discount.name")}</FormLabel>
              <FormControl>
                <Input {...field} className="w-full" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="discount_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("discount.type")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("discount.select_type")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DISCOUNT_TYPE_OPTIONS.map(option => (
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
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("discount.value")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...field}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="bound"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("discount.bound")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...field}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="discount_bound_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("discount.bound_type")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("discount.select_bound_type")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DISCOUNT_BOUND_TYPE_OPTIONS.map(option => (
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
          name="discount_unit_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("discount.unit_type")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("discount.select_unit_type")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DISCOUNT_UNIT_TYPE_OPTIONS.map(option => (
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
          name="product_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("discount.product_type")}</FormLabel>
              <Select
                onValueChange={value =>
                  field.onChange(value === "null" ? null : value)
                }
                value={field.value || "null"}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("discount.select_product_type")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRODUCT_TYPE_OPTIONS.map(option => (
                    <SelectItem
                      key={option.value || "null"}
                      value={option.value || "null"}
                    >
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
          name="order_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("discount.order_type")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("discount.select_order_type")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ORDER_TYPE_OPTIONS.map(option => (
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
      </div>
    </div>
  );
};

export function DiscountForm({
  visible,
  onHide,
  discount,
  onSave,
}: DiscountFormProps) {
  const header = discount?.id
    ? t("discount.edit_discount")
    : t("discount.add_discount");

  const initialData = discountEntityToFormData(discount);
  const handleSave = async (formData: DiscountFormSchema) => {
    const tank = discountFormDataToDTO(formData);
    await onSave(tank);
  };

  return (
    <EntityForm
      visible={visible}
      onHide={onHide}
      header={header}
      schema={discountValidationSchema}
      initialData={initialData}
      onSave={handleSave}
    >
      <DiscountFormFields />
    </EntityForm>
  );
}
