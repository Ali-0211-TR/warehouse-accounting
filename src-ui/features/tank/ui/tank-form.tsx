import { useSerialPortStore } from "@/entities/serial-ports";
import { TankEntity, tankValidationSchema } from "@/entities/tank";
import {
  tankEntityToFormData,
  tankFormDataToDTO,
  TankFormSchema,
} from "@/entities/tank/model/schemas";
import { useProduct } from "@/features/product";
import { TankDTO } from "@/shared/bindings/TankDTO";
import { TANK_PROTOCOL_OPTIONS } from "@/shared/const/options";
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
import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";

interface TankFormProps {
  visible: boolean;
  onHide: () => void;
  tank: TankEntity | null;
  onSave: (tank: TankDTO) => Promise<void>;
}

const TankFormFields = () => {
  const { products } = useProduct();
  const { ports, getPorts } = useSerialPortStore();
  const form = useFormContext<TankFormSchema>();

  useEffect(() => {
    getPorts();
  }, [getPorts]);

  const fuelingProducts = useMemo(() => {
    return products.filter(
      product =>
        product.product_type === "Product" ||
        product.product_type === "Service"
    );
  }, [products]);

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto md:overflow-visible px-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <FormField
          name="product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tank.product")}</FormLabel>
              <Select
                onValueChange={e => {
                  field.onChange(e);
                  const nameField = form.getValues("name");
                  if (!nameField || nameField.trim() === "") {
                    const selectedProduct = fuelingProducts.find(
                      p => p.id === e
                    );
                    if (selectedProduct?.short_name) {
                      form.setValue("name", selectedProduct.short_name);
                    }
                  }
                }}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder={t("tank.select_product")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fuelingProducts
                    .filter(option => option.id !== null)
                    .map(option => (
                      <SelectItem key={option.id} value={option.id!}>
                        {option.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tank.name")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("tank.name_placeholder")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="protocol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tank.protocol")}</FormLabel>
              <Select
                onValueChange={value =>
                  field.onChange(value === "null" ? null : value)
                }
                value={field.value || "null"}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("tank.select_protocol")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">{t("common.none")}</SelectItem>
                  {TANK_PROTOCOL_OPTIONS.map(option => (
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tank.address")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  value={field.value || ""}
                  onChange={e =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="server_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tank.server_address")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  placeholder="192.168.1.100"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="server_port"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tank.server_port")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="65535"
                  {...field}
                  value={field.value || ""}
                  onChange={e =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="port_name"
          render={({ field }) => (
            <FormItem className="w-full min-w-0">
              <FormLabel>{t("tank.port_name")}</FormLabel>
              <Select
                onValueChange={value =>
                  field.onChange(value === "null" ? null : value)
                }
                value={field.value || "null"}
              >
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder={t("tank.select_port")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">{t("common.none")}</SelectItem>
                  {ports.map(option => (
                    <SelectItem
                      key={option.toString()}
                      value={option.toString()}
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="port_speed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tank.port_speed")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  value={field.value || ""}
                  onChange={e =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tank.balance")}</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="volume_max"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tank.max_volume")}</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export function TankForm({ visible, onHide, tank, onSave }: TankFormProps) {
  const header = tank?.id ? t("tank.edit_tank") : t("tank.add_tank");
  const initialData = tankEntityToFormData(tank);
  const handleSave = async (formData: TankFormSchema) => {
    const tank = tankFormDataToDTO(formData);
    await onSave(tank);
  };

  return (
    <EntityForm
      visible={visible}
      onHide={onHide}
      header={header}
      schema={tankValidationSchema}
      initialData={initialData}
      onSave={handleSave}
    >
      <TankFormFields />
    </EntityForm>
  );
}
