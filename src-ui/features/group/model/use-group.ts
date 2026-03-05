import type { GroupEntity } from "@/entities/group";
import { emptyGroupEntity, useGroupStore } from "@/entities/group";
import { GroupDTO } from "@/shared/bindings/GroupDTO";
import { useToast } from "@/shared/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGroupFilters } from "./use-group-filters";

export function useGroup() {
  const [selectedGroup, setSelectedGroup] = useState<GroupEntity | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { t } = useTranslation();

  const { groups, loading, loadGroups, saveGroup, deleteGroup } =
    useGroupStore();

  const {
    filters,
    filteredGroups,
    hasActiveFilters,
    setFilters,
    clearFilters,
  } = useGroupFilters(groups);

  const { showErrorToast, showSuccessToast } = useToast();

  useEffect(() => {
    loadGroups().catch(showErrorToast);
  }, [loadGroups, showErrorToast]);

  const onAdd = useCallback(() => {
    setSelectedGroup(emptyGroupEntity);
    setFormVisible(true);
  }, []);

  const onEdit = useCallback((group: GroupEntity) => {
    setSelectedGroup(group);
    setFormVisible(true);
  }, []);

  const onDelete = useCallback(
    async (group: GroupEntity) => {
      if (!group.id) return;

      try {
        await deleteGroup(group.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteGroup, showErrorToast, showSuccessToast, t]
  );

  const onSave = useCallback(
    async (group: GroupDTO) => {
      try {
        const groupDto: GroupDTO = {
          id: group.id,
          group_type: group.group_type,
          mark_id: group.mark_id || null,
          name: group.name,
          parent_id: group.parent_id,
          discount_ids: group.discount_ids,
        };
        await saveGroup(groupDto);

        showSuccessToast(
          group.id ? t("success.data_updated") : t("success.data_created")
        );
        setFormVisible(false);
        setSelectedGroup(null);
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [saveGroup, showErrorToast, showSuccessToast, t]
  );

  const onCancel = useCallback(() => {
    setFormVisible(false);
    setSelectedGroup(null);
  }, []);

  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
    setFormVisible(false);
    setSelectedGroup(null);
  }, []);

  const handleSetFilters = useCallback(
    (newFilters: any) => {
      setFilters(newFilters);
      setFormVisible(false);
      setSelectedGroup(null);
    },
    [setFilters]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setFormVisible(false);
    setSelectedGroup(null);
  }, [clearFilters]);

  return {
    groups: filteredGroups,
    allGroups: groups,
    selectedGroup,
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
    reload: loadGroups,
  };
}
