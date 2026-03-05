// src-ui/shared/components/FilterDialog.tsx
import React from "react"; // Add this import
import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/shadcn/dialog";
import { t } from "i18next";
import { useState, useEffect } from "react";

type FilterField = {
  key: string;
  label: string;
  component: React.ReactNode;
};

type FilterDialogProps = {
  open: boolean;
  onClose: () => void;
  onApply: (filters: Record<string, any>) => void;
  initialFilters: Record<string, any>;
  fields: FilterField[];
};

export function FilterDialog({
  open,
  onClose,
  onApply,
  initialFilters,
  fields,
}: FilterDialogProps) {
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters, open]);

  const resetFilters = () => {
    const emptyFilters = Object.keys(filters).reduce(
      (acc, key) => {
        // Use undefined instead of empty string to match your filter logic
        acc[key] = undefined;
        return acc;
      },
      {} as Record<string, any>,
    );
    setFilters(emptyFilters);
    // onApply(emptyFilters); // Apply the empty filters to the parent component
    // onClose(); // Close the dialog after resetting filters
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs w-full p-4">
        <DialogHeader>
          <DialogTitle>{t("control.filters")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <label>{field.label}</label>
              {React.cloneElement(field.component as React.ReactElement, {
                value: filters[field.key] || "", // Keep this as empty string for display
                onChange:
                  typeof (field.component as React.ReactElement).props
                    .onChange === "function"
                    ? (e: any) => {
                        const value =
                          e.target?.value !== undefined ? e.target.value : e;
                        // Convert empty strings to undefined for consistency
                        setFilters({
                          ...filters,
                          [field.key]: value === "" ? undefined : value,
                        });
                      }
                    : (val: any) =>
                        setFilters({
                          ...filters,
                          [field.key]: val === "" ? undefined : val,
                        }),
              })}
            </div>
          ))}
        </div>
        <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            {t("control.clear_filters")}
          </Button>
          <Button variant="default" size="sm" onClick={handleApply}>
            {t("control.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
