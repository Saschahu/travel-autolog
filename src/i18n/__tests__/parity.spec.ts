import { describe, test, expect, beforeEach } from 'vitest';
import i18n from '../index';

// Define the resources structure based on the actual i18n setup
interface TranslationResources {
  en: {
    translation: Record<string, any>;
  };
  de: {
    translation: Record<string, any>;
  };
}

// Helper function to recursively search for keys in nested objects
function hasKey(obj: Record<string, any>, targetKey: string): boolean {
  if (obj.hasOwnProperty(targetKey)) {
    return true;
  }
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (hasKey(obj[key], targetKey)) {
        return true;
      }
    }
  }
  
  return false;
}

describe('i18n parity test', () => {
  let resources: TranslationResources;

  beforeEach(() => {
    // Access the resources from the i18n instance
    resources = i18n.options.resources as TranslationResources;
  });

  test('EN and DE should both contain "next" key', () => {
    const enHasNext = hasKey(resources.en.translation, 'next');
    const deHasNext = hasKey(resources.de.translation, 'next');
    
    expect(enHasNext, 'English translation should contain "next" key').toBe(true);
    expect(deHasNext, 'German translation should contain "next" key').toBe(true);
  });

  test('EN and DE should both contain "back" key', () => {
    const enHasBack = hasKey(resources.en.translation, 'back');
    const deHasBack = hasKey(resources.de.translation, 'back');
    
    expect(enHasBack, 'English translation should contain "back" key').toBe(true);
    expect(deHasBack, 'German translation should contain "back" key').toBe(true);
  });
});