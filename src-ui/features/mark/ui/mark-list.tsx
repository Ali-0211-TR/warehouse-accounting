import type { MarkEntity } from "@/entities/mark";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { EntityTable } from "@/shared/ui/components/EntityTable";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface MarkListProps {
  marks: MarkEntity[];
  loading: boolean;
  onEdit: (mark: MarkEntity) => void;
  onDelete: (mark: MarkEntity) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: MarkEntity[]) => void;
}

export function MarkList({
  marks,
  loading,
  onEdit,
  onDelete,
  selectable = false,
  onSelectionChange,
}: MarkListProps) {
  const { t } = useTranslation();
  const [deleteMark, setDeleteMark] = useState<MarkEntity | null>(null);

  const handleDeleteClick = (mark: MarkEntity) => {
    setDeleteMark(mark);
  };

  const handleDeleteConfirm = () => {
    if (deleteMark) {
      onDelete(deleteMark);
      setDeleteMark(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteMark(null);
  };

  // const getMarkIcon = (name: string) => {
  //     const lowerName = name.toLowerCase()

  //     if (lowerName.includes('премиум') || lowerName.includes('premium')) {
  //         return <Award className="h-4 w-4 text-yellow-500" />
  //     }
  //     if (lowerName.includes('эко') || lowerName.includes('eco')) {
  //         return <div className="text-green-500">🌱</div>
  //     }
  //     if (lowerName.includes('стандарт') || lowerName.includes('standard')) {
  //         return <Tag className="h-4 w-4 text-blue-500" />
  //     }
  //     if (lowerName.includes('vip') || lowerName.includes('люкс')) {
  //         return <Star className="h-4 w-4 text-purple-500" />
  //     }

  //     return <Hash className="h-4 w-4 text-gray-500" />
  // }

  // const getMarkColor = (name: string) => {
  //     const lowerName = name.toLowerCase()

  //     if (lowerName.includes('премиум') || lowerName.includes('premium')) {
  //         return 'yellow'
  //     }
  //     if (lowerName.includes('эко') || lowerName.includes('eco')) {
  //         return 'green'
  //     }
  //     if (lowerName.includes('стандарт') || lowerName.includes('standard')) {
  //         return 'blue'
  //     }
  //     if (lowerName.includes('vip') || lowerName.includes('люкс')) {
  //         return 'purple'
  //     }

  //     return 'gray'
  // }

  const columns = [
    // Hidden ID column (UUID not user-friendly)
    // {
    //   key: "id",
    //   header: t("mark.id"),
    //   accessor: (mark: MarkEntity) => mark.id,
    //   width: "w-16",
    //   align: "center" as const,
    // },
    {
      key: "name",
      header: t("mark.name"),
      accessor: (mark: MarkEntity) => mark.name,
      render: (mark: MarkEntity) => (
        <div className="flex items-center space-x-3">
          {/* {getMarkIcon(mark.name)} */}
          <div className="space-y-1">
            <div className="font-medium">{mark.name}</div>
            {/* <div className="text-sm text-muted-foreground">
                            {t('mark.brand_label')}
                        </div> */}
          </div>
        </div>
      ),
    },
    // {
    //     key: 'category',
    //     header: t('mark.cat'),
    //     accessor: (mark: MarkEntity) => {
    //         const lowerName = mark.name.toLowerCase()
    //         if (lowerName.includes('премиум') || lowerName.includes('premium')) return 'premium'
    //         if (lowerName.includes('эко') || lowerName.includes('eco')) return 'eco'
    //         if (lowerName.includes('стандарт') || lowerName.includes('standard')) return 'standard'
    //         if (lowerName.includes('vip') || lowerName.includes('люкс')) return 'vip'
    //         return 'other'
    //     },
    //     width: 'w-32',
    //     render: (mark: MarkEntity) => {
    //         const category = (() => {
    //             const lowerName = mark.name.toLowerCase()
    //             if (lowerName.includes('премиум') || lowerName.includes('premium')) return 'premium'
    //             if (lowerName.includes('эко') || lowerName.includes('eco')) return 'eco'
    //             if (lowerName.includes('стандарт') || lowerName.includes('standard')) return 'standard'
    //             if (lowerName.includes('vip') || lowerName.includes('люкс')) return 'vip'
    //             return 'other'
    //         })()

    //         const color = getMarkColor(mark.name)

    //         return (
    //             <Badge
    //                 variant="secondary"
    //                 className={`text-xs bg-${color}-50 text-${color}-700 border-${color}-200`}
    //             >
    //                 {t(`mark.category.${category}`)}
    //             </Badge>
    //         )
    //     }
    // },
    // {
    //     key: 'usage',
    //     header: t('mark.usage'),
    //     accessor: () => '—',
    //     width: 'w-24',
    //     align: 'center' as const,
    //     render: () => (
    //         <Badge variant="outline" className="text-xs">
    //             {/* This would show actual usage count from products */}
    //             —
    //         </Badge>
    //     )
    // },
    // {
    //     key: 'status',
    //     header: t('mark.stat'),
    //     accessor: () => 'active',
    //     width: 'w-24',
    //     align: 'center' as const,
    //     render: () => (
    //         <Badge variant="default" className="text-xs">
    //             <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
    //             {t('mark.status.active')}
    //         </Badge>
    //     )
    // }
  ];

  return (
    <>
      <div className="hidden sm:block">
        <EntityTable
          data={marks}
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
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t("message.loading") ?? "Loading..."}
          </div>
        ) : marks.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t("message.no_data")}
          </div>
        ) : (
          <div className="p-2">
            {marks.map((mark) => (
              <div
                key={mark.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 bg-white dark:bg-gray-800 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-lg text-gray-900 dark:text-gray-100">
                      {mark.name}
                    </div>
                    {/* optional subtitle */}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => onEdit(mark)}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      {t("control.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(mark)}
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                    >
                      {t("control.delete")}
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
        open={!!deleteMark}
        title={t("message.confirm_delete")}
        description={
          <>
            {t("message.delete_mark_warning", { name: deleteMark?.name })}
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
