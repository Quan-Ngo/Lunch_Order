export const currencyConfig = {
    locale: 'vi-VN',
    currency: 'VND',
} as const;

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat(currencyConfig.locale, {
        style: 'currency',
        currency: currencyConfig.currency,
    }).format(value);
}
