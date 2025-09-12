import fs from 'fs/promises';
import path from 'path';
import { applyConfig } from '../../src/tools/guidelines-apply-config.js';

async function makeTempCwd(
  prefix = 'apply-config-',
): Promise<{ dir: string; restore: () => void }> {
  const prev = process.cwd();
  const tmpRoot = path.join(prev, 'dist', 'test-tmp');
  await fs.mkdir(tmpRoot, { recursive: true });
  const dir = await fs.mkdtemp(path.join(tmpRoot, prefix));
  process.chdir(dir);
  return { dir, restore: () => process.chdir(prev) };
}

describe('guidelines-apply-config', () => {
  test('aggregate summaries across multiple targets and respect dryRun/force', async () => {
    const { dir, restore } = await makeTempCwd('agg-');
    try {
      // 準備來源檔案
      await fs.writeFile('a.md', 'Alpha', 'utf8');
      await fs.writeFile('b.md', 'Bravo', 'utf8');

      const configObject = {
        version: 1,
        defaults: { addManagedHeader: true },
        projects: [
          {
            name: 'p1',
            targets: [
              {
                language: 'typescript',
                category: 'project',
                sourcePath: 'a.md',
              },
            ],
          },
          {
            name: 'p2',
            targets: [
              {
                language: 'golang',
                category: 'repository',
                sourcePath: 'b.md',
              },
            ],
          },
        ],
      };

      // 第一次：dryRun 聚合（不落盤）
      const r1 = await applyConfig({
        tool: 'Codex CLI',
        configObject,
        overrides: { dryRun: true },
      });
      expect(r1.overall.added).toBe(2);
      // 確認實際未寫入
      for (const t of r1.targets) {
        const p = path.join(
          t.targetBaseDir,
          t.language === 'typescript' ? 'README.md' : 'README.md',
        );
        await expect(fs.stat(p)).rejects.toBeTruthy();
      }

      // 第二次：實際寫入（added）
      const r2 = await applyConfig({ tool: 'codex-cli', configObject });
      expect(r2.overall.added).toBe(2);
      // 再跑一次：應 skipped
      const r3 = await applyConfig({ tool: 'codex-cli', configObject });
      expect(r3.overall.skipped).toBe(2);

      // 修改其中一個來源，force 更新
      await fs.writeFile('a.md', 'Alpha v2', 'utf8');
      const r4 = await applyConfig({
        tool: 'codex-cli',
        configObject,
        overrides: { force: true, backup: true },
      });
      // 一個 updated，一個 skipped
      expect(r4.overall.updated).toBe(1);
      expect(
        r4.overall.skipped +
          r4.overall.added +
          r4.overall.conflict +
          r4.overall.updated,
      ).toBe(2);
    } finally {
      restore();
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
