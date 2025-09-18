import { describe, it, expect } from 'vitest';

describe('Setup Tests', () => {
  it('should have working test environment', () => {
    expect(true).toBe(true);
  });

  it('should have access to DOM matchers', () => {
    const element = document.createElement('div');
    element.textContent = 'test';
    
    expect(element).toBeInTheDocument;
    expect(element.textContent).toBe('test');
  });

  it('should support async/await', async () => {
    const result = await Promise.resolve('async works');
    expect(result).toBe('async works');
  });
});