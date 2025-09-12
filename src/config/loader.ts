import path from 'path';
import { type ConfigRoot, ConfigRootSchema } from './schema.js';
import { normalizeId } from './normalize.js';
import fs from 'fs';

/**
 * 設定檔載入與展開（loader）
 * - 註解：中文
 * - 錯誤訊息：英文
 */

export interface LoadedConfig {
  config: ConfigRoot;
  configBaseDir: string;
}

/**
 * 從物件載入（已在上游取得 JSON 物件）。
 * @param obj 原始物件
 * @param configBaseDir 相對路徑基準（未提供則使用 process.cwd()）
 */
export function loadConfigFromObject(
  obj: unknown,
  configBaseDir?: string,
): LoadedConfig {
  const config = ConfigRootSchema.parse(obj);
  const baseDir = configBaseDir || process.cwd();
  return { config, configBaseDir: baseDir };
}

/**
 * 從檔案路徑載入設定（JSON）。
 * - 相對路徑基準以設定檔所在目錄為準。
 */
export function loadConfigFromPath(configPath: string): LoadedConfig {
  const abs = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);
  const raw = fs.readFileSync(abs, 'utf8');
  const json = JSON.parse(raw);
  const config = ConfigRootSchema.parse(json);
  return { config, configBaseDir: path.dirname(abs) };
}

export interface ExpandedTarget {
  projectName: string;
  projectRootDir: string;
  language: string;
  tool: string;
  category: string;
  sourcePathAbs: string;
  targetRelPath: string;
  targetBaseDir: string;
  targetFileName: string;
}

export interface ExpandOptions {
  config: ConfigRoot;
  tool: string; // 將以 normalizeId 處理
  configBaseDir: string; // 相對路徑來源基準
  repoRootDir: string; // 倉庫根目錄
}

/**
 * 展開設定為可供 placer 使用的目標清單。
 */
export function expandConfig(opts: ExpandOptions): ExpandedTarget[] {
  const toolId = normalizeId(opts.tool, 'tool');
  const out: ExpandedTarget[] = [];
  for (const proj of opts.config.projects) {
    const projectRootDir = proj.absoluteProjectDir
      ? proj.absoluteProjectDir
      : proj.packageName
        ? path.join(opts.repoRootDir, 'packages', proj.packageName)
        : opts.repoRootDir;

    for (const t of proj.targets) {
      const language = t.language; // 輸入已由 schema 驗證，保持原樣
      const category = t.category;
      const sourcePathAbs = path.isAbsolute(t.sourcePath)
        ? t.sourcePath
        : path.join(opts.configBaseDir, t.sourcePath);
      const targetRelPath = t.targetRelPath;
      const targetBaseDir = path.join(
        projectRootDir,
        path.dirname(targetRelPath),
      );
      const targetFileName = path.basename(targetRelPath);

      out.push({
        projectName: proj.name,
        projectRootDir,
        language,
        tool: toolId,
        category,
        sourcePathAbs,
        targetRelPath,
        targetBaseDir,
        targetFileName,
      });
    }
  }
  return out;
}

export default {
  loadConfigFromObject,
  loadConfigFromPath,
  expandConfig,
};
