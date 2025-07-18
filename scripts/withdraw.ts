import { WithdrawParams } from "@/server/models/custom/contract";
import {
  createMessageHash,
  createRealSignature,
  getAdminSecKey,
} from "@/server/services/helpers";
import { Address } from "@ton/core";

export async function prepareWithdraw(params: WithdrawParams) {
  let msg_hash = createMessageHash(
    Address.parse(params.user_address),
    BigInt(params.amount),
    Date.now()
  );

  let sig = createRealSignature(msg_hash, await getAdminSecKey());

  return {
    msg_hash,
    sig,
  };
}
