import { describe, expect, it } from 'vitest';
import { VERSION } from '../src/index';

describe('smoke', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
