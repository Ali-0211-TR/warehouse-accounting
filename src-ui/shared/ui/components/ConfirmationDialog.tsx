import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/ui/shadcn/alert-dialog'

interface ConfirmationDialogProps {
    open: boolean
    title: React.ReactNode
    description: React.ReactNode
    confirmLabel?: React.ReactNode
    cancelLabel?: React.ReactNode
    onConfirm: () => void
    onCancel: () => void
    confirmClassName?: string
}

export function ConfirmationDialog({
    open,
    title,
    description,
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    confirmClassName,
}: ConfirmationDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onCancel}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className={confirmClassName}>
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}