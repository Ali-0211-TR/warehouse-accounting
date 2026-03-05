import { contractApi } from "@/entities/contract/api/contract-api";
import { useProductStore } from "@/entities/product";
import { ContractProductDTO } from "@/shared/bindings/ContractProductDTO";
import { ContractProductEntity } from "@/shared/bindings/ContractProductEntity";
import useToast from "@/shared/hooks/use-toast";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { t } from "i18next";
import { useEffect, useState } from "react";

interface ContractProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string | null;
  product: ContractProductEntity | null;
  onSaved: () => void;
}

export function ContractProductForm({
  open,
  onOpenChange,
  contractId,
  product,
  onSaved,
}: ContractProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_id: null as string | null,
    article: 0,
    count: 0,
    discount_id: null as string | null,
  });

  const { showErrorToast, showSuccessToast } = useToast();
  const products = useProductStore((s) => s.products);
  const loadProducts = useProductStore((s) => s.loadProducts);

  useEffect(() => {
    if (open) {
      loadProducts();
      if (product) {
        setFormData({
          product_id: product.product?.id || null,
          article: product.article,
          count: product.count,
          discount_id: product.discount?.id || null,
        });
      } else {
        setFormData({
          product_id: null,
          article: 0,
          count: 0,
          discount_id: null,
        });
      }
    }
  }, [open, product, loadProducts]);

  const handleSave = async () => {
    if (!contractId || !formData.product_id) return;

    setLoading(true);
    try {
      const productDto: ContractProductDTO = {
        id: product?.id || null,
        device_id: "",
        contract_id: contractId,
        product_id: formData.product_id,
        article: formData.article,
        count: formData.count,
        discount_id: formData.discount_id,
        created_at: "",
        updated_at: "",
        deleted_at: null,
        version: BigInt(0),
      };

      await contractApi.saveContractProduct(productDto);
      showSuccessToast(
        product?.id ? t("success.data_updated") : t("success.data_created")
      );
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      showErrorToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product?.id) return;

    setLoading(true);
    try {
      await contractApi.deleteContractProduct(product.id);
      showSuccessToast(t("success.data_deleted"));
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      showErrorToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {product?.id
              ? t("contract.edit_product")
              : t("contract.add_product")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="product">{t("contract.product")}</Label>
            <Select
              value={formData.product_id?.toString() || ""}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, product_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("contract.select_product")} />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id!.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="article">{t("contract.article")}</Label>
              <Input
                id="article"
                type="number"
                value={formData.article}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    article: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="count">{t("contract.count")}</Label>
              <Input
                id="count"
                type="number"
                step="0.01"
                value={formData.count}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    count: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="discount">{t("contract.discount")}</Label>
            <Select
              value={formData.discount_id?.toString() || ""}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, discount_id: value || null }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("contract.select_discount")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("contract.no_discount")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {product?.id && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {t("common.delete")}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {t("common.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
