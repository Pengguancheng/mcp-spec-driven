import { describe, expect, it } from '@jest/globals';
import path from 'path';
import { expandConfig, loadConfigFromObject } from '../../src/config/loader.js';

describe('config loader and expander', () => {
  const repoRoot = path.resolve('/repo');
  const baseDir = path.resolve('/cfg');

  it('uses absoluteProjectDir over packageName and repo root', () => {
    const obj = {
      version: 1,
      projects: [
        {
          name: 'p1',
          packageName: 'pkg-a',
          absoluteProjectDir: '/abs/project',
          targets: [
            { language: 'golang', category: 'project', sourcePath: 'a.md' },
          ],
        },
      ],
    };
    const { config } = loadConfigFromObject(obj, baseDir);
    const [t] = expandConfig({
      config,
      tool: 'codex-cli',
      configBaseDir: baseDir,
      repoRootDir: repoRoot,
    });
    expect(t.projectRootDir).toBe('/abs/project');
    expect(t.targetBaseDir).toBe(
      '/abs/project/guidelines/golang/codex-cli/project',
    );
    expect(t.sourcePathAbs).toBe('/cfg/a.md');
    expect(t.targetFileName).toBe('README.md');
  });

  it('falls back to packages/<name> then repo root', () => {
    const obj = {
      version: 1,
      projects: [
        {
          name: 'p2',
          packageName: 'x',
          targets: [
            {
              language: 'typescript',
              category: 'repository',
              sourcePath: '/abs/s.md',
            },
          ],
        },
        {
          name: 'p3',
          targets: [
            { language: 'python', category: 'handler', sourcePath: 'h.md' },
          ],
        },
      ],
    };
    const { config } = loadConfigFromObject(obj, baseDir);
    const targets = expandConfig({
      config,
      tool: 'Codex CLI',
      configBaseDir: baseDir,
      repoRootDir: repoRoot,
    });
    const t2 = targets.find((x) => x.projectName === 'p2')!;
    const t3 = targets.find((x) => x.projectName === 'p3')!;
    expect(t2.projectRootDir).toBe('/repo/packages/x');
    expect(t2.targetBaseDir).toBe(
      '/repo/packages/x/guidelines/typescript/codex-cli/repository',
    );
    expect(t2.sourcePathAbs).toBe('/abs/s.md');
    expect(t3.projectRootDir).toBe('/repo');
    expect(t3.targetBaseDir).toBe('/repo/guidelines/python/codex-cli/handler');
    expect(t3.sourcePathAbs).toBe('/cfg/h.md');
  });

  it('respects targetDirAbs override and filename mapping', () => {
    const obj = {
      version: 1,
      projects: [
        {
          name: 'p4',
          absoluteProjectDir: '/abs/y',
          targets: [
            {
              language: 'golang',
              category: 'domain-model',
              sourcePath: 'd.md',
              targetDirAbs: '/override/dir',
              defaultFileName: 'README.md',
              fileNameByTool: {
                'codex-cli': 'AGENTS.md',
              },
            },
          ],
        },
      ],
    };
    const { config } = loadConfigFromObject(obj, baseDir);
    const [t] = expandConfig({
      config,
      tool: 'codex-cli',
      configBaseDir: baseDir,
      repoRootDir: repoRoot,
    });
    expect(t.targetBaseDir).toBe('/override/dir');
    expect(t.targetFileName).toBe('AGENTS.md');
  });
});
