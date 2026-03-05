import type { DispenserEntity, NozzleEntity } from "@/entities/dispenser";
import { useTankStore } from "@/entities/tank";
import type { NozzleDTO } from "@/shared/bindings/NozzleDTO";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { t } from "i18next";
import { useEffect, useState } from "react";
import { NozzleForm } from "./nozzle-form";
import { NozzleList } from "./nozzle-list";

interface NozzleManagementDialogProps {
  open: boolean;
  onClose: () => void;
  dispenser: DispenserEntity | null;
  onAddNozzle: (dispenserId: string) => void;
  onEditNozzle: (nozzle: NozzleEntity) => void;
  onDeleteNozzle: (nozzle: NozzleEntity) => void;
  onSaveNozzle: (nozzle: NozzleDTO) => Promise<void>;
  onCancelNozzle: () => void;
  selectedNozzle: NozzleEntity | null;
  nozzleFormVisible: boolean;
  getDispenserNozzles: (dispenserId: string) => NozzleEntity[];
  loading: boolean;
}

export function NozzleManagementDialog({
  open,
  onClose,
  dispenser,
  onAddNozzle,
  onEditNozzle,
  onDeleteNozzle,
  onSaveNozzle,
  onCancelNozzle,
  selectedNozzle,
  nozzleFormVisible,
  getDispenserNozzles,
  loading,
}: NozzleManagementDialogProps) {
  const [nozzles, setNozzles] = useState<NozzleEntity[]>([]);
  const { loadTanks } = useTankStore();

  // Load tanks when dialog opens to ensure they're available for the form
  useEffect(() => {
    if (open) {
      loadTanks().catch(console.error);
    }
  }, [open, loadTanks]);

  useEffect(() => {
    if (dispenser?.id) {
      const dispenserNozzles = getDispenserNozzles(dispenser.id);
      setNozzles(dispenserNozzles);
    }
  }, [dispenser, getDispenserNozzles]);

  const handleAddNozzle = () => {
    if (dispenser?.id) {
      onAddNozzle(dispenser.id);
    }
  };

  return (
    <>
      <Dialog
        open={open && !nozzleFormVisible}
        onOpenChange={open => !open && onClose()}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {t("nozzle.manage_nozzles_for", { name: dispenser?.name })}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <NozzleList
              nozzles={nozzles}
              loading={loading}
              onEdit={onEditNozzle}
              onDelete={onDeleteNozzle}
              onAdd={handleAddNozzle}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Nozzle Form */}
      {nozzleFormVisible && (
        <NozzleForm
          visible={nozzleFormVisible}
          onHide={onCancelNozzle}
          nozzle={selectedNozzle}
          dispenserId={dispenser?.id || null}
          onSave={onSaveNozzle}
        />
      )}
    </>
  );
}
