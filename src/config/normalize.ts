import path from 'path';

/**
 * 正規化與驗證輔助
 * - 註解：中文
 * - 錯誤訊息：英文
 */

// 小寫英數與連字號
export const ID_PATTERN = /^[a-z0-9-]+$/;

/**
 * 將輸入轉為合法識別字：toLowerCase + 空白→-，並檢查 pattern。
 * @throws Error 當結果不符 ID_PATTERN
 */
export function normalizeId(input: string, kind = 'id'): string {
  const s = (input || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (!ID_PATTERN.test(s)) {
    throw new Error(`Invalid ${kind}: must match /^[a-z0-9-]+$/`);
  }
  return s;
}

/**
 * 斷言路徑為絕對路徑，不符合則拋出錯誤。
 */
export function assertAbsolute(p: string, field = 'path'): void {
  if (!path.isAbsolute(p)) {
    throw new Error(`${field} must be an absolute path`);
  }
}

/**
 * 驗證目標檔名：不得包含分隔符，且非空字串。
 */
export function validateTargetFileName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  if (name.includes('/') || name.includes('\\')) return false;
  return true;
}
