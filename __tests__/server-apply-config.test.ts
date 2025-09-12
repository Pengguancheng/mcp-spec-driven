import fs from 'fs/promises';
import path from 'path';
import { runApplyConfigTool } from '../src/server.js';

describe('server tool: guidelines.applyConfig', () => {
  test('returns structured results and aggregates overall', async () => {
    const tmpFile = path.join(process.cwd(), 'a.md');
    await fs.writeFile(tmpFile, 'Hello', 'utf8');
    const configObject = {
      version: 1,
      projects: [
        {
          name: 'p1',
          targets: [
            { language: 'ts', category: 'project', sourcePath: 'a.md' },
          ],
        },
      ],
      defaults: { dryRun: true, addManagedHeader: true },
    };
    // 準備來源內容路徑：因為 dryRun=true，不會實際讀取檔案內容，僅需存在路徑字串
    const res = await runApplyConfigTool({ tool: 'codex-cli', configObject });
    expect(res).toHaveProperty('configBaseDir');
    expect(Array.isArray(res.targets)).toBe(true);
    expect(res.overall).toHaveProperty('added');
    // 單一 target，dry-run 狀態下應為 added 彙總 1
    expect(res.targets.length).toBe(1);
    const t = res.targets[0];
    expect(t).toHaveProperty('projectName', 'p1');
    expect(t).toHaveProperty('language', 'ts');
    expect(
      t.summary.added +
        t.summary.updated +
        t.summary.skipped +
        t.summary.conflict,
    ).toBe(1);
    await fs.rm(tmpFile, { force: true });
  });
});
