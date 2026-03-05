import { useFuelingOrderStore } from "@/entities/fueling-order";
import { FuelingOrderColumn } from "@/shared/bindings/FuelingOrderColumn";
import { FuelingOrderFilter } from "@/shared/bindings/FuelingOrderFilter";
import { SortOrder } from "@/shared/bindings/SortOrder";
import { useCallback,  useMemo,  useState } from "react";

import { initFuelOrderFilter } from "@/entities/fueling-order/model/schemas";

export function useFuelingOrder() {
  const [filtersVisible, setFiltersVisible] = useState(false);

  const {
    fuelingOrderitems,
    loading,
    query,
    getFuelingOrderItems,
    pageChange,
    loadAllForExport,
  } = useFuelingOrderStore();

  /**
   * ВАЖНО:
   * При маунте НЕ вызываем getFuelingOrderItems() "как есть",
   * потому что в zustand query может быть старый (sort/page/filters).
   * Вместо этого явно задаём дефолтные параметры.
   */
  // useEffect(() => {
  //   if (isInitialized.current) return;

  //   isInitialized.current = true;

  //   // Жёстко стартуем с чистого состояния, чтобы ничего не "липло"
  //   getFuelingOrderItems({
  //     filters: initFuelOrderFilter,
  //     // если у твоего backend/DTO есть default сортировка — можешь оставить undefined,
  //     // но чтобы не тянулся старый sort из store — лучше явно "сбросить":
  //     sortField: undefined as any,
  //     sortOrder: undefined as any,
  //     page: 1 as any,
  //     first: 0 as any, // если у тебя есть first/offset
  //   }).catch(console.error);
  // }, [getFuelingOrderItems]);

  const setFilters = useCallback(
    async (filters: Partial<FuelingOrderFilter>) => {
      const oldFilter = query.filters || {};
      const newFilter = { ...oldFilter, ...filters };

      try {
        // При изменении фильтра всегда логично возвращаться на 1 страницу
        await getFuelingOrderItems({
          filters: newFilter,
          page: 1 as any,
          first: 0 as any,
        });
      } catch (error: any) {
        console.error("Error setting filters:", error);
      }
    },
    [getFuelingOrderItems, query.filters]
  );

  const clearFilter = useCallback(async () => {
    // Сбрасываем не только фильтр, но и сортировку + страницу
    await getFuelingOrderItems({
      filters: initFuelOrderFilter,
      sortField: undefined as any,
      sortOrder: undefined as any,
      page: 1 as any,
      first: 0 as any,
    });
  }, [getFuelingOrderItems]);

  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
  }, []);

  const hasActiveFilters = useMemo(() => {
    const f = query.filters;
    if (!f) return false;

    // Если initFuelOrderFilter содержит дефолты, которые не считаются "активными",
    // лучше сравнивать с initFuelOrderFilter.
    return Object.entries(f).some(([k, v]) => {
      const def = (initFuelOrderFilter as any)[k];

      const isEmpty =
        v === undefined ||
        v === null ||
        v === "" ||
        (Array.isArray(v) ? (v as unknown[]).length === 0 : false);

      if (isEmpty) return false;

      // если значение равно дефолту — не считаем активным
      if (Array.isArray(v) && Array.isArray(def)) {
        return !(v.length === def.length && v.every((x, i) => x === def[i]));
      }

      return v !== def;
    });
  }, [query.filters]);

  // Map frontend sort field names to backend FuelingOrderColumn enum values
  const mapSortFieldToBackend = (field: string): FuelingOrderColumn => {
    const fieldMapping: Record<string, FuelingOrderColumn> = {
      id: "Id",
      d_created: "DCreated",
      d_move: "DMove",
      nozzle_id: "NozzleId",
      order_item_id: "OrderItemId",
      fueling_type: "FuelingType",
      preset_type: "PresetType",
      title: "Title",
    };
    return fieldMapping[field] || "DCreated";
  };

  const onSort = useCallback(
    (field: string, order: 1 | -1) => {
      const sortOrder: SortOrder = order === 1 ? "Asc" : "Desc";
      const backendField = mapSortFieldToBackend(field);

      // Сортировка должна сохранять текущие фильтры, но не "липнуть" между входами.
      // Поэтому "липкость" мы убрали в init/clearFilter, а тут просто сортируем.
      getFuelingOrderItems({
        sortField: backendField,
        sortOrder,
        page: 1 as any,
        first: 0 as any,
      });
    },
    [getFuelingOrderItems]
  );

  return {
    fuelingOrderitems,
    loading,
    filtersVisible,
    clearFilter,
    hasActiveFilters,
    query,
    onShowFilters,
    onHideFilters,
    setFilters,
    pageChange,
    onSort,
    reload: getFuelingOrderItems,
    loadAllForExport,
  };
}
