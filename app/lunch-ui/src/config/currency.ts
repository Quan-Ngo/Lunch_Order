// ─────────────────────────────────────────────────────────────
// Locale Utilities — currency & date formatting
// No hardcoded locale. All formatting uses Intl APIs.
// ─────────────────────────────────────────────────────────────

/** Map i18next language code -> BCP-47 locale string */
export function langToLocale(lang: string): string {
    const normalizedLang = lang.toLowerCase();
    const map: Record<string, string> = {
        vi: 'vi-VN',
        en: 'en-US',
        de: 'de-DE',
        ja: 'ja-JP',
        'pt-br': 'pt-BR',
        ar: 'ar-SA',
        'zh-cn': 'zh-CN',
        'zh-hans': 'zh-CN',
    };
    return map[normalizedLang] ?? 'en-US';
}

/**
 * Format a monetary value using the active locale and currency code.
 * @param value   - numeric amount
 * @param currency - ISO 4217 code e.g. 'VND', 'USD', 'EUR'
 * @param locale  - BCP-47 locale string e.g. 'vi-VN', 'en-US', 'de-DE'
 */
export function formatPrice(value: number, currency = 'VND', locale = 'en-US'): string {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: currency === 'VND' || currency === 'JPY' ? 0 : 2,
        }).format(value);
    } catch {
        return `${value} ${currency}`;
    }
}

export function formatPriceLabel(value: number, currency = 'VND', locale = 'en-US'): string {
    return formatPrice(value, currency, locale);
}

/**
 * Format a date using the given locale.
 * @param date   - Date object or YYYY-MM-DD string
 * @param locale - BCP-47 locale string
 */
export function formatDate(
    date: Date | string,
    locale = 'en-US',
    options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
): string {
    const d = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
    return d.toLocaleDateString(locale, options);
}

/** Supported currency codes for the admin value help */
export const CURRENCY_OPTIONS = ['VND', 'USD', 'EUR', 'SGD', 'JPY', 'KRW', 'THB', 'GBP'] as const;
