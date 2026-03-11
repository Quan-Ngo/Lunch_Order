import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files
import enTranslation from './locales/en/translation.json';
import viTranslation from './locales/vi/translation.json';

export const APP_LANGUAGE_STORAGE_KEY = 'app-language';
export const SUPPORTED_LANGUAGES = ['en', 'vi'] as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function resolveSupportedLanguage(locale: string | null | undefined): SupportedLanguage | undefined {
    if (!locale) return undefined;

    const normalizedLocale = locale.toLowerCase().trim();
    const baseLanguage = normalizedLocale.split(/[-_]/)[0];

    if (SUPPORTED_LANGUAGES.includes(baseLanguage as SupportedLanguage)) {
        return baseLanguage as SupportedLanguage;
    }

    return undefined;
}

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslation },
            vi: { translation: viTranslation }
        },
        supportedLngs: SUPPORTED_LANGUAGES,
        nonExplicitSupportedLngs: true,
        load: 'languageOnly',
        fallbackLng: 'en',
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: APP_LANGUAGE_STORAGE_KEY,
            caches: ['localStorage'],
        },
        interpolation: {
            escapeValue: false // React already escapes by default
        }
    });

export default i18n;
