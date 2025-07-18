import { GameHistory } from "@/server/models/db/game_history";
import { Response } from "@/server/models/custom/response";
import { getGameSetting } from "../settings/game-setting";
import {
  FortuneWheelReq,
  FortuneWheelSetting,
  GameStatus,
} from "@/server/models/custom/games";
import { fastHashCode as hash } from "fast-hash-code";
import { addGameHistory, updateGameHistory } from "./game-history";
import { playFortuneWheelGame } from "@/server/services/games/fortuneWheel";
import { supabase } from "@/server/middleware/supabase";
import { toNano } from "@ton/core";
import { getUser, updateUserBalance } from "../users/user";
import { Users } from "@/server/models/db/users";

async function runFortuneWheelGame(
  fortune_wheel_req: FortuneWheelReq
): Response<GameHistory> {
  // initiating the game inside the database
  let fortune_wheel_settings = await getGameSetting("fortune_wheel");

  let game_hash = hash(
    fortune_wheel_req.game_type +
      fortune_wheel_req.wallet_address +
      String(fortune_wheel_req.amount),
    {
      seed: Date.now(),
    }
  ).toString();

  let init_res = await addGameHistory({
    wallet_address: fortune_wheel_req.wallet_address,
    game_type: "fortune_wheel",
    status: GameStatus.INITIATED,
    game_hash,
    amount: fortune_wheel_req.amount,
  });

  if (init_res.code !== 200) {
    return {
      code: convertCode(init_res.message as string),
      message: init_res.message as string,
    };
  }

  // calling the game fortune wheel game service
  // getting the multipliers options from the game settings
  let multipliers = (
    (await getGameSetting("fortune_wheel")).message as FortuneWheelSetting
  ).game_settings.multipliers;

  if (!multipliers) {
    return {
      code: 400,
      message: "multipliers not found in the game settings",
    };
  }

  let fortune_wheel_res = await playFortuneWheelGame({
    amount: fortune_wheel_req.amount,
    multipliers: multipliers,
  });

  let payout = Number(
    toNano(
      BigInt(fortune_wheel_req.amount) *
        BigInt(fortune_wheel_res.final_multiplier)
    )
  );

  // updating the game history in the database
  let update_res = await updateGameHistory({
    game_hash,
    status: GameStatus.FINISHED,
    won: fortune_wheel_res.won,
    payout: payout,
    wallet_address: fortune_wheel_req.wallet_address,
    game_type: "fortune_wheel",
    amount: fortune_wheel_req.amount,
  });

  if (update_res.code !== 200) {
    return {
      code: convertCode(update_res.message as string),
      message: update_res.message as string,
    };
  }

  // updating the user balance
  let user_balance = (await getUser(fortune_wheel_req.wallet_address))
    .message as Users;

  let new_balance = fortune_wheel_res.won
    ? user_balance.balance + payout
    : user_balance.balance - Number(toNano(fortune_wheel_req.amount));

  let update_user_res = await updateUserBalance(
      fortune_wheel_req.wallet_address,
      new_balance,
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
      wallet_address: fortune_wheel_req.wallet_address,
      game_type: "fortune_wheel",
      payout,
      status: GameStatus.FINISHED,
      game_result: JSON.parse(JSON.stringify(fortune_wheel_res)),
      won: fortune_wheel_res.won,
      amount: fortune_wheel_req.amount,
    },
  };
}
export { runFortuneWheelGame };
