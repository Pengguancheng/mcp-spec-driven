import winston from 'winston';
import path from 'path';
import fs from 'fs';

/**
 * 日誌工具：統一封裝應用程式的日誌行為
 * - 註解：使用中文
 * - 日誌訊息：使用英文（便於集中檢索與跨區排查）
 * - 匯出預設 logger，提供 info/warn/error/debug 等層級
 */

// 自訂等級（維持與 winston 預設相容順序）
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
} as const;

// 依環境決定日誌層級：
// - 可由 LOG_LEVEL 覆寫
// - 預設 dev 用 debug、非 dev 用 info
function resolveLevel(): keyof typeof levels {
  const fromEnv = (process.env.LOG_LEVEL || '').toLowerCase();
  if (fromEnv && fromEnv in levels) return fromEnv as keyof typeof levels;
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
}

// 色彩設定（僅主控台輸出使用）
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
});

// 共用時間戳格式
const timestamp = winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' });

// 主控台輸出：彩色 + 簡潔格式
const consoleFormat = winston.format.combine(
  timestamp,
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// 檔案輸出：不使用色彩，保留純文字
const fileFormat = winston.format.combine(
  timestamp,
  winston.format.uncolorize(),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// 準備日誌檔路徑，必要時建立目錄
const logDir = path.join(process.cwd(), 'logs');
try {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
} catch {
  // 若建立資料夾失敗，不中斷流程；僅讓檔案 transport 初始化時自行處理錯誤
}

const transports: winston.transport[] = [
  // 主控台輸出（所有環境皆啟用）
  new winston.transports.Console({ format: consoleFormat }),
];

// 測試環境外才寫檔，避免 CI/測試污染
if ((process.env.NODE_ENV || '').toLowerCase() !== 'test') {
  transports.push(
    new winston.transports.File({
      // 單一檔案收所有等級，不再依等級切分
      filename: path.join(logDir, 'app.log'),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      format: fileFormat,
    }),
  );
}

// 建立預設 logger
const logger = winston.createLogger({
  level: resolveLevel(),
  levels,
  transports,
});

export default logger;
