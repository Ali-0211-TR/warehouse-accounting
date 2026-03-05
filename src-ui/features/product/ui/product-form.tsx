import { useDiscountStore } from "@/entities/discount";
import { useGroupStore } from "@/entities/group";
import { ProductEntity, type ProductFormSchema } from "@/entities/product";
import {
  createProductValidationSchema,
  productEntityToFormData,
  productFormDataToDTO,
} from "@/entities/product/model/schemas";
import { useProductStore } from "@/entities/product/model/store";
import { ProductDTO } from "@/entities/product/model/types";
import { useTaxStore } from "@/entities/tax";
import { useUnitStore } from "@/entities/unit";
import { getProductTypeOptions } from "@/shared/const/lists";
import { CheckBox } from "@/shared/ui/components/CheckBox";
import { EntityForm } from "@/shared/ui/components/EntityForm";
import { ImagesPicker } from "@/shared/ui/components/ImagesPicker";
import { Button } from "@/shared/ui/shadcn/button";
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
import { generateProductBarcode } from "@/shared/utils/barcode-generator";
import { t } from "i18next";
import { Wand2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";

interface ProductFormProps {
  visible: boolean;
  onHide: () => void;
  product: ProductEntity | null;
  onSave: (product: ProductDTO) => Promise<void>;
}

const ProductFormFields = () => {
  const { units, loadUnits } = useUnitStore();
  const { groups, loadGroups } = useGroupStore();
  const { discounts, loadDiscounts } = useDiscountStore();
  const { taxes, loadTaxes } = useTaxStore();
  const products = useProductStore((s) => s.products);

  const { watch, setValue } = useFormContext<ProductFormSchema>();
  const watchedDiscountIds = watch("discount_ids") || [];
  const watchedTaxIds = watch("tax_ids") || [];
  // const watchedArticle = watch("article") || "";
  // const watchedId = watch("id");
  // const watchedName = watch("name") || "";
  // const watchedShortName = watch("short_name") || "";
  const watchedProductType = watch("product_type") || "Product";
  const watchedBarCode = watch("bar_code") || "";

  const productTypeOptions = getProductTypeOptions();

  // Handler to generate internal barcode
  const handleGenerateBarcode = () => {
    // Use products length + 1 as sequence for new products
    const sequence = products.length + 1;
    const newBarcode = generateProductBarcode(sequence, watchedProductType);
    setValue("bar_code", newBarcode, { shouldValidate: true });
  };

  useEffect(() => {
    loadUnits();
    loadGroups();
    loadDiscounts();
    loadTaxes();
  }, [loadUnits, loadGroups, loadDiscounts, loadTaxes]);

  // Auto-generate article from number of products + 1 for new products
  // useEffect(() => {
  //   // Only auto-generate for new products (no ID) and if article is empty
  //   if (!watchedId && !watchedArticle && products.length > 0) {
  //     const nextArticle = (products.length + 1).toString();
  //     setValue("article", nextArticle, { shouldValidate: false });
  //   }
  // }, [watchedId, watchedArticle, products, setValue]);

  // Auto-copy name to short_name when name changes (only if short_name is empty or was previously auto-filled)
  // useEffect(() => {
  //   if (watchedName && !watchedShortName) {
  //     setValue("short_name", watchedName, { shouldValidate: false });
  //   }
  // }, [watchedName, watchedShortName, setValue]);

  const handleDiscountChange = (selectedIds: (number | string)[]) => {
    setValue("discount_ids", selectedIds as string[], { shouldValidate: true });
  };

  const handleTaxChange = (selectedIds: (number | string)[]) => {
    setValue("tax_ids", selectedIds as string[], { shouldValidate: true });
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto md:overflow-visible px-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("product.name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("product.name_placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="short_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("product.short_name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("product.short_name_placeholder")}
                  {...field}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  inputMode="text"
                  // иногда помогает против “магии” chrome:
                  name="short_name__no_autofill"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField
          name="product_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("product.product_type")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("product.select_product_type")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {productTypeOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="unit_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("product.unit")}</FormLabel>
              <Select
                onValueChange={value =>
                  field.onChange(value === "none" ? "" : value)
                }
                value={
                  !field.value ? "none" : field.value.toString()
                }
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("product.select_unit")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {units.map(unit => (
                    <SelectItem key={unit.id} value={unit.id!.toString()}>
                      {unit.name} ({unit.short_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="md:col-span-2">
          <FormField
            name="group_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("product.group")}</FormLabel>
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
                      <SelectValue placeholder={t("product.select_group")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">{t("common.none")}</SelectItem>
                    {groups.map(group => (
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
        </div>

        <FormField
          name="article"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("product.article")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("product.article_placeholder")}
                  {...field}
                  autoFocus={false}
                  minLength={0}
                  // анти-autofill
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  autoSave="off"
                  aria-autocomplete="none"
                  spellCheck={false}

                  // важное: уникальный name (не short_name)
                  name="article__no_autofill"

                  // иногда помогает, чтобы браузер “не думал” что это логин/телефон:
                  inputMode="decimal"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="bar_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("product.bar_code")}</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("product.bar_code_placeholder")}
                    {...field}
                    className="flex-1"
                    onKeyDown={(e) => {
                      // Prevent Enter key from submitting the form when scanning barcode
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGenerateBarcode}
                    title={t("product.generate_barcode", "Generate Barcode")}
                    disabled={!!watchedBarCode}
                  >
                    <Wand2 className="h-4 w-4" />
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        name="image_paths"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>{t("product.photos", "Фотографии")}</FormLabel>
            <FormControl>
              <ImagesPicker
                value={(field.value as string[]) ?? []}
                onChange={(paths) => field.onChange(paths)}
                maxFiles={10}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Discounts Section */}
      <div className="space-y-3">
        <FormLabel>{t("product.discounts")}</FormLabel>
        <CheckBox
          items={discounts
            .filter(discount => discount.id !== null)
            .map(discount => ({
              id: discount.id as string,
              name: `${discount.name} (${discount.order_type})`,
            }))}
          selectedIds={watchedDiscountIds}
          onSelectionChange={handleDiscountChange}
        />
      </div>

      {/* Taxes Section */}
      <div className="space-y-3">
        <FormLabel>{t("product.taxes")}</FormLabel>
        <CheckBox
          items={taxes
            .filter(tax => tax.id !== null)
            .map(tax => ({
              id: tax.id as string,
              name: `${tax.name} (${tax.order_type}, ${tax.rate}%)`,
            }))}
          selectedIds={watchedTaxIds}
          onSelectionChange={handleTaxChange}
        />
      </div>
    </div>
  );
};

export function ProductForm({
  visible,
  onHide,
  product,
  onSave,
}: ProductFormProps) {
  const header = product?.id
    ? t("product.edit_product")
    : t("product.add_product");

  // Convert entity to form data for initial values - memoize to prevent recalculation
  const initialData = useMemo(
    () => productEntityToFormData(product),
    [product?.id] // Only recalculate when product ID changes (switching between add/edit)
  );

  // Create schema with translations
  const validationSchema = createProductValidationSchema(t);

  // Use store saveProduct directly
  const handleSave = async (formData: ProductFormSchema) => {
    const product = productFormDataToDTO(formData);
    await onSave(product);
  };

  return (
    <EntityForm
      visible={visible}
      onHide={onHide}
      header={header}
      schema={validationSchema}
      initialData={initialData ? { ...initialData, unit_id: initialData.unit_id ?? "", image_paths: initialData.image_paths ?? [] } : undefined}
      onSave={handleSave}
    >
      <ProductFormFields />
    </EntityForm>
  );
}
