import "../../../types/globals";
import fs from "fs";
import path from "path";

global.convertCode = (codeString: string | null | undefined): number => {
  // Return 500 immediately if the input is null, undefined, or an empty string.
  if (!codeString) {
    return 500;
  }

  // Use a regular expression to find the first sequence of one or more digits (\d+).
  const match = codeString.match(/\d+/);

  // If a match is found, `match` will be an array (e.g., ['204']).
  // We parse the first matched group as an integer.
  if (match && match[0]) {
    const numericValue = parseInt(match[0], 10);
    return numericValue;
  }

  // If no numeric part is found in the string, return the default error code.
  return 500;
};

function logToFile(type: "log" | "error", ...args: any[]) {
  const logDir = path.resolve(process.cwd(), "listenerLogs");

  // Ensure directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Generate timestamped log file name: e.g., "2025-06-14_12-00-00.log"
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // "12-00-00"
  const logFileName = `${dateStr}_${timeStr}.log`;
  const logPath = path.join(logDir, logFileName);
  const logStream = fs.createWriteStream(logPath, { flags: "a" });
  const time = new Date().toISOString();
  const message = `[${time}] [${type.toUpperCase()}] ${args
    .map(String)
    .join(" ")}\n`;

  logStream.write(message);

  // Also output to console
  // if (type === "log") console.log(...args);
  // else console.error(...args);
}

export const fileSystemLogger = {
  log: (...args: any[]) => logToFile("log", ...args),
  error: (...args: any[]) => logToFile("error", ...args),
};
