import fs from 'fs/promises';
import path from 'path';
import { placeGuidelines } from '../../src/tools/guidelines-placer.js';

/**
 * 測試說明（中文）：
 * - 覆蓋 dry-run/backup/force 與受管標記行為
 * - 測試使用臨時目錄，並在每個測試內切換 cwd 以符合程式邏輯（baseDir 基於 cwd）
 */

async function makeTempCwd(
  prefix = 'placer-test-',
): Promise<{ dir: string; restore: () => void }> {
  const prev = process.cwd();
  const tmpRoot = path.join(prev, 'dist', 'test-tmp');
  await fs.mkdir(tmpRoot, { recursive: true });
  const dir = await fs.mkdtemp(path.join(tmpRoot, prefix));
  process.chdir(dir);
  return { dir, restore: () => process.chdir(prev) };
}

describe('guidelines-placer', () => {
  test('dry-run: added should not write', async () => {
    const { dir, restore } = await makeTempCwd('dry-run-');
    try {
      const res = await placeGuidelines({
        language: 'typescript',
        tool: 'codex-cli',
        category: 'project',
        files: [{ content: '# Title', targetFileName: 'README.md' }],
        addManagedHeader: true,
        dryRun: true,
      });

      expect(res.added).toBe(1);
      expect(res.updated).toBe(0);
      expect(res.skipped).toBe(0);
      expect(res.conflict).toBe(0);

      const target = path.join(res.targetBaseDir, 'README.md');
      await expect(fs.stat(target)).rejects.toBeTruthy();
    } finally {
      restore();
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  test('conflict vs force+backup: update existing with backup created', async () => {
    const { dir, restore } = await makeTempCwd('update-');
    try {
      // 先寫入一份舊檔
      const res1 = await placeGuidelines({
        language: 'typescript',
        tool: 'codex-cli',
        category: 'project',
        files: [{ content: 'v1', targetFileName: 'README.md' }],
        addManagedHeader: false,
        dryRun: false,
      });
      expect(res1.added).toBe(1);
      const target = path.join(res1.targetBaseDir, 'README.md');
      expect((await fs.readFile(target, 'utf8')).trim()).toBe('v1');

      // 再以不同內容但不 force：應 conflict 不改動
      const res2 = await placeGuidelines({
        language: 'typescript',
        tool: 'codex-cli',
        category: 'project',
        files: [{ content: 'v2', targetFileName: 'README.md' }],
        addManagedHeader: false,
        dryRun: false,
        force: false,
        backup: true,
      });
      expect(res2.conflict).toBe(1);
      expect((await fs.readFile(target, 'utf8')).trim()).toBe('v1');

      // force + backup：應 updated 並建立備份
      const res3 = await placeGuidelines({
        language: 'typescript',
        tool: 'codex-cli',
        category: 'project',
        files: [{ content: 'v3', targetFileName: 'README.md' }],
        addManagedHeader: false,
        dryRun: false,
        force: true,
        backup: true,
      });
      expect(res3.updated).toBe(1);
      expect(res3.backupDir).toBeTruthy();
      expect((await fs.readFile(target, 'utf8')).trim()).toBe('v3');
    } finally {
      restore();
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  test('skip identical when content unchanged (with header)', async () => {
    const { dir, restore } = await makeTempCwd('identical-');
    try {
      const input = {
        language: 'typescript',
        tool: 'codex-cli',
        category: 'project',
        files: [{ content: '# Same', targetFileName: 'README.md' }],
        addManagedHeader: true,
        dryRun: false,
      } as const;

      const res1 = await placeGuidelines(input);
      expect(res1.added).toBe(1);

      const res2 = await placeGuidelines(input);
      expect(res2.skipped).toBe(1);
    } finally {
      restore();
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  test('managed header contains checksum and placed at top', async () => {
    const { dir, restore } = await makeTempCwd('header-');
    try {
      const res = await placeGuidelines({
        language: 'typescript',
        tool: 'codex-cli',
        category: 'project',
        files: [{ content: 'Hello World', targetFileName: 'GUIDE.md' }],
        addManagedHeader: true,
        dryRun: false,
      });
      const p = path.join(res.targetBaseDir, 'GUIDE.md');
      const text = await fs.readFile(p, 'utf8');
      const firstLine = text.split('\n')[0];
      expect(
        firstLine.startsWith('<!-- managed-by: mcp-spec-driven; checksum: '),
      ).toBe(true);
    } finally {
      restore();
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
