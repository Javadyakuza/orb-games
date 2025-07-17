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

async function runPredictionGame<T = GameHistory>(
  btc_pred_req: BtcPredReq
): Response<T> {
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

  let game_hash = hash(
    btc_pred_req.game_type + btc_pred_req + btc_pred_req.payout,
    {
      seed: Date.now(),
    }
  ).toString();

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

  if (btc_pred_res.won) {
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

    //updating the users balance in the database
    
  }
}

async function getGameHistory<T = GameHistory>(): Response<T> {
  //   fetching the game history from the database
}

async function updateGameHistory<T = GameHistory>(
  new_gh: GameHistory
): Response<T> {
  // updating the game history in the database
  const { error } = await supabase
    .from("game_history")
    .update(new_gh)
    .eq("game_hash", new_gh.game_hash);

  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }
  return {
    code: 200,
    message: "Game history updated successfully.",
  };
}

async function addGameHistory<T = GameHistory>(gh: GameHistory): Response<T> {
  // checking if the game was already initiated

  // adding a new game history to the database
  const { error } = await supabase.from("game_history").insert(gh);

  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }

  return {
    code: 200,
    message: "Game history initiated successfully.",
  };
}

export { runPredictionGame, getGameHistory, updateGameHistory, addGameHistory };
