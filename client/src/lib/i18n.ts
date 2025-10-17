// i18n utility for CareConnect24
// Supports German (de) and Slovenian (sl)

type Translations = Record<string, any>;

const translationsCache: Record<string, Translations> = {};

export type Language = 'de' | 'sl';

export async function loadTranslations(lang: Language): Promise<Translations> {
  if (translationsCache[lang]) {
    return translationsCache[lang];
  }

  try {
    const response = await fetch(`/locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${lang}`);
    }
    const translations = await response.json();
    translationsCache[lang] = translations;
    return translations;
  } catch (error) {
    console.error(`Error loading translations for ${lang}:`, error);
    // Fallback to German if loading fails
    if (lang !== 'de') {
      return loadTranslations('de');
    }
    return {};
  }
}

export function t(key: string, lang: Language = 'de'): string {
  const translations = translationsCache[lang] || {};
  
  // Navigate nested keys (e.g., "brand.name")
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key} (lang: ${lang})`);
      return key; // Return key as fallback
    }
  }
  
  return typeof value === 'string' ? value : key;
}

// Get current language from localStorage
export function getCurrentLanguage(): Language {
  const stored = localStorage.getItem('language');
  if (stored === 'de' || stored === 'sl') {
    return stored;
  }
  return 'de'; // Default to German
}

// Set current language in localStorage
export function setCurrentLanguage(lang: Language): void {
  localStorage.setItem('language', lang);
}

