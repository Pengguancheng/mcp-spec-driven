import { describe, expect, it } from '@jest/globals';
import path from 'path';
import {
  assertAbsolute,
  normalizeId,
  validateTargetFileName,
} from '../../src/config/normalize.js';

describe('normalize helpers', () => {
  it('normalizeId lowercases and replaces spaces with hyphen', () => {
    expect(normalizeId('Go Lang')).toBe('go-lang');
    expect(normalizeId('typescript  tool')).toBe('typescript-tool');
  });

  it('normalizeId rejects invalid characters', () => {
    expect(() => normalizeId('Hello_World', 'id')).toThrow(
      'Invalid id: must match /^[a-z0-9-]+$/',
    );
  });

  it('assertAbsolute enforces absolute paths', () => {
    expect(() => assertAbsolute('relative/path', 'absoluteProjectDir')).toThrow(
      'absoluteProjectDir must be an absolute path',
    );
    expect(() => assertAbsolute(path.resolve('/tmp'))).not.toThrow();
  });

  it('validateTargetFileName checks separators and emptiness', () => {
    expect(validateTargetFileName('README.md')).toBe(true);
    expect(validateTargetFileName('AGENTS.md')).toBe(true);
    expect(validateTargetFileName('dir/name.md')).toBe(false);
    expect(validateTargetFileName('')).toBe(false);
  });
});
