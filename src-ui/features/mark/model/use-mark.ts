import type { MarkDTO, MarkEntity } from "@/entities/mark";
import { emptyMark, useMarkStore } from "@/entities/mark";
import { useToast } from "@/shared/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMarkFilters } from "./use-mark-filters";

export function useMark() {
  const [selectedMark, setSelectedMark] = useState<MarkDTO | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { t } = useTranslation();

  const { marks, loading, loadMarks, saveMark, deleteMark } = useMarkStore();

  const { filters, filteredMarks, hasActiveFilters, setFilters, clearFilters } =
    useMarkFilters(marks);

  const { showErrorToast, showSuccessToast } = useToast();

  useEffect(() => {
    loadMarks().catch(showErrorToast);
  }, [loadMarks, showErrorToast]);

  const onAdd = useCallback(() => {
    setSelectedMark(emptyMark);
    setFormVisible(true);
  }, []);

  const onEdit = useCallback((mark: MarkEntity) => {
    // Convert entity to DTO for editing
    const markDto: MarkDTO = {
      id: mark.id,
      name: mark.name,
    };
    setSelectedMark(markDto);
    setFormVisible(true);
  }, []);

  const onDelete = useCallback(
    async (mark: MarkEntity) => {
      if (!mark.id) return;

      try {
        await deleteMark(mark.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteMark, showErrorToast, showSuccessToast, t]
  );

  const onSave = useCallback(
    async (markDto: MarkDTO) => {
      try {
        await saveMark(markDto);

        showSuccessToast(
          markDto.id ? t("success.data_updated") : t("success.data_created")
        );
        setFormVisible(false);
        setSelectedMark(null);
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [saveMark, showErrorToast, showSuccessToast, t]
  );

  const onCancel = useCallback(() => {
    setFormVisible(false);
    setSelectedMark(null);
  }, []);

  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
    setFormVisible(false);
    setSelectedMark(null);
  }, []);

  const handleSetFilters = useCallback(
    (newFilters: any) => {
      setFilters(newFilters);
      setFormVisible(false);
      setSelectedMark(null);
    },
    [setFilters]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setFormVisible(false);
    setSelectedMark(null);
  }, [clearFilters]);

  return {
    marks: filteredMarks,
    allMarks: marks,
    selectedMark,
    loading,
    formVisible,
    filtersVisible,
    filters,
    hasActiveFilters,
    onAdd,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    onShowFilters,
    onHideFilters,
    setFilters: handleSetFilters,
    clearFilters: handleClearFilters,
    reload: loadMarks,
  };
}
