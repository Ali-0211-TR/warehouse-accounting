import type { GroupEntity } from "@/entities/group";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { EntityTable } from "@/shared/ui/components/EntityTable";
import { Badge } from "@/shared/ui/shadcn/badge";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface GroupListProps {
  groups: GroupEntity[];
  loading: boolean;
  onEdit: (group: GroupEntity) => void;
  onDelete: (group: GroupEntity) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: GroupEntity[]) => void;
}

export function GroupList({
  groups,
  loading,
  onEdit,
  onDelete,
  selectable = false,
  onSelectionChange,
}: GroupListProps) {
  const { t } = useTranslation();
  const [deleteGroup, setDeleteGroup] = useState<GroupEntity | null>(null);

  const handleDeleteClick = (group: GroupEntity) => {
    setDeleteGroup(group);
  };

  const handleDeleteConfirm = () => {
    if (deleteGroup) {
      onDelete(deleteGroup);
      setDeleteGroup(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteGroup(null);
  };

  const columns = [
    // Hidden ID column (UUID not user-friendly)
    // {
    //     key: 'id',
    //     header: t('group.id'),
    //     accessor: (group: GroupEntity) => group.id,
    //     width: 'w-16',
    //     align: 'center' as const
    // },
    {
      key: "name",
      header: t("group.name"),
      accessor: (group: GroupEntity) => group.name,
      render: (group: GroupEntity) => group.name,
    },
    {
      key: "group_type",
      header: t("group.type"),
      accessor: (group: GroupEntity) => group.group_type,
      width: "w-32",
      render: (group: GroupEntity) => (
        <Badge variant="secondary" className="text-xs">
          {t(`lists.group_type.${group.group_type}`)}
        </Badge>
      ),
    },
    {
      key: "mark",
      header: t("group.mark"),
      accessor: (group: GroupEntity) => group.mark?.name || "",
      width: "w-32",
      render: (group: GroupEntity) =>
        group.mark ? (
          <Badge variant="outline" className="text-xs">
            {group.mark.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("common.none")}
          </span>
        ),
    },
    {
      key: "parent_id",
      header: t("group.parent"),
      accessor: (group: GroupEntity) => group.parent_id || "",
      width: "w-24",
      align: "center" as const,
      render: (group: GroupEntity) =>
        group.parent_id ? (
          <span className="font-mono text-xs">
            {groups.find(g => g.id === group.parent_id)?.name ?? ""}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("common.root")}
          </span>
        ),
    },
    {
      key: "discounts_count",
      header: t("group.discounts"),
      accessor: (group: GroupEntity) => group.discounts.length,
      width: "w-24",
      align: "center" as const,
      render: (group: GroupEntity) => (
        <Badge variant="default" className="text-xs">
          {group.discounts.length}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <div className="hidden md:block">
        <EntityTable
          data={groups}
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

      <div className="block md:hidden space-y-2 p-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="p-4 bg-card border rounded-md shadow-sm flex justify-between items-start"
          >
            <div>
              <div className="text-sm font-medium">{group.name}</div>

              <div className="mt-1 flex gap-2 items-center">
                <Badge variant="secondary" className="text-xs">
                  {t(`lists.group_type.${group.group_type}`)}
                </Badge>

                {group.mark ? (
                  <Badge variant="outline" className="text-xs">
                    {group.mark.name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">{t("common.none")}</span>
                )}
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                {group.parent_id
                  ? groups.find((g) => g.id === group.parent_id)?.name ?? ""
                  : t("common.root")}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge variant="default" className="text-xs">
                {group.discounts.length}
              </Badge>

              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(group)}
                  className="px-2 py-1 text-xs rounded border"
                >
                  {t("control.edit")}
                </button>

                <button
                  onClick={() => handleDeleteClick(group)}
                  className="px-2 py-1 text-xs rounded bg-red-600 text-white"
                >
                  {t("control.delete")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmationDialog
        open={!!deleteGroup}
        title={t("message.confirm_delete")}
        description={
          <>
            {t("message.delete_group_warning", { name: deleteGroup?.name })}
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
