export type GameType = "fortune_wheel" | "btc_pred" | "slots";

export interface BaseGameSetting {
  gameType: GameType;
}

export interface FortuneWheelSetting extends BaseGameSetting {
  gameType: "fortune_wheel";
  multipliers: number[];
}

export interface BtcPredSetting extends BaseGameSetting {
  gameType: "btc_pred";
  multiplier: number;
}

export interface SlotsSetting extends BaseGameSetting {
  gameType: "slots";
  multiplier: number;
}

export type GameSetting = FortuneWheelSetting | BtcPredSetting | SlotsSetting;

// Type guard utilities
export const isFortuneWheelSetting = (
  setting: GameSetting
): setting is FortuneWheelSetting => setting.gameType === "fortune_wheel";

export const isBtcPredSetting = (
  setting: GameSetting
): setting is BtcPredSetting => setting.gameType === "btc_pred";

export const isSlotsSetting = (setting: GameSetting): setting is SlotsSetting =>
  setting.gameType === "slots";
