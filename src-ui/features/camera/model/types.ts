import type {
  CameraDTO,
  CameraEntity,
  CameraFilterState,
} from "@/entities/camera";

export interface CameraFeatureConfig {
  permissions: CameraPermissions;
  ui: CameraUIConfig;
  defaults: CameraDefaults;
}

export interface CameraPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canBulkDelete: boolean;
}

export interface CameraUIConfig {
  showFilters: boolean;
  showBulkActions: boolean;
  pageSize: number;
  sortable: boolean;
}

export interface CameraDefaults {
  camera_type: "IP" | "USB" | "Analog";
}

export interface CameraCrudActions {
  onAdd: () => void;
  onEdit: (camera: CameraEntity) => void;
  onDelete: (camera: CameraEntity) => void;
  onSave: (camera: CameraDTO) => Promise<void>;
  onCancel: () => void;
}

export interface CameraFilterActions {
  onShowFilters: () => void;
  onHideFilters: () => void;
  setFilters: (filters: CameraFilterState) => void;
  clearFilters: () => void;
}

export interface CameraListProps {
  cameras: CameraEntity[];
  loading?: boolean;
  onEdit: (camera: CameraEntity) => void;
  onDelete: (camera: CameraEntity) => void;
  onBulkDelete?: (cameras: CameraEntity[]) => void;
}

export interface CameraFormProps {
  visible: boolean;
  onHide: () => void;
  camera: CameraEntity | null;
  onSave: (camera: CameraDTO) => Promise<void>;
}

export interface CameraFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: CameraFilterState;
  onFiltersChange: (filters: CameraFilterState) => void;
}
