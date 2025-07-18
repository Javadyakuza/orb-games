import { createSelector, DynamicSelector } from "../global";

export interface TxHistory {
  id?: number;
  created_at?: string;
  amount: number;
  tx_hash: string;
  wallet_address: string;
  deposit: boolean;
}

export const txHistoryStatics = [
  "id",
  "created_at",
  "amount",
  "tx_hash",
  "wallet_address",
  "deposit",
] as const;

export const txHistorySelector = () => {
  return createSelector(txHistoryStatics);
};
