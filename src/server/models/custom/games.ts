export type GameType = "fortune_wheel" | "btc_pred" | "slots";

// game settings types //
export interface BaseGameSetting {
  game_type: GameType;
  game_settings: any;
}

export interface FortuneWheelSetting extends BaseGameSetting {
  game_type: "fortune_wheel";
  game_settings: { multipliers: number[] };
}

export interface BtcPredSetting extends BaseGameSetting {
  game_type: "btc_pred";
  game_settings: { multiplier: number };
}

export type SlotsSettingGameSettings = {
  multiplier: number;
  reel: Stops;
};
export interface SlotsSetting extends BaseGameSetting {
  game_type: "slots";
  game_settings: SlotsSettingGameSettings;
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

export enum GameStatus {
  INITIATED = "initiated",
  FINISHED = "finished",
}

// game logic types //
export enum BtcPredSide {
  UP = "up",
  DOWN = "down",
}
// the schema for api handler request
export type BtcPredReq = {
  game_type: "btc_pred";
  wallet_address: string;
  pred: BtcPredSide;
  amount: number;
  watch_time_milli_secs: number;
};

// schema for the game runner
export interface BtcPredGameParams {
  watch_time_milli_secs: number;
  pred: BtcPredSide;
}

// schema for the game runner response
export type BtcPredResponse = {
  won: boolean;
  start_price: number;
  end_price: number;
  watch_time_milli_secs: number;
  pred: BtcPredSide;
};

// the schema for the api handler request
export type FortuneWheelReq = {
  amount: number;
  game_type: "fortune_wheel";
  wallet_address: string;
};

// schema for the game runner
export interface FortuneWheelGameParams {
  amount: number;
  multipliers: number[];
}

// the schema for the game runner response
export interface FortuneWheelGameResponse {
  won: boolean;
  final_multiplier: number;
  multipliers_options: number[];
}
export interface Stop {
  id: number;
  element: string;
}
export type Stops = Stop[];

// the schema for the api handler request
export type SlotsReq = {
  amount: number;
  game_type: "slots";
  wallet_address: string;
};

// schema for the game runner
export interface SlotsGameParams {
  amount: number;
  stops: Stops;
}

// the schema for the game runner response
export interface SlotsGameResponse {
  won: boolean;
  final_result: [Stop, Stop, Stop];
}
