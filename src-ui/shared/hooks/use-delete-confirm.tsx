import { useState } from 'react';
import { t } from 'i18next';
import useToast from '../hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';


type ConfirmDialogProps = {
    open: boolean;
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
};

function ConfirmDialog({ open, title, onConfirm, onCancel }: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onCancel}>
            <DialogContent className="max-w-xs w-full p-4">
                <DialogHeader>
                    <DialogTitle className="text-base">{t('control.delete')}</DialogTitle>
                </DialogHeader>
                <div className="py-2 text-sm">{t('title.confirm_delete', { title })}</div>
                <DialogFooter className="flex flex-row gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={onCancel}>
                        {t('control.cancel')}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={onConfirm}>
                        {t('control.delete')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export const useDeleteConfirm = () => {
    const { showErrorToast, showSuccessToast } = useToast();
    const [dialog, setDialog] = useState<{
        open: boolean;
        title: string;
        onConfirm: () => void;
    }>({ open: false, title: '', onConfirm: () => { } });

    const deleteConfirmation = (
        name: string,
        id: number,
        deleteFunction: (id: number) => Promise<void>
    ) => {
        setDialog({
            open: true,
            title: name,
            onConfirm: async () => {
                try {
                    await deleteFunction(id);
                    showSuccessToast(t('success.data_deleted'));
                } catch (e: any) {
                    showErrorToast(e.message);
                }
                setDialog((d) => ({ ...d, open: false }));
            },
        });
    };

    const ConfirmDialogComponent = (
        <ConfirmDialog
            open={dialog.open}
            title={dialog.title}
            onConfirm={dialog.onConfirm}
            onCancel={() => setDialog((d) => ({ ...d, open: false }))}
        />
    );

    return { deleteConfirmation, ConfirmDialogComponent };
};
