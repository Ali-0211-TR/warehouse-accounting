import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translation_ru from './ru/translation.json';
import translation_uz from './uz/translation.json';

// Get saved language from localStorage or use default
const getSavedLanguage = () => {
    try {
        const savedSettings = localStorage.getItem('settings-storage');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            return settings.state?.data?.lang || 'ru';
        }
    } catch (error) {
    }
    return 'ru'; // fallback
};

i18n.use(initReactI18next).init({
    lng: getSavedLanguage(),
    debug: false, // set to true for debugging
    fallbackLng: 'ru',
    resources: {
        ru: {
            translation: translation_ru,
        },
        uz: {
            translation: translation_uz,
        },
    },
    interpolation: {
        escapeValue: false, // react already does escaping
    },
    // if you see an error like: "Argument of type 'DefaultTFuncReturn' is not assignable to parameter of type xyz"
    // set returnNull to false (and also in the i18next.d.ts options)
    // returnNull: false,
});

export default i18n;