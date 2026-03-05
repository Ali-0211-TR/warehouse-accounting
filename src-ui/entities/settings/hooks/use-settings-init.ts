import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/providers/theme-provider';
import { useSettingsState } from '../settings.store';

/**
 * Hook to initialize and apply saved settings when the app starts
 */
export const useSettingsInit = () => {
    const { i18n } = useTranslation();
    const { setTheme } = useTheme();
    const { data, isInitialized, setInitialized } = useSettingsState();

    useEffect(() => {
        if (!isInitialized) {
            // Apply saved language
            if (data.lang && i18n.language !== data.lang) {
                i18n.changeLanguage(data.lang).catch(console.error);
            }

            // Apply saved theme
            if (data.theme) {
                setTheme(data.theme);
            }

            // Mark as initialized
            setInitialized(true);
        }
    }, [data.lang, data.theme, i18n, setTheme, isInitialized, setInitialized]);

    return {
        isInitialized,
        currentLanguage: data.lang,
        currentTheme: data.theme,
    };
};
