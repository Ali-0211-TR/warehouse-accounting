import type { CameraEntity } from "@/entities/camera";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { EntityTable } from "@/shared/ui/components/EntityTable";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Eye, Video, Wifi, Edit, Trash } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CameraListProps {
  cameras: CameraEntity[];
  loading: boolean;
  onEdit: (camera: CameraEntity) => void;
  onDelete: (camera: CameraEntity) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: CameraEntity[]) => void;
}

export function CameraList({
  cameras,
  loading,
  onEdit,
  onDelete,
  selectable = false,
  onSelectionChange,
}: CameraListProps) {
  const { t } = useTranslation();
  const [deleteCamera, setDeleteCamera] = useState<CameraEntity | null>(null);

  const handleDeleteClick = (camera: CameraEntity) => {
    setDeleteCamera(camera);
  };

  const handleDeleteConfirm = () => {
    if (deleteCamera) {
      onDelete(deleteCamera);
      setDeleteCamera(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteCamera(null);
  };

  const getCameraTypeIcon = (type: string) => {
    switch (type) {
      case "IP":
        return <Wifi className="h-4 w-4" />;
      case "USB":
        return <Video className="h-4 w-4" />;
      case "Analog":
        return <Eye className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  const getCameraTypeColor = (type: string) => {
    switch (type) {
      case "IP":
        return "default";
      case "USB":
        return "secondary";
      case "Analog":
        return "outline";
      default:
        return "secondary";
    }
  };

  const columns = [
    // Hidden ID column (UUID not user-friendly)
    // {
    //     key: 'id',
    //     header: t('camera.id'),
    //     accessor: (camera: CameraEntity) => camera.id,
    //     width: 'w-16',
    //     align: 'center' as const
    // },
    {
      key: "name",
      header: t("camera.name"),
      accessor: (camera: CameraEntity) => camera.name,
      render: (camera: CameraEntity) => (
        <div className="flex items-center space-x-2">
          {getCameraTypeIcon(camera.camera_type)}
          <span className="font-medium">{camera.name}</span>
        </div>
      ),
    },
    {
      key: "camera_type",
      header: t("camera.type"),
      accessor: (camera: CameraEntity) => camera.camera_type,
      width: "w-24",
      render: (camera: CameraEntity) => (
        <Badge
          variant={getCameraTypeColor(camera.camera_type) as any}
          className="text-xs"
        >
          {t(`lists.camera_type.${camera.camera_type}`)}
        </Badge>
      ),
    },
    {
      key: "address",
      header: t("camera.address"),
      accessor: (camera: CameraEntity) => camera.address,
      width: "w-48",
      render: (camera: CameraEntity) => (
        <span className="font-mono text-sm">{camera.address}</span>
      ),
    },
    // {
    //     key: 'status',
    //     header: t('camera.status'),
    //     accessor: () => 'online', // This would come from real-time data
    //     width: 'w-24',
    //     align: 'center' as const,
    //     render: () => (
    //         <Badge variant="outline" className="text-xs">
    //             <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
    //             {t('camera.status.online')}
    //         </Badge>
    //     )
    // }
  ];

  return (
    <>
      {/* Table visible on md and larger */}
      <div className="hidden md:block">
        <EntityTable
          data={cameras}
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

      {/* Card list for small screens */}
      <div className="md:hidden p-4">
        <ul className="space-y-3">
          {cameras.map((camera) => (
            <li
              key={camera.id}
              className="bg-white dark:bg-slate-800 shadow-sm rounded-lg p-4 flex items-start justify-between"
            >
              <div className="flex items-start space-x-3">
                <div className="mt-1 text-slate-500">
                  {getCameraTypeIcon(camera.camera_type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{camera.name}</span>
                    <Badge
                      variant={getCameraTypeColor(camera.camera_type) as any}
                      className="text-xs"
                    >
                      {t(`lists.camera_type.${camera.camera_type}`)}
                    </Badge>
                  </div>
                  <div className="text-sm font-mono text-muted-foreground mt-1">
                    {camera.address}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  type="button"
                  aria-label={t("control.edit")}
                  onClick={() => onEdit(camera)}
                  className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t("control.delete")}
                  onClick={() => handleDeleteClick(camera)}
                  className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900 text-red-600"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteCamera}
        title={t("message.confirm_delete")}
        description={
          <>
            {t("message.delete_camera_warning", { name: deleteCamera?.name })}
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
