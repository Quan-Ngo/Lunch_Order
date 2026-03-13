import { useTranslation } from 'react-i18next';
import { langToLocale, formatPrice, formatPriceLabel, formatDate } from '@/config/currency';

/**
 * React hook that returns locale-aware formatters.
 * Automatically tracks the current i18n language.
 *
 * Usage:
 *   const { formatPrice, formatDate } = useFormatters();
 *   formatPrice(food.price, food.currency)  // → "50.000 ₫" in vi-VN
 *   formatDate('2026-03-04')                // → "4 tháng 3 năm 2026" in vi-VN
 */
export function useFormatters() {
    const { i18n } = useTranslation();
    const locale = langToLocale(i18n.language);

    return {
        locale,
        formatPrice: (value: number, currency = 'VND') =>
            formatPrice(value, currency, locale),
        formatPriceLabel: (value: number, currency = 'VND') =>
            formatPriceLabel(value, currency, locale),
        formatDate: (
            date: Date | string,
            options?: Intl.DateTimeFormatOptions
        ) => formatDate(date, locale, options),
    };
}
