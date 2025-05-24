import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {I18nManager} from 'react-native'; // For RTL support detection

// Import your language files
import en from '../locales/en.json';
import ur from '../locales/ur.json';

const resources = {
  en: {
    translation: en,
  },
  ur: {
    translation: ur,
  },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en', // use en if selected language is not available
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    compatibilityJSON: 'v3', // For older Android devices / JS engines
    // React Native specific options
    react: {
      useSuspense: false, // Set to true if you are using Suspense for loading translations
    },
    // Detect and set right-to-left language layout
    // This is a basic example; more robust RTL handling might be needed
    // depending on the UI library and specific requirements.
    // initImmediate: false, // Important for some setups with RTL
    // preset: I18nManager.isRTL ? 'ar' : 'en', // Example, might need adjustment based on default lang
  })
  .then(() => {
    // After initialization, you can check the current language and RTL status
    // and apply layout changes if necessary.
    // For example, forcing RTL layout for Urdu:
    // if (i18n.language === 'ur') {
    //   I18nManager.forceRTL(true);
    // } else {
    //   I18nManager.forceRTL(false);
    // }
    // Note: Forcing RTL might require a reload of the app in some cases.
    // It's often better to handle RTL at the component/stylesheet level based on i18n.dir().
    console.log('i18n initialized. Language:', i18n.language, 'Is RTL:', I18nManager.isRTL);
  })
  .catch(err => console.error('i18n initialization error:', err));


export default i18n;
