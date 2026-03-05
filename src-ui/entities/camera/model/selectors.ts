import type { CameraEntity, CameraFilterState } from './types'

export const cameraSelectors = {
    filterCameras: (cameras: CameraEntity[], filters: CameraFilterState): CameraEntity[] => {
        return cameras.filter(camera => {
            const matchesSearch = !filters.search || 
                camera.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                camera.address.toLowerCase().includes(filters.search.toLowerCase())

            const matchesType = !filters.camera_type || 
                camera.camera_type === filters.camera_type

            return matchesSearch && matchesType
        })
    },

    sortCameras: (cameras: CameraEntity[], sortBy: keyof CameraEntity = 'name'): CameraEntity[] => {
        return [...cameras].sort((a, b) => {
            const aVal = a[sortBy]
            const bVal = b[sortBy]
            
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return aVal.localeCompare(bVal)
            }
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return aVal - bVal
            }
            
            return 0
        })
    },

    getCamerasByType: (cameras: CameraEntity[], type: string): CameraEntity[] => {
        return cameras.filter(camera => camera.camera_type === type)
    }
}