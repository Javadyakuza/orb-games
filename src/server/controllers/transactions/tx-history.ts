import { supabase } from "@/server/middleware/supabase";
import { Response } from "@/server/models/custom/response";
import { TxHistory, txHistorySelector } from "@/server/models/db/tx_history";
import { Users, usersSelector } from "@/server/models/db/users";

async function getTxHIstories(wallet_address: string): Response<TxHistory> {
  // fetching the tx histories from the database
  const { data, error } = await supabase
    .from("tx_history")
    .select(txHistorySelector().all().build())
    .eq("wallet_address", wallet_address)
    .single();
  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }
  if (!data) {
    return {
      code: 404,
      message: `Transaction history for wallet address ${wallet_address} not found.`,
    };
  }
  return {
    code: 200,
    message: data as TxHistory,
  };
}

async function addTxHistory(tx_data: TxHistory): Response<TxHistory> {
  // adding a new tx history to the database
  const { error } = await supabase.from("tx_history").insert(tx_data);
  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }

  return {
    code: 200,
    message: "Transaction history added successfully.",
  };
}

export { getTxHIstories, addTxHistory };
