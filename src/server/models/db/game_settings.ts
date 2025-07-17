import { createSelector, DynamicSelector } from "../global";

export type GameSettings = {
  id?: string;
  created_at?: string;
  game_type: string;
  game_settings: any;
};

export const gameSettingStatics = [
  "id",
  "created_at",
  "game_type",
  "game_settings",
] as const;




export const gameSettingSelector = () => {
  return createSelector(gameSettingStatics);
};