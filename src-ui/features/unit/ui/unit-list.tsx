import type { UnitEntity } from "@/entities/unit";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { EntityTable } from "@/shared/ui/components/EntityTable";
import { Badge } from "@/shared/ui/shadcn/badge";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface UnitListProps {
  units: UnitEntity[];
  loading: boolean;
  onEdit: (unit: UnitEntity) => void;
  onDelete: (unit: UnitEntity) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: UnitEntity[]) => void;
}

export function UnitList({
  units,
  loading,
  onEdit,
  onDelete,
  selectable = false,
  onSelectionChange,
}: UnitListProps) {
  const { t } = useTranslation();
  const [deleteUnit, setDeleteUnit] = useState<UnitEntity | null>(null);

  const handleDeleteClick = (unit: UnitEntity) => {
    setDeleteUnit(unit);
  };

  const handleDeleteConfirm = () => {
    if (deleteUnit) {
      onDelete(deleteUnit);
      setDeleteUnit(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteUnit(null);
  };

  // const getUnitIcon = (shortName: string) => {
  //     // Common unit types
  //     const volumeUnits = ['л', 'мл', 'L', 'ml', 'gal', 'qt']
  //     const weightUnits = ['кг', 'г', 'kg', 'g', 'lb', 'oz']
  //     const lengthUnits = ['м', 'см', 'мм', 'm', 'cm', 'mm', 'ft', 'in']

  //     if (volumeUnits.some(unit => shortName.toLowerCase().includes(unit.toLowerCase()))) {
  //         return <div className="text-blue-500">⚱️</div>
  //     }
  //     if (weightUnits.some(unit => shortName.toLowerCase().includes(unit.toLowerCase()))) {
  //         return <div className="text-green-500">⚖️</div>
  //     }
  //     if (lengthUnits.some(unit => shortName.toLowerCase().includes(unit.toLowerCase()))) {
  //         return <Ruler className="h-4 w-4 text-orange-500" />
  //     }

  //     return <Hash className="h-4 w-4 text-gray-500" />
  // }

  // const getUnitCategory = (shortName: string) => {
  //     const volumeUnits = ['л', 'мл', 'L', 'ml', 'gal', 'qt']
  //     const weightUnits = ['кг', 'г', 'kg', 'g', 'lb', 'oz']
  //     const lengthUnits = ['м', 'см', 'мм', 'm', 'cm', 'mm', 'ft', 'in']

  //     if (volumeUnits.some(unit => shortName.toLowerCase().includes(unit.toLowerCase()))) {
  //         return { category: 'volume', color: 'blue' }
  //     }
  //     if (weightUnits.some(unit => shortName.toLowerCase().includes(unit.toLowerCase()))) {
  //         return { category: 'weight', color: 'green' }
  //     }
  //     if (lengthUnits.some(unit => shortName.toLowerCase().includes(unit.toLowerCase()))) {
  //         return { category: 'length', color: 'orange' }
  //     }

  //     return { category: 'other', color: 'gray' }
  // }

  const columns = [
    // Hidden ID column (UUID not user-friendly)
    // {
    //     key: 'id',
    //     header: t('unit.id'),
    //     accessor: (unit: UnitEntity) => unit.id,
    //     width: 'w-16',
    //     align: 'center' as const
    // },
    {
      key: "name",
      header: t("unit.name"),
      accessor: (unit: UnitEntity) => unit.name,
      render: (unit: UnitEntity) => (
        <div className="flex items-center space-x-3">
          {/* {getUnitIcon(unit.short_name)} */}
          <div className="space-y-1">
            <div className="font-medium">{unit.name}</div>
          </div>
        </div>
      ),
    },
    {
      key: "short_name",
      header: t("unit.short_name"),
      accessor: (unit: UnitEntity) => unit.short_name,
      width: "w-32",
      align: "center" as const,
      render: (unit: UnitEntity) => {
        // const { color } = getUnitCategory(unit.short_name)
        return (
          <Badge variant="outline" className={"text-lg font-mono"}>
            {unit.short_name}
          </Badge>
        );
      },
    },
    // {
    //     key: 'category',
    //     header: t('unit.cat'),
    //     accessor: (unit: UnitEntity) => getUnitCategory(unit.short_name).category,
    //     width: 'w-32',
    //     render: (unit: UnitEntity) => {
    //         const { category, color } = getUnitCategory(unit.short_name)
    //         return (
    //             <Badge variant="secondary" className="text-xs">
    //                 {t(`unit.category.${category}`)}
    //             </Badge>
    //         )
    //     }
    // },
    // {
    //     key: 'usage',
    //     header: t('unit.usage'),
    //     accessor: () => '—',
    //     width: 'w-24',
    //     align: 'center' as const,
    //     render: () => (
    //         <Badge variant="outline" className="text-xs">
    //             {/* This would show actual usage count */}
    //             —
    //         </Badge>
    //     )
    // }
  ];

  return (
    <>
      <div className="hidden sm:block">
        <EntityTable
          data={units}
          columns={columns}
          loading={loading}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          emptyMessage={"message.no_data"}
          selectable={selectable}
          onSelectionChange={onSelectionChange}
          pageSize={25}
        />
      </div>

      {/* Mobile: card list */}
      <div className="block sm:hidden">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">{t('message.loading') ?? 'Loading...'}</div>
        ) : units.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">{t('message.no_data')}</div>
        ) : (
          <div className="p-2">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 bg-white dark:bg-gray-800 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-lg text-gray-900 dark:text-gray-100">{unit.name}</div>
                    <Badge
                      variant="outline"
                      className="text-lg font-mono mt-2 inline-block dark:border-gray-600 dark:text-gray-100"
                    >
                      {unit.short_name}
                    </Badge>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => onEdit(unit)}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      {t('control.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(unit)}
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                    >
                      {t('control.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteUnit}
        title={t("message.confirm_delete")}
        description={
          <>
            {t("message.delete_unit_warning", { name: deleteUnit?.name })}
            <br />
            <span className="text-red-600 font-medium">
              {t("message.action_irreversible")}
            </span>
          </>
        }
        confirmLabel={t("control.delete")}
        cancelLabel={t("control.cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmClassName="bg-red-600 hover:bg-red-700"
      />
    </>
  );
}
