import {
  Address,
  beginCell,
  Cell,
  OpenedContract,
  Slice,
  TonClient,
  WalletContractV5R1,
} from "@ton/ton";
import "../../../types/globals";
import fs from "fs";
import path from "path";
import { mnemonicToPrivateKey, sign } from "@ton/crypto";

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

export async function getAdminWallet(
  tc: TonClient
): Promise<OpenedContract<WalletContractV5R1>> {
  if (!process.env.WALLET_MNEMONIC) {
    throw new Error("WALLET_MNEMONIC is not set");
  }
  const mnemonics = process.env.WALLET_MNEMONIC.split(" ");
  const keyPair = await mnemonicToPrivateKey(mnemonics);

  return tc.open(
    WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    })
  );
}

export async function getAdminSecKey(): Promise<Buffer> {
  if (!process.env.WALLET_MNEMONIC) {
    throw new Error("WALLET_MNEMONIC is not set");
  }
  const mnemonics = process.env.WALLET_MNEMONIC.split(" ");
  const keyPair = await mnemonicToPrivateKey(mnemonics);

  return keyPair.secretKey;
}
// Helper function to create message hash for withdrawal
function createMessageHash(
  userAddress: Address,
  amount: bigint,
  timestamp: number
): bigint {
  const messageCell = beginCell()
    .storeAddress(userAddress)
    .storeUint(amount, 64)
    .storeUint(Math.floor(timestamp / 3600), 32)
    .endCell();

  return BigInt("0x" + messageCell.hash().toString("hex"));
}

// Helper function to create real signature
function createRealSignature(messageHash: bigint, sec_key: Buffer): Slice {
  // Convert bigint to 32-byte buffer for signing
  const hashHex = messageHash.toString(16).padStart(64, "0");
  const hashBuffer = Buffer.from(hashHex, "hex");

  // Sign with admin's private key
  const signature = sign(hashBuffer, sec_key);

  return beginCell().storeBuffer(signature).endCell().asSlice();
}

export { createMessageHash, createRealSignature };
