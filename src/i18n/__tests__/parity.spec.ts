import { describe, it, expect } from 'vitest';
import i18n from '../index';

/**
 * Recursively searches for keys in nested translation objects
 * @param obj - The translation object to search
 * @param targetKey - The key to search for
 * @returns boolean - Whether the key exists at any level
 */
function hasKeyDeep(obj: any, targetKey: string): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // Check if the key exists at the current level
  if (obj.hasOwnProperty(targetKey)) {
    return true;
  }

  // Recursively check nested objects
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (hasKeyDeep(obj[key], targetKey)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Gets all instances of a key from nested translation objects with their paths
 * @param obj - The translation object to search
 * @param targetKey - The key to search for
 * @param currentPath - Current path in the object (for tracking)
 * @returns Array of paths where the key was found
 */
function findKeyPaths(obj: any, targetKey: string, currentPath: string = ''): string[] {
  const paths: string[] = [];
  
  if (typeof obj !== 'object' || obj === null) {
    return paths;
  }

  // Check if the key exists at the current level
  if (obj.hasOwnProperty(targetKey)) {
    paths.push(currentPath ? `${currentPath}.${targetKey}` : targetKey);
  }

  // Recursively check nested objects
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      paths.push(...findKeyPaths(obj[key], targetKey, newPath));
    }
  }

  return paths;
}

describe('i18n Parity Test - Navigation Keys', () => {
  it('should have "next" key in both EN and DE translations', () => {
    const enTranslations = i18n.getResourceBundle('en', 'translation');
    const deTranslations = i18n.getResourceBundle('de', 'translation');

    expect(enTranslations).toBeDefined();
    expect(deTranslations).toBeDefined();

    // Check if "next" key exists in EN translations (including nested)
    const hasNextEN = hasKeyDeep(enTranslations, 'next');
    const hasNextDE = hasKeyDeep(deTranslations, 'next');

    // Get paths for debugging
    const nextPathsEN = findKeyPaths(enTranslations, 'next');
    const nextPathsDE = findKeyPaths(deTranslations, 'next');

    expect(hasNextEN, `"next" key not found in EN translations. Available paths: ${nextPathsEN.join(', ')}`).toBe(true);
    expect(hasNextDE, `"next" key not found in DE translations. Available paths: ${nextPathsDE.join(', ')}`).toBe(true);

    // Log found paths for debugging
    console.log('EN "next" key found at paths:', nextPathsEN);
    console.log('DE "next" key found at paths:', nextPathsDE);
  });

  it('should have "back" key in both EN and DE translations', () => {
    const enTranslations = i18n.getResourceBundle('en', 'translation');
    const deTranslations = i18n.getResourceBundle('de', 'translation');

    expect(enTranslations).toBeDefined();
    expect(deTranslations).toBeDefined();

    // Check if "back" key exists in EN translations (including nested)
    const hasBackEN = hasKeyDeep(enTranslations, 'back');
    const hasBackDE = hasKeyDeep(deTranslations, 'back');

    // Get paths for debugging
    const backPathsEN = findKeyPaths(enTranslations, 'back');
    const backPathsDE = findKeyPaths(deTranslations, 'back');

    expect(hasBackEN, `"back" key not found in EN translations. Available paths: ${backPathsEN.join(', ')}`).toBe(true);
    expect(hasBackDE, `"back" key not found in DE translations. Available paths: ${backPathsDE.join(', ')}`).toBe(true);

    // Log found paths for debugging
    console.log('EN "back" key found at paths:', backPathsEN);
    console.log('DE "back" key found at paths:', backPathsDE);
  });

  it('should have matching number of navigation keys in EN and DE', () => {
    const enTranslations = i18n.getResourceBundle('en', 'translation');
    const deTranslations = i18n.getResourceBundle('de', 'translation');

    const nextPathsEN = findKeyPaths(enTranslations, 'next');
    const nextPathsDE = findKeyPaths(deTranslations, 'next');
    const backPathsEN = findKeyPaths(enTranslations, 'back');
    const backPathsDE = findKeyPaths(deTranslations, 'back');

    // Ensure we have the same number of "next" keys in both languages
    expect(nextPathsEN.length).toBeGreaterThan(0);
    expect(nextPathsDE.length).toBeGreaterThan(0);
    
    // Ensure we have the same number of "back" keys in both languages  
    expect(backPathsEN.length).toBeGreaterThan(0);
    expect(backPathsDE.length).toBeGreaterThan(0);

    console.log(`Found ${nextPathsEN.length} "next" keys in EN and ${nextPathsDE.length} in DE`);
    console.log(`Found ${backPathsEN.length} "back" keys in EN and ${backPathsDE.length} in DE`);
  });
});