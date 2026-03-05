import { TaxDTO, TaxEntity, taxValidationSchema } from "@/entities/tax";
import {
  taxEntityToFormData,
  taxFormDataToDTO,
  TaxFormSchema,
} from "@/entities/tax/model/schemas";
import { ORDER_TYPE_OPTIONS } from "@/shared/const/options";
import { EntityForm } from "@/shared/ui/components/EntityForm";
import { Button } from "@/shared/ui/shadcn/button";
import { Calendar } from "@/shared/ui/shadcn/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/shadcn/form";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { Switch } from "@/shared/ui/shadcn/switch";
import { format } from "date-fns";
import { t } from "i18next";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface TaxFormProps {
  visible: boolean;
  onHide: () => void;
  tax: TaxEntity | null;
  onSave: (tax: TaxDTO) => Promise<void>;
}

const TaxFormFields = () => {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tax.name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("tax.name_placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="short_name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("tax.short_name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("tax.short_name_placeholder")}
                  maxLength={10}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              {fieldState.error?.message === "tax.short_name_help" && (
                <div className="text-xs text-muted-foreground">
                  {t("tax.short_name_help")}
                </div>
              )}
            </FormItem>
          )}
        />

        <FormField
          name="rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tax.rate")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder={t("tax.rate_placeholder")}
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                    className="hide-number-spin pr-8"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="d_begin"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("tax.d_begin")}</FormLabel>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    {field.value ? (
                      format(new Date(field.value), "dd.MM.yyyy")
                    ) : (
                      <span>{t("tax.d_begin_placeholder")}</span>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    // selected={newPriceForm.date}
                    selected={field.value ? new Date(field.value) : undefined}
                    captionLayout="dropdown"
                    onSelect={date => {
                      field.onChange(date);
                      setDatePopoverOpen(false);
                    }}
                    // onSelect={(date) => {
                    //     if (date) {
                    //         setNewPriceForm(prev => ({ ...prev, date }))
                    //     }
                    //     setDatePopoverOpen(false)
                    // }}
                  />
                </PopoverContent>
              </Popover>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="order_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tax.order_type")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("tax.select_order_type")} />
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

      <FormField
        name="is_inclusive"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                {t("tax.is_inclusive")}
              </FormLabel>
              <div className="text-sm text-muted-foreground">
                {t("tax.is_inclusive_help")}
              </div>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};

export function TaxForm({ visible, onHide, tax, onSave }: TaxFormProps) {
  const header = tax?.id ? t("tax.edit_tax") : t("tax.add_tax");

  const initialData = taxEntityToFormData(tax);
  const handleSave = async (formData: TaxFormSchema) => {
    const tax = taxFormDataToDTO(formData);
    await onSave(tax);
  };

  return (
    <EntityForm
      visible={visible}
      onHide={onHide}
      header={header}
      schema={taxValidationSchema}
      initialData={initialData}
      onSave={handleSave}
    >
      <TaxFormFields />
    </EntityForm>
  );
}

/* Add this CSS to your global stylesheet (e.g., src-ui/index.css or main.css):
.hide-number-spin::-webkit-outer-spin-button,
.hide-number-spin::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.hide-number-spin[type='number'] {
  -moz-appearance: textfield;
}
*/
