import path from 'path';
import { ConfigRootSchema } from '../../src/config/schema.js';

describe('Config schema', () => {
  it('parses a valid minimal config', () => {
    const cfg = {
      version: 1,
      projects: [
        {
          name: 'demo',
          absoluteProjectDir: path.resolve(process.cwd()),
          targets: [
            {
              language: 'golang',
              category: 'project',
              sourcePath: 'docs/guide.md',
              targetRelPath: 'guidelines/golang/project/AGENTS.md',
            },
          ],
        },
      ],
    };
    const parsed = ConfigRootSchema.parse(cfg);
    expect(parsed.version).toBe(1);
    expect(parsed.projects[0].name).toBe('demo');
    expect(parsed.projects[0].targets[0].language).toBe('golang');
  });

  it('rejects invalid category pattern', () => {
    const bad = {
      version: 1,
      projects: [
        {
          name: 'demo',
          targets: [
            {
              language: 'golang',
              category: 'Project', // uppercase invalid
              sourcePath: 'a.md',
            },
          ],
        },
      ],
    };
    try {
      ConfigRootSchema.parse(bad);
      throw new Error('should fail');
    } catch (e: any) {
      expect(String(e.message)).toContain(
        'Invalid category: must match /^[a-z0-9-]+$/',
      );
    }
  });

  it('requires absolute absoluteProjectDir and relative targetRelPath', () => {
    const bad = {
      version: 1,
      projects: [
        {
          name: 'demo',
          absoluteProjectDir: 'relative/path',
          targets: [
            {
              language: 'golang',
              category: 'project',
              sourcePath: 'a.md',
              targetRelPath: '/abs/should-not-be-absolute.md',
            },
          ],
        },
      ],
    };
    try {
      ConfigRootSchema.parse(bad);
      throw new Error('should fail');
    } catch (e: any) {
      const msg = String(e.message);
      expect(msg).toContain('absoluteProjectDir must be an absolute path');
      expect(msg).toContain('targetRelPath must be a relative path');
    }
  });

  it('requires sourcePath', () => {
    const bad = {
      version: 1,
      projects: [
        {
          name: 'demo',
          targets: [
            {
              language: 'golang',
              category: 'project',
            } as any,
          ],
        },
      ],
    };
    try {
      ConfigRootSchema.parse(bad);
      throw new Error('should fail');
    } catch (e: any) {
      expect(String(e.message)).toContain('Source path must be provided');
    }
  });

  // 移除 fileNameByTool/defaultFileName 與 targetDirAbs/Rel 的驗證，改以 targetRelPath 直接指定完整相對路徑
});
