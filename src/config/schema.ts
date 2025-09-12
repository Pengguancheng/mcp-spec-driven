import { z } from 'zod';
import path from 'path';

/**
 * 設定檔 Zod Schema 與型別定義
 * - 註解：使用中文
 * - 錯誤訊息：使用英文（便於檢索與跨區排查）
 * - 匯出 schema 與對應 TS 型別
 */

// 識別字規則：小寫英數與連字號
const ID_PATTERN = /^[a-z0-9-]+$/;

// 共用錯誤訊息（英文）
const ERR_INVALID_LANGUAGE = 'Invalid language: must match /^[a-z0-9-]+$/';
const ERR_INVALID_CATEGORY = 'Invalid category: must match /^[a-z0-9-]+$/';
const ERR_ABSOLUTE_PROJECT_DIR = 'absoluteProjectDir must be an absolute path';
const ERR_TARGET_DIR_ABS = 'targetDirAbs must be an absolute path';
const ERR_SOURCE_REQUIRED = 'Source path must be provided';

// 驗證目標檔名（不得包含路徑分隔符）
function isValidFileName(name: string): boolean {
  if (!name) return false;
  return !name.includes('/') && !name.includes('\\');
}

export const DefaultsSchema = z
  .object({
    addManagedHeader: z.boolean().optional(),
    dryRun: z.boolean().optional(),
    backup: z.boolean().optional(),
    force: z.boolean().optional(),
  })
  .strict();

export const TargetConfigSchema = z
  .object({
    language: z
      .string()
      .min(1)
      .refine((v) => ID_PATTERN.test(v), { message: ERR_INVALID_LANGUAGE }),
    category: z
      .string()
      .min(1)
      .refine((v) => ID_PATTERN.test(v), { message: ERR_INVALID_CATEGORY }),
    targetDirAbs: z
      .string()
      .optional()
      .refine((v) => (v ? path.isAbsolute(v) : true), {
        message: ERR_TARGET_DIR_ABS,
      }),
    sourcePath: z.string({ required_error: ERR_SOURCE_REQUIRED }).min(1),
    fileNameByTool: z
      .record(z.string())
      .optional()
      .superRefine((obj, ctx) => {
        if (!obj) return;
        for (const [toolId, fileName] of Object.entries(obj)) {
          if (!ID_PATTERN.test(toolId)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Invalid tool id: must match /^[a-z0-9-]+$/`,
              path: [toolId],
            });
          }
          if (!isValidFileName(fileName)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Invalid target file name for tool '${toolId}'`,
              path: [toolId],
            });
          }
        }
      }),
    defaultFileName: z
      .string()
      .optional()
      .refine((v) => (v ? isValidFileName(v) : true), {
        message: `Invalid default target file name`,
      }),
  })
  .strict();

export const ProjectConfigSchema = z
  .object({
    name: z.string().min(1),
    packageName: z.string().optional(),
    absoluteProjectDir: z
      .string()
      .optional()
      .refine((v) => (v ? path.isAbsolute(v) : true), {
        message: ERR_ABSOLUTE_PROJECT_DIR,
      }),
    targets: z.array(TargetConfigSchema).min(1),
  })
  .strict();

export const ConfigRootSchema = z
  .object({
    version: z.number(),
    defaults: DefaultsSchema.optional(),
    projects: z.array(ProjectConfigSchema).min(1),
  })
  .strict();

// 型別輸出
export type Defaults = z.infer<typeof DefaultsSchema>;
export type TargetConfig = z.infer<typeof TargetConfigSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type ConfigRoot = z.infer<typeof ConfigRootSchema>;
