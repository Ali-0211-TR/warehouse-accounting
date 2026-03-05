import type { CameraEntity } from "@/entities/camera";
import { emptyCamera, useCameraStore } from "@/entities/camera";
import { CameraDTO } from "@/shared/bindings/CameraDTO";
import { useToast } from "@/shared/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCameraFilters } from "./use-camera-filters";

export function useCamera() {
  const [selectedCamera, setSelectedCamera] = useState<CameraEntity | null>(
    null
  );
  const [formVisible, setFormVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { t } = useTranslation();

  const { cameras, loading, loadCameras, saveCamera, deleteCamera } =
    useCameraStore();

  const {
    filters,
    filteredCameras,
    hasActiveFilters,
    setFilters,
    clearFilters,
  } = useCameraFilters(cameras);

  const { showErrorToast, showSuccessToast } = useToast();

  useEffect(() => {
    loadCameras().catch(showErrorToast);
  }, [loadCameras, showErrorToast]);

  const onAdd = useCallback(() => {
    setSelectedCamera(emptyCamera);
    setFormVisible(true);
  }, []);

  const onEdit = useCallback((camera: CameraEntity) => {
    setSelectedCamera(camera);
    setFormVisible(true);
  }, []);

  const onDelete = useCallback(
    async (camera: CameraEntity) => {
      if (!camera.id) return;

      try {
        await deleteCamera(camera.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteCamera, showErrorToast, showSuccessToast, t]
  );

  const onSave = useCallback(
    async (cameraDto: CameraDTO) => {
      try {
        await saveCamera(cameraDto);

        showSuccessToast(
          cameraDto.id ? t("success.data_updated") : t("success.data_created")
        );
        setFormVisible(false);
        setSelectedCamera(null);
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [saveCamera, showErrorToast, showSuccessToast, t]
  );

  const onCancel = useCallback(() => {
    setFormVisible(false);
    setSelectedCamera(null);
  }, []);

  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
    setFormVisible(false);
    setSelectedCamera(null);
  }, []);

  const handleSetFilters = useCallback(
    (newFilters: any) => {
      setFilters(newFilters);
      setFormVisible(false);
      setSelectedCamera(null);
    },
    [setFilters]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setFormVisible(false);
    setSelectedCamera(null);
  }, [clearFilters]);

  return {
    cameras: filteredCameras,
    allCameras: cameras,
    selectedCamera,
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
    reload: loadCameras,
  };
}
