import { Toaster } from 'sonner';

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            richColors
            closeButton
            expand={false}
            duration={4000}
        />
    );
}
