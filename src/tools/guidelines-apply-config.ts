import logger from '../utils/logger.js';
import { expandConfig, loadConfigFromObject, loadConfigFromPath } from '../config/loader.js';
import { placeGuidelines } from './guidelines-placer.js';

/**
 * apply-config：依設定檔批次呼叫 placer 並彙總結果
 * - 註解：中文
 * - Log/Exception：英文
 */

export interface ApplyConfigOverrides {
  addManagedHeader?: boolean;
  dryRun?: boolean;
  backup?: boolean;
  force?: boolean;
}

export interface ApplyConfigInput {
  tool: string;
  configPath?: string;
  configObject?: unknown;
  overrides?: ApplyConfigOverrides;
}

export interface TargetSummary {
  projectName: string;
  language: string;
  tool: string;
  category: string;
  targetBaseDir: string;
  summary: {
    added: number;
    updated: number;
    skipped: number;
    conflict: number;
  };
}

export interface ApplyConfigResult {
  configBaseDir: string;
  targets: TargetSummary[];
  overall: {
    added: number;
    updated: number;
    skipped: number;
    conflict: number;
  };
}

export async function applyConfig(
  input: ApplyConfigInput,
): Promise<ApplyConfigResult> {
  if (!input || !input.tool) throw new Error('tool is required');
  if (!input.configObject && !input.configPath) {
    throw new Error('Either configObject or configPath must be provided');
  }

  // 載入設定
  const loaded = input.configObject
    ? loadConfigFromObject(input.configObject)
    : loadConfigFromPath(input.configPath!);
  const repoRoot = process.cwd();

  // 展開目標
  const targets = expandConfig({
    config: loaded.config,
    tool: input.tool,
    configBaseDir: loaded.configBaseDir,
    repoRootDir: repoRoot,
  });

  // 合併 defaults 與 overrides
  const d = loaded.config.defaults || {};
  const o = input.overrides || {};
  const merged = {
    addManagedHeader: o.addManagedHeader ?? d.addManagedHeader ?? false,
    dryRun: o.dryRun ?? d.dryRun ?? false,
    backup: o.backup ?? d.backup ?? false,
    force: o.force ?? d.force ?? false,
  } as const;

  const results: TargetSummary[] = [];
  const overall = { added: 0, updated: 0, skipped: 0, conflict: 0 };

  for (const t of targets) {
    const relPath = t.targetRelPath;
    const res = await placeGuidelines({
      language: t.language,
      tool: t.tool,
      category: t.category,
      files: [
        {
          sourcePath: t.sourcePathAbs,
          targetProjectDirAbs: t.projectRootDir,
          targetRelPath: relPath,
        },
      ],
      addManagedHeader: merged.addManagedHeader,
      dryRun: merged.dryRun,
      backup: merged.backup,
      force: merged.force,
    });

    results.push({
      projectName: t.projectName,
      language: t.language,
      tool: t.tool,
      category: t.category,
      targetBaseDir: t.targetBaseDir,
      summary: {
        added: res.added,
        updated: res.updated,
        skipped: res.skipped,
        conflict: res.conflict,
      },
    });

    overall.added += res.added;
    overall.updated += res.updated;
    overall.skipped += res.skipped;
    overall.conflict += res.conflict;
  }

  logger.info(
    `apply-config finished: added=${overall.added}, updated=${overall.updated}, skipped=${overall.skipped}, conflict=${overall.conflict}`,
  );

  return { configBaseDir: loaded.configBaseDir, targets: results, overall };
}

export default applyConfig;
