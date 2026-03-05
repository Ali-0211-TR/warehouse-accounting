import type { NozzleEntity } from '@/entities/dispenser'
import { ConfirmationDialog } from '@/shared/ui/components/ConfirmationDialog'
import { EntityTable } from '@/shared/ui/components/EntityTable'
import { t } from 'i18next'
import { useState } from 'react'

interface NozzleListProps {
    nozzles: NozzleEntity[]
    loading: boolean
    onEdit: (nozzle: NozzleEntity) => void
    onDelete: (nozzle: NozzleEntity) => void
    onAdd: () => void
}

export function NozzleList({
    nozzles,
    loading,
    onEdit,
    onDelete,
    onAdd
}: NozzleListProps) {
    const [deleteNozzle, setDeleteNozzle] = useState<NozzleEntity | null>(null)

    const handleDeleteClick = (nozzle: NozzleEntity) => {
        setDeleteNozzle(nozzle)
    }

    const handleDeleteConfirm = () => {
        if (deleteNozzle) {
            onDelete(deleteNozzle)
            setDeleteNozzle(null)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteNozzle(null)
    }

    const columns = [
        // {
        //     key: 'id',
        //     header: t('nozzle.id'),
        //     accessor: (nozzle: NozzleEntity) => nozzle.id,
        //     width: 'w-16',
        //     align: 'center' as const
        // },
        {
            key: 'address',
            header: t('nozzle.address'),
            accessor: (nozzle: NozzleEntity) => nozzle.address,
            width: 'w-24',
            align: 'center' as const,
            render: (nozzle: NozzleEntity) => (
                <span className="font-mono px-2 py-1 rounded text-sm">
                    {nozzle.address}
                </span>
            )
        },
        {
            key: 'tank',
            header: t('nozzle.product'),
            accessor: (nozzle: NozzleEntity) => nozzle.tank?.name || '',
            render: (nozzle: NozzleEntity) => (
                nozzle.tank ? (
                    <div className="flex items-center gap-2">
                        {/* <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: nozzle.tank.color || '#gray' }}
                        /> */}
                        <span>{nozzle.tank.product?.name}</span>
                    </div>
                ) : (
                    <span className="text-muted-foreground text-xs">
                        {t('common.none')}
                    </span>
                )
            )
        }
    ]

    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{t('nozzle.nozzles')}</h3>
                    <button
                        onClick={onAdd}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm"
                    >
                        {t('nozzle.add_nozzle')}
                    </button>
                </div>

                <EntityTable
                    data={nozzles}
                    columns={columns}
                    loading={loading}
                    onEdit={onEdit}
                    onDelete={handleDeleteClick}
                    emptyMessage={t('message.no_nozzles')}
                    pageSize={10}
                // hideExportButtons
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                open={!!deleteNozzle}
                title={t('message.confirm_delete')}
                description={
                    <>
                        {t('message.delete_nozzle_warning', { address: deleteNozzle?.address })}
                        <br />
                        <span className="text-red-600 font-medium">
                            {t('message.action_irreversible')}
                        </span>
                    </>
                }
                confirmLabel={t('control.delete')}
                cancelLabel={t('control.cancel')}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                confirmClassName="bg-red-600 hover:bg-red-700"
            />
        </>
    )
}
