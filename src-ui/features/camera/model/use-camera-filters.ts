import { useState, useMemo } from 'react'
import { cameraSelectors } from '@/entities/camera'
import type { CameraEntity, CameraFilterState } from '@/entities/camera'

export function useCameraFilters(cameras: CameraEntity[]) {
    const [filters, setFilters] = useState<CameraFilterState>({
        search: '',
        camera_type: undefined
    })

    const filteredCameras = useMemo(() => {
        return cameraSelectors.filterCameras(cameras, filters)
    }, [cameras, filters])

    const hasActiveFilters = useMemo(() => {
        return filters.search !== '' ||
            filters.camera_type !== undefined
    }, [filters])

    const clearFilters = () => {
        setFilters({
            search: '',
            camera_type: undefined
        })
    }

    return {
        filters,
        filteredCameras,
        hasActiveFilters,
        setFilters,
        clearFilters
    }
}