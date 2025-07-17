import { supabase } from "@/server/middleware/supabase";
import { Response } from "@/server/models/custom/response";
import { GameHistory } from "@/server/models/db/game_history";
import { fastHashCode as hash } from "fast-hash-code";
import { get } from "http";
import { getGameSetting } from "../settings/game-setting";
import {
  BtcPredReq,
  BtcPredSetting,
  BtcPredSide,
  GameSetting,
  GameStatus,
} from "@/server/models/custom/games";
import { toNano } from "@ton/core";
import { runBtcPredGame } from "@/server/services/games/btcPred";
import { getUser, updateUser, updateUserBalance } from "../users/user";
import { addGameHistory, updateGameHistory } from "./game-history";
import { Users } from "@/server/models/db/users";

async function runBtcPredictionGame(
  btc_pred_req: BtcPredReq
): Response<GameHistory> {
  // initiating the game inside the database
  let btc_pred_settings = await getGameSetting("btc_pred");

  let payout = Number(
    toNano(
      BigInt(btc_pred_req.amount) *
        BigInt(
          (btc_pred_settings.message as BtcPredSetting).game_settings.multiplier
        )
    )
  );

  let game_hash = hash(btc_pred_req.game_type + btc_pred_req + payout, {
    seed: Date.now(),
  }).toString();

  let init_res = await addGameHistory({
    wallet_address: btc_pred_req.wallet_address,
    game_type: "btc_pred",
    payout,
    status: GameStatus.INITIATED,
    game_hash,
    amount: btc_pred_req.amount,
  });

  if (init_res.code !== 200) {
    return {
      code: convertCode(init_res.message as string),
      message: init_res.message as string,
    };
  }

  // calling the game btc pred game service
  let btc_pred_res = await runBtcPredGame({
    watch_time_milli_secs: btc_pred_req.watch_time_milli_secs,
    pred: btc_pred_req.pred,
  });

  // updating the game history in the database
  let update_res = await updateGameHistory({
    game_hash,
    status: GameStatus.FINISHED,
    won: btc_pred_res.won,
    payout: payout,
    wallet_address: btc_pred_req.wallet_address,
    game_type: "btc_pred",
    amount: btc_pred_req.amount,
  });

  if (update_res.code !== 200) {
    return {
      code: convertCode(update_res.message as string),
      message: update_res.message as string,
    };
  }
  let user_balance = (await getUser(btc_pred_req.wallet_address))
    .message as Users;

  let new_balance = btc_pred_res.won
    ? user_balance.balance + payout
    : user_balance.balance - Number(toNano(btc_pred_req.amount));

  let update_user_res = await updateUserBalance(
    new_balance,
    btc_pred_req.wallet_address
  );

  if (update_user_res.code !== 200) {
    return {
      code: convertCode(update_user_res.message as string),
      message: update_user_res.message as string,
    };
  }
  return {
    code: 200,
    message: {
      game_hash,
      wallet_address: btc_pred_req.wallet_address,
      game_type: "btc_pred",
      payout,
      status: GameStatus.FINISHED,
      game_result: JSON.parse(JSON.stringify(btc_pred_res)),
      won: btc_pred_res.won,
      amount: btc_pred_req.amount,
    },
  };
}

export { runBtcPredictionGame };
