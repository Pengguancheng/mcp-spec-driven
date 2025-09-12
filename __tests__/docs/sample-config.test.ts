import { describe, expect, it } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { ConfigRootSchema } from '../../src/config/schema.js';

describe('sample guidelines config', () => {
  it('should pass schema validation', async () => {
    const p = path.join(
      process.cwd(),
      'docs',
      'examples',
      '.guidelinesrc.sample.json',
    );
    const raw = await fs.readFile(p, 'utf8');
    const obj = JSON.parse(raw);
    const parsed = ConfigRootSchema.parse(obj);
    expect(parsed.version).toBe(1);
    expect(parsed.projects.length).toBeGreaterThan(0);
  });
});
