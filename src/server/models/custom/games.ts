export type GameType = "fortune_wheel" | "btc_pred" | "slots";

export interface BaseGameSetting {
  game_type: GameType;
  game_settings: any
}

export interface FortuneWheelSetting extends BaseGameSetting {
  game_type: "fortune_wheel";
  game_settings: {multipliers: number[]};
}

export interface BtcPredSetting extends BaseGameSetting {
  game_type: "btc_pred";
  game_settings: {multiplier: number;}
}

export interface SlotsSetting extends BaseGameSetting {
  game_type: "slots";
  game_settings: {multiplier: number};
}

export type GameSetting = FortuneWheelSetting | BtcPredSetting | SlotsSetting;

// Type guard utilities
export const isFortuneWheelSetting = (
  setting: GameSetting
): setting is FortuneWheelSetting => setting.game_type === "fortune_wheel";

export const isBtcPredSetting = (
  setting: GameSetting
): setting is BtcPredSetting => setting.game_type === "btc_pred";

export const isSlotsSetting = (setting: GameSetting): setting is SlotsSetting =>
  setting.game_type === "slots";
