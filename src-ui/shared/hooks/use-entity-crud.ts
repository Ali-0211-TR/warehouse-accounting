// src-ui/shared/hooks/use-entity-crud.ts
import { useState, useEffect, useMemo } from "react";
import useToast from "@/shared/hooks/use-toast";
import { useDeleteConfirm } from "@/shared/hooks/use-delete-confirm";

type EntityCRUDOptions<T, F> = {
  entityName: string;
  getAll: () => Promise<T[]>;
  deleteEntity: (id: number) => Promise<void>;
  filterFunction: (item: T, filters: F) => boolean;
  emptyEntity: T;
};

export function useEntityCRUD<
  T extends { id: number | null },
  F extends Record<string, any>,
>(options: EntityCRUDOptions<T, F>) {
  const { getAll, deleteEntity, filterFunction, emptyEntity } = options;
  const { showErrorToast } = useToast();
  const [entities, setEntities] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<T>(emptyEntity);
  const [formVisible, setFormVisible] = useState(false);
  const [filters, setFilters] = useState<F>({} as F);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<F>({} as F);
  const { deleteConfirmation, ConfirmDialogComponent } = useDeleteConfirm();

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    setLoading(true);
    try {
      const data = await getAll();
      setEntities(data);
    } catch (error: any) {
      showErrorToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addEntity = () => {
    setSelected({ ...emptyEntity });
    setFormVisible(true);
  };

  const editEntity = (entity: T) => {
    setSelected(entity);
    setFormVisible(true);
  };

  const confirmDeleteEntity = (entity: T) => {
    if (entity.id) {
      // Assuming entity has a name property, adjust as needed
      const entityName = (entity as any).name || entity.id.toString();
      deleteConfirmation(entityName, entity.id, deleteEntity);
    }
  };

  const openFilterDialog = () => {
    setTempFilters({ ...filters });
    setFilterDialogOpen(true);
  };

  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setFilterDialogOpen(false);
  };

  const resetFilters = () => {
    setTempFilters({} as F);
  };

  const clearFilters = () => {
    setFilters({} as F);
  };

  const filteredEntities = useMemo(() => {
    return entities.filter((entity) => filterFunction(entity, filters));
  }, [entities, filters]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(
      (value) => value !== undefined && value !== "",
    );
  }, [filters]);

  return {
    entities,
    filteredEntities,
    loading,
    selected,
    formVisible,
    filters,
    tempFilters,
    filterDialogOpen,
    hasActiveFilters,
    ConfirmDialogComponent,
    setFormVisible,
    loadEntities,
    addEntity,
    editEntity,
    confirmDeleteEntity,
    openFilterDialog,
    applyFilters,
    resetFilters,
    clearFilters,
    setTempFilters,
    setFilterDialogOpen,
  };
}
