import { createSelector, DynamicSelector } from "../global";

export interface GameHistory {
  id?: number;
  created_at?: string;
  game_hash?: string; // not null but handled in controller
  wallet_address: string;
  game_type: string;
  payout?: number;
  status: string;
  game_result?: any;
  won?: boolean;
  amount: number;
}

export const gameHIstoryStatics = [
  "id",
  "created_at",
  "game_hash",
  "wallet_address",
  "amount",
  "game_type",
  "payout",
  "status",
  "game_result",
  "won",
] as const;

export const gameHistorySelector = () => {
  return createSelector(gameHIstoryStatics);
};
