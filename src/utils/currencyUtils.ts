import i18next from 'i18next'; // To get current language for locale-specific formatting

/**
 * Formats a number as a currency string.
 * Uses Intl.NumberFormat for locale-aware currency formatting.
 *
 * @param amount The number to format.
 * @param currencyCode The ISO 4217 currency code (e.g., "PKR", "USD", "EUR"). Defaults to "PKR".
 * @param locale The locale string (e.g., "en-US", "ur-PK"). Defaults to current i18next language or system default.
 * @returns The formatted currency string.
 */
export const formatCurrency = (
  amount: number | null | undefined,
  currencyCode: string = 'PKR', // Default to PKR as per project context
  locale?: string
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    // Return a default placeholder or empty string for invalid amounts
    return `${getCurrencySymbol(currencyCode)}0.00`; // Or just 'N/A', or t('common.notAvailable')
  }

  const currentLocale = locale || i18next.language || Platform.OS === 'ios' 
    ? NativeModules.SettingsManager.settings.AppleLocale || NativeModules.SettingsManager.settings.AppleLanguages[0] // iOS
    : NativeModules.I18nManager.localeIdentifier; // Android

  try {
    return new Intl.NumberFormat(currentLocale.replace('_', '-'), { // Ensure hyphenated locale
      style: 'currency',
      currency: currencyCode,
      // minimumFractionDigits: 2, // Default for most currencies
      // maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.warn(`Error formatting currency for locale ${currentLocale} and code ${currencyCode}:`, error);
    // Fallback to basic formatting if Intl.NumberFormat fails for some reason
    return `${getCurrencySymbol(currencyCode)}${amount.toFixed(2)}`;
  }
};

/**
 * Gets the currency symbol for a given currency code.
 * This is a simplified version. For comprehensive symbol support, a library might be better.
 * @param currencyCode The ISO 4217 currency code.
 * @returns The currency symbol string or the code itself if symbol not found.
 */
export const getCurrencySymbol = (currencyCode: string = 'PKR'): string => {
    // For a real app, you'd use a more robust way or rely on Intl.NumberFormat parts.
    // This is a very basic map for common cases.
    const symbols: {[key: string]: string} = {
        PKR: 'Rs. ', // Or just '₨' if font supports it well
        USD: '$',
        EUR: '€',
        GBP: '£',
        INR: '₹', 
    };
    return symbols[currencyCode.toUpperCase()] || currencyCode + ' '; // Fallback to code
};


// Example Usage:
// import { useTranslation } from 'react-i18next';
// const { t } = useTranslation();
// const currencySymbol = t('common.currencySymbol', 'Rs.'); // Get from i18n if defined there
// const formattedPrice = formatCurrency(1234.56, 'PKR'); // Uses i18next.language for locale
// const formattedPriceUSD = formatCurrency(50.99, 'USD', 'en-US');

// If you want to use the currency symbol from i18n as a prefix:
export const formatCurrencyWithI18nSymbol = (
    amount: number | null | undefined,
    currencySymbol: string,
    locale?: string
): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return `${currencySymbol}0.00`;
    }
    const currentLocale = locale || i18next.language || Platform.OS === 'ios' 
        ? NativeModules.SettingsManager.settings.AppleLocale || NativeModules.SettingsManager.settings.AppleLanguages[0]
        : NativeModules.I18nManager.localeIdentifier;
    
    try {
        // Format number part only
        const numberPart = new Intl.NumberFormat(currentLocale.replace('_', '-'), {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
        return `${currencySymbol}${numberPart}`;
    } catch (error) {
        console.warn(`Error formatting currency number part for locale ${currentLocale}:`, error);
        return `${currencySymbol}${amount.toFixed(2)}`;
    }
};

// Note: NativeModules import for locale detection
import { NativeModules, Platform } from 'react-native';
