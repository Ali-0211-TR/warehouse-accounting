import { contractApi } from "@/entities/contract/api/contract-api";
import { ContractCarDTO } from "@/shared/bindings/ContractCarDTO";
import { ContractCarEntity } from "@/shared/bindings/ContractCarEntity";
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
import { Textarea } from "@/shared/ui/shadcn/textarea";
import { t } from "i18next";
import { useEffect, useState } from "react";

interface ContractCarFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string | null;
  car: ContractCarEntity | null;
  onSaved: () => void;
}

export function ContractCarForm({
  open,
  onOpenChange,
  contractId,
  car,
  onSaved,
}: ContractCarFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    comment: "",
  });

  const { showErrorToast, showSuccessToast } = useToast();

  useEffect(() => {
    if (open) {
      if (car) {
        setFormData({
          name: car.name || "",
          comment: car.comment || "",
        });
      } else {
        setFormData({
          name: "",
          comment: "",
        });
      }
    }
  }, [open, car]);

  const handleSave = async () => {
    if (!contractId) return;

    setLoading(true);
    try {
      const carDto: ContractCarDTO = {
        id: car?.id || null,
        device_id: "",
        contract_id: contractId,
        name: formData.name,
        comment: formData.comment,
        created_at: "",
        updated_at: "",
        deleted_at: null,
        version: BigInt(0),
      };

      await contractApi.saveContractCar(carDto);
      showSuccessToast(
        car?.id ? t("success.data_updated") : t("success.data_created")
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
    if (!car?.id) return;

    setLoading(true);
    try {
      await contractApi.deleteContractCar(car.id);
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
            {car?.id ? t("contract.edit_car") : t("contract.add_car")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t("contract.car_name")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder={t("contract.car_name_placeholder")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="comment">{t("contract.comment")}</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={e =>
                setFormData(prev => ({ ...prev, comment: e.target.value }))
              }
              placeholder={t("contract.comment_placeholder")}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {car?.id && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {t("control.delete")}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t("control.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !formData.name.trim()}
            >
              {loading ? t("common.saving") : t("control.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
