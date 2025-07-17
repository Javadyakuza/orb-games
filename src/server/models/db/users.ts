import { createSelector, DynamicSelector } from "../global";

export interface Users {
  id?: number;
  created_at?: string;
  wallet_address: string;
  balance: number;
  telegram_id: string;
}

export const usersStatics = [
  "id",
  "created_at",
  "wallet_address",
  "balance",
  "telegram_id",
] as const;

export const usersSelector = () => {
  return createSelector(usersStatics);
};
