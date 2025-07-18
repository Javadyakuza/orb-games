import { DepositEvent, WithdrawEvent } from "../../../../build/Escrow/Escrow_Escrow";

export interface extendedWithdrawEvent extends WithdrawEvent {
  tx_hash: string;
}

export interface extendedDepositEvent extends DepositEvent {
  tx_hash: string;
}

export interface WithdrawParams {
  user_address: string;
  amount: string;
}

export interface WithdrawResponse {
  message_hash: string;
  signature: string;
}