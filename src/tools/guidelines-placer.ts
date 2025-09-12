import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * guidelines-placer：安全寫入執行器
 * - 註解：中文
 * - Log/Exception：英文
 * - 功能：dry-run/backup/force/受管標記 + checksum
 */

// 放置檔案規格
export interface PlaceFileSpec {
  /** 來源檔路徑（二擇一；若與 content 同時提供，以 content 為準） */
  sourcePath?: string;
  /** 直接提供內容（二擇一） */
  content?: string;

  /**
   * 目標定位（新行為，無向下相容）：必須指定「專案絕對路徑 + 檔案相對路徑」。
   * - 二者需同時提供；
   * - targetProjectDirAbs 必須為絕對路徑；
   * - targetRelPath 必須為相對路徑，可包含子資料夾；
   * - 會經由 path.resolve 校正並防止路徑跳脫（..）。
   */
  targetProjectDirAbs: string;
  targetRelPath: string;
}

// 放置請求
export interface PlaceGuidelinesInput {
  /** monorepo 套件名（若提供則 baseDir=packages/<name>；否則為 repo 根） */
  packageName?: string;
  /** 語言（小寫英數與連字號） */
  language: string;
  /** 工具（小寫英數與連字號） */
  tool: string;
  /** 類別（小寫英數與連字號） */
  category: string;
  /** 檔案清單 */
  files: PlaceFileSpec[];

  /** 僅預覽，不寫入 */
  dryRun?: boolean;
  /** 覆寫前備份既有檔案至 .backups/guidelines-<ts>/ */
  backup?: boolean;
  /** 差異時允許覆寫 */
  force?: boolean;
  /** 在檔案最前加入受管標記與 checksum */
  addManagedHeader?: boolean;
  /** 直接指定目標根目錄（絕對路徑），優先於 packageName 推導 */
  targetDirAbs?: string;
}

export type PlaceStatus = 'added' | 'updated' | 'skipped' | 'conflict';

export interface PlaceResultItem {
  /** 寫入目標完整路徑 */
  targetPath: string;
  /** 狀態：added/updated/skipped/conflict */
  status: PlaceStatus;
  /** 附加原因（例如 identical/exists-with-diff 等） */
  reason?: string;
}

export interface PlaceGuidelinesResult {
  /** 專案根（由 packageName 或 repo 根決定） */
  baseDir: string;
  /** 目標基準目錄（guidelines/<language>/<tool>/<category> 或覆寫） */
  targetBaseDir: string;
  /** 每個檔案的結果 */
  results: PlaceResultItem[];
  /** 統計 */
  added: number;
  updated: number;
  skipped: number;
  conflict: number;
  /** 若啟用備份且有實際寫入，回傳備份目錄 */
  backupDir?: string;
}

// 受管標記模板
const MANAGED_PREFIX = '<!-- managed-by: mcp-spec-driven; checksum: ';
const MANAGED_SUFFIX = ' -->\n\n';

/**
 * 計算內容的 sha256（以 utf8 編碼）。
 */
function sha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * 產生寫入內容（視需要加入受管標記與 checksum）。
 */
function buildContent(raw: string, addHeader?: boolean): string {
  if (!addHeader) return raw;
  const checksum = sha256(raw);
  return `${MANAGED_PREFIX}${checksum}${MANAGED_SUFFIX}${raw}`;
}

/**
 * 解析目標基準目錄。
 */
function resolveTargetBaseDir(
  input: PlaceGuidelinesInput,
  baseDir: string,
): string {
  if (input.targetDirAbs) return input.targetDirAbs;
  return path.join(
    baseDir,
    'guidelines',
    input.language,
    input.tool,
    input.category,
  );
}

/**
 * 確保資料夾存在（遞迴建立）。
 */
async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * 嘗試讀取檔案，若不存在則回傳 undefined。
 */
async function readIfExists(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (err: any) {
    if (err && err.code === 'ENOENT') return undefined;
    throw err;
  }
}

/**
 * 建立備份檔路徑，並將既有檔案複製到備份位置。
 */
async function backupFile(
  originalPath: string,
  backupRoot: string,
): Promise<string> {
  const rel = path.isAbsolute(originalPath)
    ? path.relative(process.cwd(), originalPath)
    : originalPath;
  const destPath = path.join(backupRoot, rel);
  await ensureDir(path.dirname(destPath));
  await fs.copyFile(originalPath, destPath);
  return destPath;
}

/**
 * placeGuidelines：執行 guidelines 放置（單一 targetBaseDir 下多檔案）。
 * - 根據 packageName 推導 baseDir（或使用 repo 根）；
 * - 目標目錄：guidelines/<language>/<tool>/<category>（或 targetDirAbs 覆寫）；
 * - 依 dryRun/backup/force 與受管標記處理寫入策略。
 */
export async function placeGuidelines(
  input: PlaceGuidelinesInput,
): Promise<PlaceGuidelinesResult> {
  // 決定 baseDir
  const repoRoot = process.cwd();
  const baseDir = input.packageName
    ? path.join(repoRoot, 'packages', input.packageName)
    : repoRoot;

  const targetBaseDir = resolveTargetBaseDir(input, baseDir);

  if (!input.files || input.files.length === 0) {
    throw new Error('No files provided');
  }

  const dryRun = !!input.dryRun;
  const backup = !!input.backup;
  const force = !!input.force;
  const addHeader = !!input.addManagedHeader;

  // 如需備份的根目錄（僅於有覆寫時建立）
  const backupRoot = path.join(baseDir, '.backups', `guidelines-${Date.now()}`);
  let backupDirUsed: string | undefined;

  const results: PlaceResultItem[] = [];
  let added = 0;
  let updated = 0;
  let skipped = 0;
  let conflict = 0;

  for (const file of input.files) {
    // 取得 source 內容
    let rawContent = '';
    if (typeof file.content === 'string') {
      rawContent = file.content;
    } else if (file.sourcePath) {
      const abs = path.isAbsolute(file.sourcePath)
        ? file.sourcePath
        : path.join(repoRoot, file.sourcePath);
      try {
        rawContent = await fs.readFile(abs, 'utf8');
      } catch (err: any) {
        throw new Error(
          `Failed to read source '${file.sourcePath}': ${err?.message || 'unknown error'}`,
        );
      }
    } else {
      throw new Error('Either content or sourcePath must be provided');
    }

    // 目標路徑解析（新行為，無向下相容）：必須指定專案絕對路徑 + 檔案相對路徑
    if (!file.targetProjectDirAbs || !file.targetRelPath) {
      throw new Error(
        'Both targetProjectDirAbs and targetRelPath are required',
      );
    }
    if (!path.isAbsolute(file.targetProjectDirAbs)) {
      throw new Error('targetProjectDirAbs must be an absolute path');
    }
    if (path.isAbsolute(file.targetRelPath)) {
      throw new Error('targetRelPath must be a relative path');
    }
    const resolved = path.resolve(file.targetProjectDirAbs, file.targetRelPath);
    // 防止路徑跳脫：確保 resolved 位於 targetProjectDirAbs 下
    const relFromProject = path.relative(file.targetProjectDirAbs, resolved);
    if (relFromProject.startsWith('..') || path.isAbsolute(relFromProject)) {
      throw new Error('targetRelPath escapes project directory');
    }
    const targetPath = resolved;

    const toWrite = buildContent(rawContent, addHeader);

    const existing = await readIfExists(targetPath);

    if (existing === undefined) {
      // 新增
      if (!dryRun) {
        await ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, toWrite, 'utf8');
      }
      results.push({ targetPath, status: 'added' });
      added += 1;
      continue;
    }

    // 已存在：比較內容
    if (existing === toWrite) {
      results.push({ targetPath, status: 'skipped', reason: 'identical' });
      skipped += 1;
      continue;
    }

    // 不同：force 與否
    if (!force) {
      results.push({
        targetPath,
        status: 'conflict',
        reason: 'exists-with-diff',
      });
      conflict += 1;
      continue;
    }

    // 允許覆寫
    if (!dryRun) {
      if (backup) {
        try {
          await ensureDir(backupRoot);
          await backupFile(targetPath, backupRoot);
          backupDirUsed = backupRoot;
        } catch (err: any) {
          logger.warn(`Backup failed: ${err?.message || 'unknown error'}`);
        }
      }
      await fs.writeFile(targetPath, toWrite, 'utf8');
    }
    results.push({ targetPath, status: 'updated' });
    updated += 1;
  }

  return {
    baseDir,
    // 以第一個檔案的資料夾作為 targetBaseDir（目前使用情境每次僅一檔）
    targetBaseDir: results[0]
      ? path.dirname(results[0].targetPath)
      : targetBaseDir,
    results,
    added,
    updated,
    skipped,
    conflict,
    backupDir: backupDirUsed,
  };
}

export default placeGuidelines;
